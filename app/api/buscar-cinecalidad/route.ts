import { NextRequest, NextResponse } from "next/server";

// API Key pública de TMDB (puedes usar la tuya)
const TMDB_API_KEY = "528f5aaebfb0c656e0974c07c3cba128";

export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");
  const linkDirectoProporcionado = req.nextUrl.searchParams.get("link");

  // Si el usuario pegó un link directo de Cinecalidad
  if (linkDirectoProporcionado) {
    try {
      const pelicula = await extraerDeCinecalidad(linkDirectoProporcionado);
      if (pelicula) return NextResponse.json({ pelicula });
    } catch (error) {
      console.error("Error al extraer desde link:", error);
    }
  }

  if (!nombre) {
    return NextResponse.json({ error: "Nombre de película requerido" }, { status: 400 });
  }

  try {
    // ========================================
    // PASO 1: BUSCAR EN TMDB (datos confiables)
    // ========================================
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(nombre)}&language=es-ES`
    );

    if (!tmdbRes.ok) {
      return NextResponse.json({ error: "Error al buscar en TMDB" }, { status: 500 });
    }

    const tmdbData = await tmdbRes.json();

    if (!tmdbData.results || tmdbData.results.length === 0) {
      return NextResponse.json({ error: "No se encontró la película en TMDB" }, { status: 404 });
    }

    const movie = tmdbData.results[0];

    // ========================================
    // PASO 2: BUSCAR LINK EN CINECALIDAD
    // ========================================
    let linkCinecalidad = "";
    const searchUrl = `https://www.cinecalidad.am/?s=${encodeURIComponent(movie.title)}`;
    
    try {
      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (res.ok) {
        const html = await res.text();
        // Buscar el primer resultado
        const linkMatch = html.match(/<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="[^"]*"[^>]*>/i);
        if (linkMatch) {
          const link = linkMatch[1];
          linkCinecalidad = link.startsWith("http") ? link : `https://www.cinecalidad.am${link}`;
        }
      }
    } catch (error) {
      console.log("Error al buscar en Cinecalidad:", error);
    }

    // ========================================
    // PASO 3: CONSTRUIR RESULTADO
    // ========================================
    const pelicula = {
      titulo: movie.title,
      anio: movie.release_date ? movie.release_date.split("-")[0] : "2024",
      genero: "Desconocido",
      sinopsis: movie.overview || "Sin sinopsis disponible",
      caratula: movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
        : "",
      link_directo: linkCinecalidad || `https://www.cinecalidad.am/ver-pelicula/${movie.title.toLowerCase().replace(/ /g, "-")}/`,
      fuente: "auto",
    };

    return NextResponse.json({ pelicula });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al buscar la película" }, { status: 500 });
  }
}

// ========================================
// EXTRAER DESDE CINECALIDAD (por link)
// ========================================
async function extraerDeCinecalidad(link: string) {
  try {
    const res = await fetch(link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Título
    let titulo = "Sin título";
    const tMatch = html.match(/<h1[^>]*>([^<]*)<\/h1>/i) || html.match(/<title>([^<]*)<\/title>/i);
    if (tMatch) {
      titulo = tMatch[1].replace(" - Cinecalidad", "").trim();
    }

    // Año
    let anio = "2024";
    const aMatch = html.match(/\b(19\d{2}|20\d{2})\b/);
    if (aMatch) anio = aMatch[1];

    // Carátula
    let caratula = "";
    const imgMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
    if (imgMatch && !imgMatch[1].includes("data:image")) {
      caratula = imgMatch[1];
    }

    // Sinopsis
    let sinopsis = "Sin sinopsis disponible";
    const sMatch = html.match(/<p[^>]*>([^<]*)<\/p>/i) || html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    if (sMatch) sinopsis = sMatch[1].trim();

    return {
      titulo,
      anio,
      genero: "Desconocido",
      sinopsis,
      caratula: caratula.startsWith("http") ? caratula : `https://www.cinecalidad.am${caratula}`,
      link_directo: link,
      fuente: "auto",
    };

  } catch (error) {
    return null;
  }
}
