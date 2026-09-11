// app/api/extract/route.ts
import { NextRequest, NextResponse } from "next/server";

// ========================================
// EXTRACTOR DE DOODSTREAM EN TYPESCRIPT PURO
// ========================================

const DOOD_BASE_URL = "https://d000d.com"; // Base que usa DoodStream para el pass_md5

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    if (!url.includes("dood")) {
      return NextResponse.json({ error: "Solo DoodStream soportado" }, { status: 400 });
    }

    // ========================================
    // PASO 1: Hacer la petición inicial a DoodStream
    // ========================================
    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": "https://dood.wf/",
      },
    });

    if (!pageResponse.ok) {
      return NextResponse.json({ error: `Error al acceder a DoodStream: ${pageResponse.status}` }, { status: 500 });
    }

    const html = await pageResponse.text();

    // ========================================
    // PASO 2: Extraer la ruta pass_md5 y el token
    // ========================================
    // Patrón exacto usado por mediaflow-proxy
    const pattern = /(\/pass_md5\/.*?)'.*(\?token=.*?expiry=)/;
    const match = html.match(pattern);

    if (!match) {
      return NextResponse.json({ error: "No se pudo extraer el patrón de DoodStream" }, { status: 404 });
    }

    const passMd5Path = match[1]; // Ej: /pass_md5/xxxxx
    const tokenPart = match[2];   // Ej: ?token=xxxxx&expiry=xxxxx

    // ========================================
    // PASO 3: Construir y llamar a la URL pass_md5
    // ========================================
    const passUrl = `${DOOD_BASE_URL}${passMd5Path}`;
    const referer = `${DOOD_BASE_URL}/`;

    const passResponse = await fetch(passUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": referer,
        "Range": "bytes=0-",
      },
    });

    if (!passResponse.ok) {
      return NextResponse.json({ error: `Error al obtener pass_md5: ${passResponse.status}` }, { status: 500 });
    }

    // La respuesta es el inicio del link final (una cadena de texto)
    const passText = await passResponse.text();

    // ========================================
    // PASO 4: Construir el link final
    // ========================================
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const finalUrl = `${passText}123456789${tokenPart}${timestamp}`;

    // ========================================
    // PASO 5: Devolver el link y los headers necesarios
    // ========================================
    return NextResponse.json({
      original: url,
      link_directo: finalUrl,
      headers: {
        "Referer": referer, // OBLIGATORIO para que DoodStream permita la reproducción
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      mensaje: "✅ Link extraído correctamente",
    });

  } catch (error: any) {
    console.error("Error en extract:", error);
    return NextResponse.json({ 
      error: error.message || "Error al extraer link" 
    }, { status: 500 });
  }
}
