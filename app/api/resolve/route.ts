// app/api/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// ========================================
// Fuentes de VidSrc (con dominios actuales)
// ========================================
const VIDSRC_DOMAINS = [
  "https://vidsrc.xyz/embed",
  "https://vidsrc.to/embed",
  "https://vidsrc.cc/v2/embed",
  "https://vidsrc.net/embed",
];

// ========================================
// Headers para simular navegador real
// ========================================
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
};

// ========================================
// Extraer .m3u8 de un HTML
// ========================================
function extraerM3U8(html: string): string | null {
  // Patrones comunes donde viene el m3u8
  const patrones = [
    /file\s*:\s*["']([^"']*\.m3u8[^"']*)["']/i,
    /source\s*:\s*["']([^"']*\.m3u8[^"']*)["']/i,
    /["']([^"']*\.m3u8[^"']*)["']/i,
    /(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i,
  ];

  for (const patron of patrones) {
    const match = html.match(patron);
    if (match && match[1]) {
      return match[1].replace(/\\\//g, "/");
    }
  }

  return null;
}

// ========================================
// Extraer iframe del HTML
// ========================================
function extraerIframe(html: string): string | null {
  const iframeMatch = html.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
  return iframeMatch ? iframeMatch[1] : null;
}

// ========================================
// GET — Resolver stream desde TMDB ID
// ========================================
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

  // Probar cada dominio de VidSrc hasta que uno funcione
  for (const baseUrl of VIDSRC_DOMAINS) {
    try {
      let embedUrl: string;

      if (tipo === "movie") {
        embedUrl = `${baseUrl}/movie?tmdb=${tmdbId}`;
      } else {
        embedUrl = `${baseUrl}/tv?tmdb=${tmdbId}&season=${temporada}&episode=${episodio}`;
      }

      console.log(`[resolve] Probando: ${embedUrl}`);

      // 1. Fetch de la página del embed
      const res = await fetch(embedUrl, {
        headers: BROWSER_HEADERS,
        redirect: "follow",
      });

      if (!res.ok) {
        console.log(`[resolve] ${baseUrl} → HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();

      // 2. Intentar extraer .m3u8 directamente
      let m3u8 = extraerM3U8(html);

      // 3. Si no hay m3u8, buscar iframe y seguirlo
      if (!m3u8) {
        const iframeUrl = extraerIframe(html);
        if (iframeUrl) {
          const iframeCompleto = iframeUrl.startsWith("http")
            ? iframeUrl
            : new URL(iframeUrl, baseUrl).toString();

          console.log(`[resolve] Siguiendo iframe: ${iframeCompleto}`);

          const iframeRes = await fetch(iframeCompleto, {
            headers: {
              ...BROWSER_HEADERS,
              Referer: embedUrl,
            },
          });

          if (iframeRes.ok) {
            const iframeHtml = await iframeRes.text();
            m3u8 = extraerM3U8(iframeHtml);
          }
        }
      }

      if (m3u8) {
        console.log(`[resolve] ✅ m3u8 encontrado: ${m3u8}`);
        return NextResponse.json({
          success: true,
          hlsUrl: m3u8,
          fuente: baseUrl,
        });
      }

      console.log(`[resolve] ${baseUrl} → No se encontró m3u8`);
    } catch (err) {
      console.error(`[resolve] Error con ${baseUrl}:`, err);
    }
  }

  // Ningún dominio funcionó
  return NextResponse.json(
    {
      error: "No se pudo extraer el stream",
      detalle: "Todos los dominios de VidSrc fallaron. La fuente puede estar caída o bloqueada.",
    },
    { status: 500 }
  );
}
