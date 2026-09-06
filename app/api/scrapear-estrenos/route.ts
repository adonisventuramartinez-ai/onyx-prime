import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function GET() {
  try {
    // ========================================
    // CREAR UNA NUEVA TAREA EN LA BASE DE DATOS
    // ========================================
    const { data: tarea, error } = await supabaseAdmin
      .from("tareas_scraping")
      .insert({
        estado: "pendiente",
        fecha_inicio: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error al crear tarea:", error);
      return NextResponse.json({ error: "Error al crear tarea" }, { status: 500 });
    }

    console.log(`✅ Tarea ${tarea.id} creada`);

    return NextResponse.json({
      mensaje: "Scraping iniciado en segundo plano",
      tarea_id: tarea.id,
      estado: tarea.estado,
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al iniciar el scraping" }, { status: 500 });
  }
}
