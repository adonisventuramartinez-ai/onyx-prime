// app/api/stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { scrapeVidsrc } from "@definisi/vidsrc-scraper";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get("tmdbId");
  const tipo = searchParams.get("tipo") as "movie" | "tv" | null;
  const temporada = searchParams.get("temporada");
  const episodio = searchParams.get("episodio");

  if (!tmdbId || !tipo) {
    return NextResponse.json({ error: "Faltan tmdbId o tipo" }, { status: 400 });
  }

  try {
    const resultado = tipo === "movie"
      ? await scrapeVidsrc(tmdbId, "movie")
      : await scrapeVidsrc(tmdbId, "tv", temporada!, episodio!);

    if (!resultado.success || !resultado.hlsUrl) {
      return NextResponse.json({ error: "No se pudo extraer el stream" }, { status: 500 });
    }

    return NextResponse.json({ hlsUrl: resultado.hlsUrl });
  } catch (error) {
    console.error("[stream] Error:", error);
    return NextResponse.json({ error: "Error al extraer el stream" }, { status: 500 });
  }
}
