import { NextRequest, NextResponse } from "next/server";
import { buscarSerieCompleta } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 60;

// ========================================
// GET — busca serie en TMDB + trae TODOS los episodios
// ========================================
export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");

  if (!nombre) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  try {
    const serie = await buscarSerieCompleta(nombre);

    if (!serie) {
      return NextResponse.json(
        { error: "No se encontró la serie en TMDB" },
        { status: 404 }
      );
    }

    return NextResponse.json({ serie });
  } catch (error) {
    console.error("[buscar-serie] Error:", error);
    return NextResponse.json(
      { error: "Error al buscar la serie" },
      { status: 500 }
    );
  }
}
