import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function GET() {
  try {
    // Obtener la tarea actual (la más reciente)
    const { data: tareaActual, error: errorActual } = await supabaseAdmin
      .from("tareas_scraping")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errorActual) {
      console.error("Error al obtener tarea actual:", errorActual);
    }

    // Obtener historial (últimas 10 tareas completadas)
    const { data: historial, error: errorHistorial } = await supabaseAdmin
      .from("tareas_scraping")
      .select("*")
      .neq("estado", "pendiente")
      .order("creado_en", { ascending: false })
      .limit(10);

    if (errorHistorial) {
      console.error("Error al obtener historial:", errorHistorial);
    }

    return NextResponse.json({
      tarea_actual: tareaActual || null,
      historial: historial || [],
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener estado" }, { status: 500 });
  }
}
