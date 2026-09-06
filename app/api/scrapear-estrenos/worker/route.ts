import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

// ========================================
// CONFIGURACIÓN
// ========================================
const TMDB_API_KEY = process.env.TMDB_API_KEY || "67fff863bf6ae181cd30a3519662ea70";
const FECHA_INICIO = "2026-01-01";
const HOY = new Date().toISOString().split("T")[0];
const LIMITE_POR_EJECUCION = 10; // Procesar de a 10 películas por ejecución

// ========================================
// WORKER PRINCIPAL
// ========================================
export async function GET() {
  try {
    console.log("🔄 Worker de scraping iniciado");

    // ========================================
    // BUSCAR UNA TAREA PENDIENTE
    // ========================================
    const { data: tarea, error } = await supabaseAdmin
      .from("tareas_scraping")
      .select("*")
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error al buscar tarea:", error);
      return NextResponse.json({ error: "Error al buscar tarea" }, { status: 500 });
    }

    if (!tarea) {
      return NextResponse.json({ mensaje: "No hay tareas pendientes" });
    }

    console.log(`📋 Procesando tarea ${tarea.id}`);

    // ========================================
    // MARCAR COMO "PROCESANDO"
    // ========================================
    await supabaseAdmin
      .from("tareas_scraping")
      .update({ estado: "procesando" })
      .eq("id", tarea.id);

    // ========================================
    // PROCESAR LAS PELÍCULAS
    // ========================================
    const resultado = await procesarPeliculas(tarea.id);

    // ========================================
    // ACTUALIZAR TAREA CON RESULTADOS
    // ========================================
    await supabaseAdmin
      .from("tareas_scraping")
      .update({
        estado: resultado.errores > 0 ? "error" : "completado",
        fecha_fin: new Date().toISOString(),
        total_encontradas: resultado.total_encontradas,
        nuevas: resultado.nuevas,
        ya_existentes: resultado.ya_existentes,
        errores: resultado.errores,
        mensaje: resultado.mensaje,
      })
      .eq("id", tarea.id);

    console.log(`✅ Tarea ${tarea.id} completada`);

    return NextResponse.json({
      mensaje: "Scraping completado",
      tarea_id: tarea.id,
      ...resultado,
    });

  } catch (error) {
    console.error("Error en worker:", error);
    return NextResponse.json({ error: "Error en el worker" }, { status: 500 });
  }
}

// ========================================
// FUNCIÓN: PROCESAR PELÍCULAS
// ========================================
async function procesarPeliculas(tareaId: number) {
  let nuevas = 0;
  let yaExisten = 0;
  let errores = 0;
  let totalEncontradas = 0;

  try {
    // ========================================
    // OBTENER PELÍCULAS DE TMDB (2026)
    // ========================================
    const peliculas = await obtenerPeliculasTMDB(2026);
    totalEncontradas = peliculas.length;
    console.log(`📋 Encontradas ${totalEncontradas} películas en TMDB (2026)`);

    // ========================================
    // FILTRAR SOLO ESTRENOS DE 2026
    // ========================================
    const estrenos2026 = peliculas.filter(p => {
      if (!p.release_date) return false;
      return new Date(p.release_date).getFullYear() === 2026;
    });

    console.log(`🎬 ${estrenos2026.length} películas estrenadas en 2026`);

    // ========================================
    // PROCESAR CADA PELÍCULA (con límite)
    // ========================================
    const totalAProcesar = Math.min(estrenos2026.length, LIMITE_POR_EJECUCION);

    for (let i = 0; i < totalAProcesar; i++) {
      const pelicula = estrenos2026[i];
      try {
        // Verificar si ya existe
        const { data: existente } = await supabaseAdmin
          .from("peliculas")
          .select("id")
          .eq("titulo", pelicula.title)
          .maybeSingle();

        if (existente) {
          yaExisten++;
          continue;
        }

        // Buscar link en Cinecalidad
        const linkCinecalidad = await buscarEnCinecalidad(pelicula.title);
        let linkLimpio = linkCinecalidad;
        if (linkCinecalidad) {
          linkLimpio = await limpiarLink(linkCinecalidad);
        }

        // Guardar en la base de datos
        const { error } = await supabaseAdmin
          .from("peliculas")
          .insert({
            titulo: pelicula.title,
            anio: pelicula.release_date ? pelicula.release_date.split("-")[0] : "2026",
            genero: pelicula.genres?.[0]?.name || "Desconocido",
            sinopsis: pelicula.overview || "Sin sinopsis disponible",
            caratula: pelicula.poster_path 
              ? `https://image.tmdb.org/t/p/original${pelicula.poster_path}` 
              : "",
            link_directo: linkLimpio || "",
            fuente: "auto",
            creado_en: new Date().toISOString(),
          });

        if (error) {
          console.error(`❌ Error al guardar ${pelicula.title}:`, error);
          errores++;
        } else {
          nuevas++;
          console.log(`✅ Guardada: ${pelicula.title}`);
        }

        // Actualizar progreso cada 5 películas
        if (i % 5 === 0) {
          await supabaseAdmin
            .from("tareas_scraping")
            .update({
              nuevas,
              ya_existentes: yaExisten,
              errores,
              mensaje: `Procesando ${i + 1}/${totalAProcesar}...`,
            })
            .eq("id", tareaId);
        }

        // Pausa para no saturar
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`❌ Error procesando ${pelicula.title}:`, error);
        errores++;
      }
    }

  } catch (error) {
    console.error("Error en procesarPeliculas:", error);
    errores++;
  }

  return {
    total_encontradas: totalEncontradas,
    nuevas,
    ya_existentes: yaExisten,
    errores,
    mensaje: `Procesadas ${nuevas + yaExisten + errores} películas`,
  };
}

