import { NextRequest, NextResponse } from "next/server";
import youtubedl from "yt-dlp-exec";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    // Validar que sea un link de DoodStream
    if (!url.includes("dood")) {
      return NextResponse.json({ error: "Solo DoodStream soportado" }, { status: 400 });
    }

    // Extraer info con yt-dlp
    const result = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      format: "best[ext=mp4]/best",
      referer: "https://dood.wf/",
    });

    // Buscar el link directo en el resultado
    const formats = result.formats || [];
    const mp4Format = formats.find((f: any) => f.ext === "mp4" && f.url);
    
    if (!mp4Format?.url) {
      return NextResponse.json({ error: "No se encontró link directo" }, { status: 404 });
    }

    return NextResponse.json({
      original: url,
      link_directo: mp4Format.url,
      headers: {
        Referer: "https://dood.wf/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      titulo: result.title || "",
      duracion: result.duration || 0,
    });

  } catch (error: any) {
    console.error("Error en extract:", error);
    return NextResponse.json({ 
      error: error.message || "Error al extraer link" 
    }, { status: 500 });
  }
}
