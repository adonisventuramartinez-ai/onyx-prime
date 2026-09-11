import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data: tarea, error } = await supabaseAdmin
      .from("tareas_scraping")
      .insert({
        estado: "pendiente",
        fecha_inicio: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      mensaje: "Scraping iniciado",
      tarea_id: tarea.id,
      estado: tarea.estado,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al iniciar" }, { status: 500 });
  }
}
