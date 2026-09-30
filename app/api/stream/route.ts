// app/api/stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVidLinkProVideo } from "vidsrc-bypass";

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
    let resultado;

    if (tipo === "movie") {
      resultado = await getVidLinkProVideo({
        id: tmdbId,
        type: "movie",
      });
    } else {
      if (!temporada || !episodio) {
        return NextResponse.json(
          { error: "Faltan temporada y episodio para series" },
          { status: 400 }
        );
      }
      resultado = await getVidLinkProVideo({
        id: tmdbId,
        season: Number(temporada),
        episode: Number(episodio),
        type: "tv",
      });
    }

    if (!resultado || !resultado.stream) {
      return NextResponse.json(
        { error: "No se pudo extraer el stream" },
        { status: 500 }
      );
    }

    return NextResponse.json({ hlsUrl: resultado.stream });
  } catch (error) {
    console.error("[stream] Error:", error);
    return NextResponse.json(
      { error: "Error al extraer el stream" },
      { status: 500 }
    );
  }
}
