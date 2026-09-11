import { NextRequest, NextResponse } from "next/server";
import { buscarPeliculaCompleta } from "@/lib/scraper";
import { supabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");

  if (!nombre) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  try {
    const pelicula = await buscarPeliculaCompleta(nombre);

    if (!pelicula) {
      return NextResponse.json({ error: "No se encontró la película" }, { status: 404 });
    }

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

    const pelicula = await buscarPeliculaCompleta(nombre);

    if (!pelicula) {
      return NextResponse.json({ error: "No se encontró la película" }, { status: 404 });
    }

    // Guardar en Supabase
    const { data, error } = await supabaseAdmin
      .from("peliculas")
      .insert({
        titulo: pelicula.titulo,
        anio: parseInt(pelicula.anio) || 2024,
        genero: pelicula.genero,
        sinopsis: pelicula.sinopsis,
        caratula: pelicula.caratula,
        link_directo: pelicula.link_directo,
        fuente: "auto",
        creado_en: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pelicula: data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
