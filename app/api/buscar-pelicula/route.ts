import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { buscarPeliculaCompleta } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 60;

const TMDB_API_KEY = process.env.TMDB_API_KEY || "67fff863bf6ae181cd30a3519662ea70";

const GENEROS_TMDB: Record<number, string> = {
  28: "Acción",
  12: "Aventura",
  16: "Animación",
  35: "Comedia",
  80: "Crimen",
  99: "Documental",
  18: "Drama",
  10751: "Familia",
  14: "Fantasía",
  36: "Historia",
  27: "Terror",
  10402: "Música",
  9648: "Misterio",
  10749: "Romance",
  878: "Ciencia Ficción",
  10770: "Película de TV",
  53: "Suspense",
  10752: "Bélica",
  37: "Western",
};

function obtenerGenero(genre_ids?: number[]): string {
  if (!genre_ids || genre_ids.length === 0) return "Desconocido";
  const nombres = genre_ids.map((id) => GENEROS_TMDB[id]).filter(Boolean);
  return nombres.length > 0 ? nombres.join(", ") : "Desconocido";
}

// ========================================
// GET — busca en TMDB + intenta extraer el link
// ========================================
export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");

  if (!nombre) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  try {
    // 1. TMDB primero (rápido, siempre funciona)
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(nombre)}&language=es-ES`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Error en TMDB" }, { status: 500 });
    }

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: "No se encontró la película" }, { status: 404 });
    }

    const movie = data.results[0];

    // 2. Intentamos extraer el link con timeout de seguridad (15s)
    let link_directo = "";
    try {
      const scrapeResult = await Promise.race([
        buscarPeliculaCompleta(movie.title),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000)),
      ]);

      if (scrapeResult?.link_directo) {
        link_directo = scrapeResult.link_directo;
      }
    } catch (err) {
      console.warn("[buscar-pelicula] Extracción de link falló:", err);
      // No rompemos la búsqueda. El usuario verá la peli igual.
    }

    const pelicula = {
      tmdb_id: movie.id,
      titulo: movie.title,
      anio: movie.release_date ? movie.release_date.split("-")[0] : "2024",
      genero: obtenerGenero(movie.genre_ids),
      sinopsis: movie.overview || "Sin sinopsis disponible",
      caratula: movie.poster_path
        ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
        : "",
      link_directo,
      fuente: "auto",
    };

    return NextResponse.json({ pelicula });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al buscar" }, { status: 500 });
  }
}

// ========================================
// POST — busca + guarda directo (fallback)
// ========================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre } = body;

    if (!nombre) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(nombre)}&language=es-ES`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Error en TMDB" }, { status: 500 });
    }

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: "No se encontró la película" }, { status: 404 });
    }

    const movie = data.results[0];

    let link_directo = "";
    try {
      const scrapeResult = await Promise.race([
        buscarPeliculaCompleta(movie.title),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000)),
      ]);
      if (scrapeResult?.link_directo) link_directo = scrapeResult.link_directo;
    } catch (err) {
      console.warn("[buscar-pelicula POST] Extracción falló:", err);
    }

    const { data: insertada, error } = await supabaseAdmin
      .from("peliculas")
      .insert({
        tmdb_id: movie.id,
        titulo: movie.title,
        anio: parseInt(movie.release_date?.split("-")[0] || "2024"),
        genero: obtenerGenero(movie.genre_ids),
        sinopsis: movie.overview || "Sin sinopsis disponible",
        caratula: movie.poster_path
          ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
          : "",
        link_directo,
        fuente: "auto",
        creado_en: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pelicula: insertada });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
