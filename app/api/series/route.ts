import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

// ========================================
// GET — Lista todas las series
// ========================================
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("series")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ series: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener series" },
      { status: 500 }
    );
  }
}

// ========================================
// POST — Crea serie + todos sus episodios
// ========================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tmdb_id,
      titulo,
      titulo_original,
      anio,
      genero,
      sinopsis,
      caratula,
      backdrop,
      num_temporadas,
      num_episodios,
      estado,
      destacada,
      episodios,
    } = body;

    if (!titulo) {
      return NextResponse.json(
        { error: "El título es obligatorio" },
        { status: 400 }
      );
    }

    // 1. Insertar la serie
    const insertSerie: any = {
      titulo,
      titulo_original: titulo_original || titulo,
      anio: parseInt(anio) || new Date().getFullYear(),
      genero: genero || "Desconocido",
      sinopsis: sinopsis || "",
      caratula: caratula || "",
      backdrop: backdrop || "",
      num_temporadas: parseInt(num_temporadas) || 1,
      num_episodios: parseInt(num_episodios) || 0,
      estado: estado || "Finalizada",
      destacada: destacada || false,
      fuente: "auto",
      creado_en: new Date().toISOString(),
    };

    if (tmdb_id) {
      insertSerie.tmdb_id = parseInt(tmdb_id);
    }

    const { data: serieInsertada, error: errorSerie } = await supabaseAdmin
      .from("series")
      .insert(insertSerie)
      .select()
      .single();

    if (errorSerie) {
      return NextResponse.json({ error: errorSerie.message }, { status: 500 });
    }

    // 2. Insertar episodios si vienen
    if (Array.isArray(episodios) && episodios.length > 0) {
      const episodiosAInsertar = episodios.map((ep: any) => ({
        serie_id: serieInsertada.id,
        tmdb_id: ep.tmdb_id || null,
        temporada: ep.temporada,
        numero: ep.numero,
        titulo: ep.titulo || `Episodio ${ep.numero}`,
        sinopsis: ep.sinopsis || "",
        duracion: ep.duracion || null,
        caratula: ep.caratula || "",
        link_directo: ep.link_directo || "",
        creado_en: new Date().toISOString(),
      }));

      const { error: errorEpisodios } = await supabaseAdmin
        .from("episodios")
        .insert(episodiosAInsertar);

      if (errorEpisodios) {
        console.error("[series POST] Error insertando episodios:", errorEpisodios);
        // La serie se creó, pero los episodios fallaron
        return NextResponse.json({
          ...serieInsertada,
          advertencia: `Serie creada, pero fallaron los episodios: ${errorEpisodios.message}`,
        });
      }
    }

    return NextResponse.json(serieInsertada);
  } catch (error) {
    console.error("[series POST] Error:", error);
    return NextResponse.json(
      { error: "Error al guardar la serie" },
      { status: 500 }
    );
  }
}
