import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("peliculas")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ peliculas: data || [] });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener películas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tmdb_id,
      titulo,
      anio,
      genero,
      sinopsis,
      caratula,
      link_directo,
      fuente,
      destacada,
    } = body;

    if (!titulo) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const insertData: any = {
      titulo,
      anio: parseInt(anio) || new Date().getFullYear(),
      genero: genero || "Desconocido",
      sinopsis: sinopsis || "",
      caratula: caratula || "",
      link_directo: link_directo || "",
      fuente: fuente || "manual",
      destacada: destacada || false,
      creado_en: new Date().toISOString(),
    };

    if (tmdb_id) {
      insertData.tmdb_id = parseInt(tmdb_id);
    }

    const { data, error } = await supabaseAdmin
      .from("peliculas")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
