import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("peliculas")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const camposPermitidos = [
      "tmdb_id",
      "titulo",
      "anio",
      "genero",
      "sinopsis",
      "caratula",
      "link_directo",
      "destacada",
    ];

    const actualizacion: any = {};
    for (const campo of camposPermitidos) {
      if (campo in body) {
        // Convertir tmdb_id y anio a número
        if ((campo === "tmdb_id" || campo === "anio") && body[campo]) {
          actualizacion[campo] = parseInt(body[campo]);
        } else {
          actualizacion[campo] = body[campo];
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from("peliculas")
      .update(actualizacion)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from("peliculas")
      .delete()
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
