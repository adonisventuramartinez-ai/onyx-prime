import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  try {
    const resultado = await limpiarLink(url);
    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al limpiar el link" }, { status: 500 });
  }
}

async function limpiarLink(url: string) {
  try {
    // ========================================
    // PASO 1: OBTENER HTML DE LA PÁGINA
    // ========================================
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Referer": "https://www.cinecalidad.am/",
      },
    });

    if (!res.ok) {
      return { 
        original: url, 
        link_directo: null, 
        mensaje: "No se pudo acceder a la página" 
      };
    }

    const html = await res.text();
    
    // ========================================
    // PASO 2: EXTRAER LINKS DE VIDEO
    // ========================================
    const links = extraerLinksDeVideo(html);
    const linksLimpios = links
      .map(l => limpiarParametros(l))
      .filter(l => esLinkValido(l));

    // ========================================
    // PASO 3: SELECCIONAR EL MEJOR LINK
    // ========================================
    // Prioridad: MP4 > M3U8 > WEBM > MKV > otros
    const prioridad = ['mp4', 'm3u8', 'webm', 'mkv', 'avi', 'mov'];
    let mejorLink = null;
    let mejorPrioridad = 999;

    for (const link of linksLimpios) {
      const ext = link.split('.').pop()?.toLowerCase() || '';
      const idx = prioridad.indexOf(ext);
      if (idx !== -1 && idx < mejorPrioridad) {
        mejorPrioridad = idx;
        mejorLink = link;
      }
    }

    // Si no hay link con prioridad, usar el primero
    if (!mejorLink && linksLimpios.length > 0) {
      mejorLink = linksLimpios[0];
    }

    return {
      original: url,
      link_directo: mejorLink,
      todos_los_links: linksLimpios,
      mensaje: mejorLink ? "Link directo encontrado" : "No se encontró link de video"
    };

  } catch (error) {
    return { 
      original: url, 
      link_directo: null, 
      mensaje: "Error al procesar" 
    };
  }
}

// ========================================
// FUNCIÓN: EXTRAER LINKS DE VIDEO
// ========================================
function extraerLinksDeVideo(html: string): string[] {
  const links: string[] = [];
  const patrones = [
    // iframes
    /<iframe[^>]*src=["']([^"']*)["'][^>]*>/gi,
    // videos
    /<video[^>]*src=["']([^"']*)["'][^>]*>/gi,
    // sources
    /<source[^>]*src=["']([^"']*)["'][^>]*>/gi,
    // links directos
    /href=["'](https?:\/\/[^"']*\.(mp4|m3u8|mkv|avi|mov|webm)[^"']*)["']/gi,
    // streaming
    /src=["'](https?:\/\/[^"']*\/stream\/[^"']*)["']/gi,
    // Mega, MediaFire, Drive
    /(https?:\/\/(mega\.nz|mediafire\.com|drive\.google\.com)[^"'\s]*)/gi,
    // cualquier link con extensión de video
    /(https?:\/\/[^"'\s]*\.(mp4|m3u8|mkv|avi|mov|webm)[^"'\s]*)/gi,
  ];

  for (const patron of patrones) {
    const regex = new RegExp(patron, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      const link = match[1] || match[0];
      if (link && !link.includes('data:') && !link.includes('javascript:')) {
        links.push(link);
      }
    }
  }

  return [...new Set(links)];
}

// ========================================
// FUNCIÓN: LIMPIAR PARÁMETROS BASURA
// ========================================
function limpiarParametros(link: string): string {
  const parametrosBasura = [
    'utm_', 'ref=', 'source=', 'campaign=', 'medium=',
    'affiliate', 'affid=', 'partner=', 'promo=', 'click=',
    'redirect=', 'ad=', 'banner=', 'popup=', 'fbclid=',
    'tracking', 'analytics'
  ];

  try {
    const url = new URL(link);
    const params = url.searchParams;
    const paramsAEliminar = [];
    
    for (const key of params.keys()) {
      for (const basura of parametrosBasura) {
        if (key.toLowerCase().includes(basura.toLowerCase())) {
          paramsAEliminar.push(key);
          break;
        }
      }
    }
    
    paramsAEliminar.forEach(key => params.delete(key));
    return url.toString();
  } catch (e) {
    let linkLimpio = link;
    for (const basura of parametrosBasura) {
      const regex = new RegExp(`[?&]${basura}[^&]*&?`, 'gi');
      linkLimpio = linkLimpio.replace(regex, '');
    }
    return linkLimpio.replace(/\?$/, '').replace(/&$/, '');
  }
}

// ========================================
// FUNCIÓN: VALIDAR LINK (SIN ANUNCIOS)
// ========================================
function esLinkValido(link: string): boolean {
  const excluir = [
    'google', 'facebook', 'twitter', 'instagram', 'pinterest',
    'youtube', 'whatsapp', 'telegram', 'anuncio', 'ad', 'banner',
    'popup', 'redirect', 'click', 'tracking', 'analytics'
  ];
  const linkLower = link.toLowerCase();
  for (const termino of excluir) {
    if (linkLower.includes(termino)) return false;
  }
  return true;
}
