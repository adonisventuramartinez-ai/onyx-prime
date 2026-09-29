import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";

// ========================================
// GET — Obtiene serie + sus episodios
// ========================================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Obtener serie
    const { data: serie, error: errorSerie } = await supabaseAdmin
      .from("series")
      .select("*")
      .eq("id", id)
      .single();

    if (errorSerie || !serie) {
      return NextResponse.json({ error: "Serie no encontrada" }, { status: 404 });
    }

    // 2. Obtener episodios ordenados
    const { data: episodios, error: errorEpisodios } = await supabaseAdmin
      .from("episodios")
      .select("*")
      .eq("serie_id", id)
      .order("temporada", { ascending: true })
      .order("numero", { ascending: true });

    if (errorEpisodios) {
      return NextResponse.json({ error: errorEpisodios.message }, { status: 500 });
    }

    return NextResponse.json({
      ...serie,
      episodios: episodios || [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener serie" }, { status: 500 });
  }
}

// ========================================
// DELETE — Borra serie + sus episodios (CASCADE)
// ========================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabaseAdmin.from("series").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al borrar serie" }, { status: 500 });
  }
}

// ========================================
// PUT — Actualiza serie
// ========================================
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from("series")
      .update({
        ...body,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
