import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data: tarea } = await supabaseAdmin
      .from("tareas_scraping")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ tarea_actual: tarea || null });
  } catch {
    return NextResponse.json({ tarea_actual: null });
  }
}
