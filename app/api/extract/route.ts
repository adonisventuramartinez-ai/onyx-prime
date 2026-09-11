// app/api/extract/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SERVIDORES = [
  "vimeos.net", "vimeos",
  "goodstream.one", "goodstream",
  "hlswish.com", "hlswish",
  "voe.sx", "voe",
  "videoapp.zip", "videoapp",
  "dood", "d000d",
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
        { error: "Servidor no soportado", servidores_soportados: SERVIDORES },
        { status: 400 }
      );
    }

    console.log(`🔍 Procesando: ${url}`);

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
    const origin = new URL(url).origin;

    // ========================================
    // PATRÓN 1: DoodStream / Vimeos (pass_md5)
    // ========================================
    const passMd5Match = html.match(/(\/pass_md5\/.*?)'.*(\?token=.*?expiry=)/);
    
    if (passMd5Match) {
      console.log("✅ Patrón pass_md5 detectado");
      
      const passMd5Path = passMd5Match[1];
      const tokenPart = passMd5Match[2];
      const passUrl = passMd5Path.startsWith("http") ? passMd5Path : `${origin}${passMd5Path}`;
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
          mensaje: "✅ Link extraído (DoodStream/Vimeos)",
        });
      }
    }

    // ========================================
    // PATRÓN 2: m3u8 (EL VIDEO REAL) ← PRIMERO
    // ========================================
    const m3u8Match = html.match(/(https?:\/\/[^"'\s\\]*\.m3u8[^"'\s\\]*)/i);
    
    if (m3u8Match) {
      console.log("✅ Patrón m3u8 detectado:", m3u8Match[1]);
      
      return NextResponse.json({
        original: url,
        link_directo: m3u8Match[1].replace(/\\/g, ""),
        headers: {
          "Referer": `${origin}/`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        mensaje: "✅ Link HLS (.m3u8) extraído",
      });
    }

    // ========================================
    // PATRÓN 3: file: con .mp4 o video (NO .vtt)
    // ========================================
    const fileMatches = html.match(/file\s*:\s*["']([^"']*\.(mp4|m3u8|webm)[^"']*)["']/gi);
    
    if (fileMatches) {
      console.log(`✅ Encontrados ${fileMatches.length} archivos`);
      
      for (const match of fileMatches) {
        const urlMatch = match.match(/["']([^"']*)["']/);
        if (urlMatch) {
          const linkDirecto = urlMatch[1];
          return NextResponse.json({
            original: url,
            link_directo: linkDirecto,
            headers: {
              "Referer": `${origin}/`,
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            mensaje: "✅ Link de video extraído (file:)",
          });
        }
      }
    }

    // ========================================
    // PATRÓN 4: source con video
    // ========================================
    const sourceMatch = html.match(/<source[^>]*src=["']([^"']*\.(mp4|m3u8|webm)[^"']*)["'][^>]*>/i);
    
    if (sourceMatch) {
      console.log("✅ Patrón source detectado");
      
      return NextResponse.json({
        original: url,
        link_directo: sourceMatch[1],
        headers: {
          "Referer": `${origin}/`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        mensaje: "✅ Link extraído (source)",
      });
    }

    // ========================================
    // NO SE ENCONTRÓ
    // ========================================
    return NextResponse.json(
      { 
        error: "No se pudo extraer el link del video",
        hint: "El servidor puede tener el video en otro formato. Prueba con otro servidor.",
        debug: {
          tiene_pass_md5: !!passMd5Match,
          tiene_m3u8: !!m3u8Match,
          tiene_file: !!fileMatches,
          tiene_source: !!sourceMatch,
        }
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
