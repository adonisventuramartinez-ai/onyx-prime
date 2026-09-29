import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

// ========================================
// GET — Lista todas las películas
// ========================================
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

// ========================================
// POST — Agrega película (auto-extrae link si falta)
// ========================================
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

    // 🔥 AUTO-GENERACIÓN DEL LINK si no viene
    let linkFinal = link_directo || "";

    if (!linkFinal && tmdb_id) {
      try {
        const { buscarPeliculaCompleta } = await import("@/lib/scraper");
        const scrapeResult = await Promise.race([
          buscarPeliculaCompleta(titulo),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000)),
        ]);
        if (scrapeResult?.link_directo) {
          linkFinal = scrapeResult.link_directo;
        }
      } catch (err) {
        console.warn("[peliculas POST] No se pudo extraer link:", err);
        // No rompemos el guardado
      }
    }

    const insertData: any = {
      titulo,
      anio: parseInt(anio) || new Date().getFullYear(),
      genero: genero || "Desconocido",
      sinopsis: sinopsis || "",
      caratula: caratula || "",
      link_directo: linkFinal,
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
    console.error("[peliculas POST] Error:", error);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
