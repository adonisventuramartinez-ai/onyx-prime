import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");

  if (!nombre) {
    return NextResponse.json({ error: "Nombre de película requerido" }, { status: 400 });
  }

  try {
    // ========================================
    // PASO 1: OBTENER DATOS DE TMDB
    // ========================================
    const TMDB_API_KEY = process.env.TMDB_API_KEY || "528f5aaebfb0c656e0974c07c3cba128";
    
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
    // PASO 2: BUSCAR EN CINECALIDAD (URL CORRECTA)
    // ========================================
    let linkDirecto = "";
    const searchUrl = `https://www.cinecalidad.am/?s=${encodeURIComponent(nombre)}`;
    
    try {
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Referer": "https://www.cinecalidad.am/",
        },
      });

      if (response.ok) {
        const html = await response.text();
        const linkEncontrado = extraerLinkDeHTML(html);
        if (linkEncontrado) {
          linkDirecto = linkEncontrado;
        }
      }
    } catch (error) {
      console.log("Error al buscar en Cinecalidad:", error);
    }

    // ========================================
    // PASO 3: CONSTRUIR RESULTADO
    // ========================================
    const pelicula = {
      titulo: movie.title || nombre,
      anio: movie.release_date ? movie.release_date.split("-")[0] : "2024",
      genero: "Desconocido",
      sinopsis: movie.overview || "Sin sinopsis disponible",
      caratula: movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
        : "",
      link_directo: linkDirecto || `https://www.cinecalidad.am/${movie.title.toLowerCase().replace(/ /g, "-")}`,
      fuente: "cinecalidad",
    };

    return NextResponse.json({ pelicula });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al buscar la película" }, { status: 500 });
  }
}

// ========================================
// FUNCIÓN: Extraer link de Cinecalidad
// ========================================
function extraerLinkDeHTML(html: string): string | null {
  // Buscar enlaces de películas
  const regex = /<a[^>]*href="([^"]*)"[^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const link = match[1];
    if (link && 
        !link.includes("anuncio") && 
        !link.includes("ad") &&
        !link.includes("google") &&
        !link.includes("facebook") &&
        !link.includes("twitter") &&
        !link.includes("instagram") &&
        !link.includes("#") &&
        !link.includes("javascript") &&
        link.includes("cinecalidad")) {
      return link.startsWith("http") ? link : `https://www.cinecalidad.am${link}`;
    }
  }
  return null;
}
