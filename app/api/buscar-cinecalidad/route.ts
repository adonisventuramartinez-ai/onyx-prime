import { NextRequest, NextResponse } from "next/server";

// 🔑 TU API KEY DE TMDB
const TMDB_API_KEY = "67fff863bf6ae181cd30a3519662ea70";

export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");
  const linkDirectoProporcionado = req.nextUrl.searchParams.get("link");

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
    // BUSCAR EN TMDB
    // ========================================
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(nombre)}&language=es-ES`
    );

    if (!tmdbRes.ok) {
      console.error("TMDB Error:", tmdbRes.status);
      return NextResponse.json({ 
        error: `Error al buscar en TMDB: ${tmdbRes.status}` 
      }, { status: tmdbRes.status });
    }

    const tmdbData = await tmdbRes.json();

    if (!tmdbData.results || tmdbData.results.length === 0) {
      return NextResponse.json({ error: "No se encontró la película en TMDB" }, { status: 404 });
    }

    const movie = tmdbData.results[0];

    // ========================================
    // BUSCAR LINK EN CINECALIDAD
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
    // CONSTRUIR RESULTADO CON IMAGEN HD
    // ========================================
    const pelicula = {
      titulo: movie.title,
      anio: movie.release_date ? movie.release_date.split("-")[0] : "2024",
      genero: movie.genres?.[0]?.name || "Desconocido",
      sinopsis: movie.overview || "Sin sinopsis disponible",
      // 🖼️ IMAGEN HD: Usamos "original" para la mejor calidad
      caratula: movie.poster_path 
        ? `https://image.tmdb.org/t/p/original${movie.poster_path}` 
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
// EXTRAER DESDE CINECALIDAD (por link directo)
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

    let titulo = "Sin título";
    const tMatch = html.match(/<h1[^>]*>([^<]*)<\/h1>/i) || html.match(/<title>([^<]*)<\/title>/i);
    if (tMatch) titulo = tMatch[1].replace(" - Cinecalidad", "").trim();

    let anio = "2024";
    const aMatch = html.match(/\b(19\d{2}|20\d{2})\b/);
    if (aMatch) anio = aMatch[1];

    let caratula = "";
    const imgMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
    if (imgMatch && !imgMatch[1].includes("data:image")) {
      caratula = imgMatch[1];
    }

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
