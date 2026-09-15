import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROXY_URL = "https://mediaflow-proxy-production-1b7d.up.railway.app";
const API_PASSWORD = "onyxflix2026";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    let host = "Generic";
    if (url.includes("dood")) host = "Doodstream";
    else if (url.includes("mixdrop")) host = "Mixdrop";
    else if (url.includes("uqload")) host = "Uqload";
    else if (url.includes("streamtape")) host = "Streamtape";
    else if (url.includes("voe")) host = "Voe";
    else if (url.includes("lulustream")) host = "LuluStream";

    const proxyResponse = await fetch(
      `${PROXY_URL}/extractor/video?host=${host}&d=${encodeURIComponent(url)}&api_password=${API_PASSWORD}`
    );

    if (!proxyResponse.ok) {
      return NextResponse.json(
        { error: `Error del proxy: ${proxyResponse.status}` },
        { status: proxyResponse.status }
      );
    }

    const data = await proxyResponse.json();

    if (!data.destination_url) {
      return NextResponse.json(
        { error: "No se pudo extraer el link del video" },
        { status: 404 }
      );
    }

    const streamUrl = `${PROXY_URL}/proxy/stream?d=${encodeURIComponent(data.destination_url)}&api_password=${API_PASSWORD}`;

    return NextResponse.json({
      link_directo: streamUrl,
      original_url: data.destination_url,
      headers: data.request_headers || {},
      host,
      mensaje: "✅ Link extraído correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al extraer" },
      { status: 500 }
    );
  }
}