// ========================================
// FUNCIÓN: OBTENER PELÍCULAS DE TMDB
// ========================================
async function obtenerPeliculasTMDB(año: number) {
  const peliculas = [];
  let pagina = 1;
  const totalPaginas = 3; // Limitamos a 3 páginas para evitar timeout

  try {
    for (let i = 0; i < totalPaginas; i++) {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=es-ES&sort_by=popularity.desc&primary_release_year=${año}&page=${pagina}`;
      
      const res = await fetch(url);
      if (!res.ok) break;

      const data = await res.json();
      if (data.results) {
        peliculas.push(...data.results);
        console.log(`📄 Página ${pagina}: ${data.results.length} películas`);
      }
      pagina++;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error("Error en TMDB:", error);
  }

  return peliculas;
}

// ========================================
// FUNCIÓN: BUSCAR EN CINECALIDAD
// ========================================
async function buscarEnCinecalidad(titulo: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.cinecalidad.am/?s=${encodeURIComponent(titulo)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const linkMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="[^"]*"[^>]*>/i);
    
    if (linkMatch) {
      const link = linkMatch[1];
      return link.startsWith("http") ? link : `https://www.cinecalidad.am${link}`;
    }

    return null;
  } catch (error) {
    console.error(`Error buscando "${titulo}" en Cinecalidad:`, error);
    return null;
  }
}

// ========================================
// FUNCIÓN: LIMPIAR LINK
// ========================================
async function limpiarLink(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Referer": "https://www.cinecalidad.am/",
      },
    });

    if (!res.ok) return url;

    const html = await res.text();

    const patrones = [
      /<iframe[^>]*src=["']([^"']*)["'][^>]*>/gi,
      /<video[^>]*src=["']([^"']*)["'][^>]*>/gi,
      /<source[^>]*src=["']([^"']*)["'][^>]*>/gi,
      /file\s*:\s*["']([^"']*)["']/gi,
      /url\s*:\s*["']([^"']*)["']/gi,
    ];

    for (const patron of patrones) {
      const regex = new RegExp(patron, 'gi');
      let match;
      while ((match = regex.exec(html)) !== null) {
        const link = match[1];
        if (link && 
            !link.includes('data:') && 
            !link.includes('javascript:') &&
            !link.includes('google') &&
            !link.includes('facebook')) {
          return link;
        }
      }
    }

    return url;
  } catch (error) {
    console.error("Error al limpiar link:", error);
    return url;
  }
}
