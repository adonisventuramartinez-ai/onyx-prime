// app/api/extract/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Servidores soportados
const SERVIDORES = [
  "vimeos.net",
  "vimeos",
  "goodstream.one",
  "goodstream",
  "hlswish.com",
  "hlswish",
  "voe.sx",
  "voe",
  "videoapp.zip",
  "videoapp",
  "dood",
  "d000d",
  "dr0pstream",
];

function esServidorSoportado(url: string): boolean {
  const urlLower = url.toLowerCase();
  return SERVIDORES.some((s) => urlLower.includes(s));
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    if (!esServidorSoportado(url)) {
      return NextResponse.json(
        { 
          error: "Servidor no soportado",
          servidores_soportados: SERVIDORES
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Procesando: ${url}`);

    // PASO 1: Petición inicial al servidor
    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": new URL(url).origin + "/",
      },
    });

    if (!pageResponse.ok) {
      return NextResponse.json(
        { error: `Error al acceder: ${pageResponse.status}` },
        { status: 500 }
      );
    }

    const html = await pageResponse.text();

    // ========================================
    // PATRÓN 1: DoodStream / Vimeos (pass_md5)
    // ========================================
    const passMd5Match = html.match(/(\/pass_md5\/.*?)'.*(\?token=.*?expiry=)/);
    
    if (passMd5Match) {
      console.log("✅ Patrón pass_md5 detectado (DoodStream/Vimeos)");
      
      const passMd5Path = passMd5Match[1];
      const tokenPart = passMd5Match[2];

      const origin = new URL(url).origin;
      const passUrl = passMd5Path.startsWith("http") 
        ? passMd5Path 
        : `${origin}${passMd5Path}`;
      
      const referer = `${origin}/`;

      const passResponse = await fetch(passUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": referer,
          "Range": "bytes=0-",
        },
      });

      if (passResponse.ok) {
        const passText = await passResponse.text();
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const finalUrl = `${passText}123456789${tokenPart}${timestamp}`;

        return NextResponse.json({
          original: url,
          link_directo: finalUrl,
          headers: {
            "Referer": referer,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          mensaje: "✅ Link extraído correctamente (DoodStream/Vimeos)",
        });
      }
    }

    // ========================================
    // PATRÓN 2: iframe con source (voe.sx, goodstream, etc.)
    // ========================================
    const iframeMatch = html.match(/<iframe[^>]*src=["']([^"']*\.m3u8[^"']*)["'][^>]*>/i) ||
                        html.match(/<source[^>]*src=["']([^"']*)["'][^>]*>/i) ||
                        html.match(/file\s*:\s*["']([^"']*)["']/gi);

    if (iframeMatch) {
      console.log("✅ Patrón iframe/source detectado");
      
      const linkDirecto = iframeMatch[1];
      const origin = new URL(url).origin;

      return NextResponse.json({
        original: url,
        link_directo: linkDirecto.startsWith("http") ? linkDirecto : `${origin}${linkDirecto}`,
        headers: {
          "Referer": `${origin}/`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        mensaje: "✅ Link extraído correctamente (iframe/source)",
      });
    }

    // ========================================
    // PATRÓN 3: HLS (m3u8) en el HTML
    // ========================================
    const hlsMatch = html.match(/(https?:\/\/[^"'\s]*\.m3u8[^"'\s]*)/i);
    
    if (hlsMatch) {
      console.log("✅ Patrón HLS (m3u8) detectado");
      
      return NextResponse.json({
        original: url,
        link_directo: hlsMatch[1],
        headers: {
          "Referer": new URL(url).origin + "/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        mensaje: "✅ Link HLS extraído correctamente",
      });
    }

    // ========================================
    // NO SE ENCONTRÓ NINGÚN PATRÓN
    // ========================================
    return NextResponse.json(
      { 
        error: "No se pudo extraer el link. El servidor puede haber cambiado.",
        hint: "Prueba con otro servidor del reproductor"
      },
      { status: 404 }
    );

  } catch (error: any) {
    console.error("Error en extract:", error);
    return NextResponse.json(
      { error: error.message || "Error al extraer link" },
      { status: 500 }
    );
  }
}
