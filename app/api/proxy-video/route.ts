import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const videoUrl = req.nextUrl.searchParams.get("url");

  if (!videoUrl) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  try {
    // Detectar el origen para el header Referer
    let referer = "https://vimeos.net/";
    if (videoUrl.includes("goodstream")) referer = "https://goodstream.one/";
    if (videoUrl.includes("dood")) referer = "https://dood.wf/";
    if (videoUrl.includes("dr0pstream")) referer = "https://dr0pstream.com/";
    if (videoUrl.includes("voe.sx")) referer = "https://voe.sx/";

    const res = await fetch(videoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": referer,
        "Origin": referer.replace(/\/$/, ""),
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Error del servidor: ${res.status}` },
        { status: res.status }
      );
    }

    // Devolver el contenido con headers CORS abiertos
    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Cache-Control", "no-cache");

    return new NextResponse(res.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error en proxy-video:", error);
    return NextResponse.json(
      { error: error.message || "Error al cargar el video" },
      { status: 500 }
    );
  }
}
