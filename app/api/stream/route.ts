// app/api/stream/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get("tmdbId");
  const tipo = searchParams.get("tipo") as "movie" | "tv" | null;
  const temporada = searchParams.get("temporada");
  const episodio = searchParams.get("episodio");

  if (!tmdbId || !tipo) {
    return NextResponse.json(
      { error: "Faltan tmdbId o tipo" },
      { status: 400 }
    );
  }

  try {
    // Llamamos a nuestro propio resolver interno
    const params = new URLSearchParams({ tmdbId, tipo });
    if (tipo === "tv" && temporada && episodio) {
      params.set("temporada", temporada);
      params.set("episodio", episodio);
    }

    const baseUrl = req.nextUrl.origin;
    const res = await fetch(`${baseUrl}/api/resolve?${params}`);
    const data = await res.json();

    if (!res.ok || !data.hlsUrl) {
      return NextResponse.json(
        { error: data.error || "No se pudo extraer el stream" },
        { status: 500 }
      );
    }

    return NextResponse.json({ hlsUrl: data.hlsUrl });
  } catch (error) {
    console.error("[stream] Error:", error);
    return NextResponse.json(
      { error: "Error al extraer el stream" },
      { status: 500 }
    );
  }
}
