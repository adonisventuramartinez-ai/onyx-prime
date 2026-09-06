import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

// ========================================
// CONFIGURACIÓN
// ========================================
const TMDB_API_KEY = process.env.TMDB_API_KEY || "67fff863bf6ae181cd30a3519662ea70";
const FECHA_INICIO = "2026-01-01";
const HOY = new Date().toISOString().split("T")[0];

// ========================================
// FUNCIÓN PRINCIPAL
// ========================================
export async function GET() {
  try {
    console.log(`🎬 Iniciando scraping de estrenos desde ${FECHA_INICIO} hasta ${HOY}`);
    
    // ========================================
    // PASO 1: OBTENER PELÍCULAS DE TMDB POR AÑO
    // ========================================
    const peliculasTMDB = await obtenerPeliculasTMDB(2026);
    console.log(`📋 Encontradas ${peliculasTMDB.length} películas en TMDB (2026)`);

    // ========================================
    // PASO 2: FILTRAR SOLO LAS QUE TIENEN ESTRENO EN 2026
    // ========================================
    const estrenos2026 = peliculasTMDB.filter(p => {
      if (!p.release_date) return false;
      const año = new Date(p.release_date).getFullYear();
      return año === 2026;
    });

    console.log(`🎬 ${estrenos2026.length} películas estrenadas en 2026`);

    // ========================================
    // PASO 3: PARA CADA PELÍCULA, BUSCAR LINK EN CINECALIDAD
    // ========================================
    let nuevas = 0;
    let yaExisten = 0;
    let errores = 0;

    for (const pelicula of estrenos2026) {
      try {
        // Verificar si ya existe en la base de datos
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
        
        // Limpiar el link
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
        
        // Pequeña pausa para no sobrecargar los servidores
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Error procesando ${pelicula.title}:`, error);
        errores++;
      }
    }

    return NextResponse.json({
      mensaje: "Scraping completado",
      total_encontradas: estrenos2026.length,
      nuevas,
      ya_existentes: yaExisten,
      errores,
      fecha_inicio: FECHA_INICIO,
      fecha_fin: HOY,
    });

  } catch (error) {
    console.error("Error general:", error);
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}

// ========================================
// FUNCIÓN: OBTENER PELÍCULAS DE TMDB POR AÑO
// ========================================
async function obtenerPeliculasTMDB(año: number) {
  const peliculas = [];
  let pagina = 1;
  let totalPaginas = 1;

  try {
    while (pagina <= totalPaginas) {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=es-ES&sort_by=popularity.desc&primary_release_year=${año}&page=${pagina}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Error TMDB: ${res.status}`);
        break;
      }

      const data = await res.json();
      totalPaginas = Math.min(data.total_pages, 10); // Máximo 10 páginas para no saturar
      
      if (data.results) {
        peliculas.push(...data.results);
        console.log(`📄 Página ${pagina}: ${data.results.length} películas`);
      }

      pagina++;
      
      // Pausa entre páginas
      await new Promise(resolve => setTimeout(resolve, 300));
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

    // Buscar link de video
    const patrones = [
      /<iframe[^>]*src=["']([^"']*)["'][^>]*>/gi,
      /<video[^>]*src=["']([^"']*)["'][^>]*>/gi,
      /<source[^>]*src=["']([^"']*)["'][^>]*>/gi,
      /file\s*:\s*["']([^"']*)["']/gi,
      /url\s*:\s*["']([^"']*)["']/gi,
      /src\s*:\s*["']([^"']*)["']/gi,
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
            !link.includes('facebook') &&
            !link.includes('twitter')) {
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
