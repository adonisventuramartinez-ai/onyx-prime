// app/api/extract/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const DOOD_BASE_URL = "https://d000d.com";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    if (!url.includes("dood")) {
      return NextResponse.json({ error: "Solo DoodStream soportado" }, { status: 400 });
    }

    // PASO 1: Petición inicial a DoodStream
    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://dood.wf/",
      },
    });

    if (!pageResponse.ok) {
      return NextResponse.json(
        { error: `Error al acceder a DoodStream: ${pageResponse.status}` },
        { status: 500 }
      );
    }

    const html = await pageResponse.text();

    // PASO 2: Extraer pass_md5 y token
    const pattern = /(\/pass_md5\/.*?)'.*(\?token=.*?expiry=)/;
    const match = html.match(pattern);

    if (!match) {
      return NextResponse.json(
        { error: "No se pudo extraer el patrón de DoodStream" },
        { status: 404 }
      );
    }

    const passMd5Path = match[1];
    const tokenPart = match[2];

    // PASO 3: Llamar a pass_md5
    const passUrl = `${DOOD_BASE_URL}${passMd5Path}`;
    const referer = `${DOOD_BASE_URL}/`;

    const passResponse = await fetch(passUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: referer,
        Range: "bytes=0-",
      },
    });

    if (!passResponse.ok) {
      return NextResponse.json(
        { error: `Error al obtener pass_md5: ${passResponse.status}` },
        { status: 500 }
      );
    }

    const passText = await passResponse.text();

    // PASO 4: Construir link final
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const finalUrl = `${passText}123456789${tokenPart}${timestamp}`;

    return NextResponse.json({
      original: url,
      link_directo: finalUrl,
      headers: {
        Referer: referer,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      mensaje: "✅ Link extraído correctamente",
    });
  } catch (error: any) {
    console.error("Error en extract:", error);
    return NextResponse.json(
      { error: error.message || "Error al extraer link" },
      { status: 500 }
    );
  }
}
