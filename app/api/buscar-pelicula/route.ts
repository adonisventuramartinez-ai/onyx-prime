import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "67fff863bf6ae181cd30a3519662ea70";

export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");

  if (!nombre) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  try {
    // Buscar en TMDB
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

    const pelicula = {
      tmdb_id: movie.id,
      titulo: movie.title,
      anio: movie.release_date ? movie.release_date.split("-")[0] : "2024",
      genero: "Desconocido",
      sinopsis: movie.overview || "Sin sinopsis disponible",
      caratula: movie.poster_path
        ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
        : "",
      link_directo: "",
      fuente: "auto",
    };

    return NextResponse.json({ pelicula });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al buscar" }, { status: 500 });
  }
}

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

    const { data: insertada, error } = await supabaseAdmin
      .from("peliculas")
      .insert({
        tmdb_id: movie.id,
        titulo: movie.title,
        anio: parseInt(movie.release_date?.split("-")[0] || "2024"),
        genero: "Desconocido",
        sinopsis: movie.overview || "Sin sinopsis disponible",
        caratula: movie.poster_path
          ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
          : "",
        link_directo: "",
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
