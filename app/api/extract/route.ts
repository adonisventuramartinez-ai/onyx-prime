// app/api/extract/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Servidores soportados (todos usan el mismo patrón pass_md5)
const SERVIDORES_SOPORTADOS = [
  "dood",
  "dr0pstream",
  "dropstream",
  "streamwish",
  "vidhide",
  "lulustream",
  "voe",
];

const DOOD_BASE_URL = "https://d000d.com";

function esServidorSoportado(url: string): boolean {
  const urlLower = url.toLowerCase();
  return SERVIDORES_SOPORTADOS.some((s) => urlLower.includes(s));
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
          error: "Servidor no soportado. Prueba con DoodStream, Dropstream, StreamWish, Vidhide o LuluStream.",
          servidores_soportados: SERVIDORES_SOPORTADOS
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Procesando: ${url}`);

    // PASO 1: Petición inicial
    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": new URL(url).origin + "/",
      },
    });

    if (!pageResponse.ok) {
      return NextResponse.json(
        { error: `Error al acceder al servidor: ${pageResponse.status}` },
        { status: 500 }
      );
    }

    const html = await pageResponse.text();

    // PASO 2: Extraer pass_md5 y token (patrón universal)
    const pattern = /(\/pass_md5\/.*?)'.*(\?token=.*?expiry=)/;
    const match = html.match(pattern);

    if (!match) {
      // Intentar con otros patrones alternativos
      const altPattern = /pass_md5\/([a-zA-Z0-9]+)/;
      const altMatch = html.match(altPattern);
      
      if (!altMatch) {
        return NextResponse.json(
          { 
            error: "No se pudo extraer el patrón del servidor. El sitio puede haber cambiado.",
            hint: "Prueba con otro link de DoodStream"
          },
          { status: 404 }
        );
      }
    }

    const passMd5Path = match ? match[1] : "";
    const tokenPart = match ? match[2] : "";

    // PASO 3: Llamar a pass_md5
    const origin = new URL(url).origin;
    const passUrl = passMd5Path.startsWith("http") 
      ? passMd5Path 
      : `${origin}${passMd5Path}`;
    
    const referer = `${origin}/`;

    const passResponse = await fetch(passUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": referer,
        "Range": "bytes=0-",
      },
    });

    if (!passResponse.ok) {
      return NextResponse.json(
        { error: `Error al obtener el link: ${passResponse.status}` },
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
        "Referer": referer,
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
