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
    const links = extraerTodosLosLinks(html);
    const linksLimpios = links
      .map(l => limpiarParametros(l))
      .filter(l => esLinkValido(l));

    // Buscar específicamente en servidores conocidos
    const servidores = {
      'vimeos.net': extraerDeVimeos(html),
      'goodstream.one': extraerDeGoodstream(html),
      'voe.sx': extraerDeVoe(html),
      'doodstream.com': extraerDeDoodstream(html),
      'videoapp.zip': extraerDeVideoapp(html),
    };

    // Combinar todos los links
    const todosLosLinks = [...linksLimpios];
    for (const key in servidores) {
      if (servidores[key as keyof typeof servidores]) {
        todosLosLinks.push(servidores[key as keyof typeof servidores]!);
      }
    }

    // Seleccionar el mejor link
    const prioridad = ['mp4', 'm3u8', 'webm', 'mkv', 'avi', 'mov'];
    let mejorLink = null;
    let mejorPrioridad = 999;

    for (const link of todosLosLinks) {
      const ext = link.split('.').pop()?.toLowerCase() || '';
      const idx = prioridad.indexOf(ext);
      if (idx !== -1 && idx < mejorPrioridad) {
        mejorPrioridad = idx;
        mejorLink = link;
      }
    }

    if (!mejorLink && todosLosLinks.length > 0) {
      mejorLink = todosLosLinks[0];
    }

    return {
      original: url,
      link_directo: mejorLink,
      todos_los_links: [...new Set(todosLosLinks)],
      mensaje: mejorLink ? "✅ Link directo encontrado" : "❌ No se encontró link de video"
    };

  } catch (error) {
    console.error("Error al limpiar link:", error);
    return { 
      original: url, 
      link_directo: null, 
      mensaje: "Error al procesar" 
    };
  }
}

// ========================================
// FUNCIÓN: EXTRAER TODOS LOS LINKS
// ========================================
function extraerTodosLosLinks(html: string): string[] {
  const links: string[] = [];
  
  const patrones = [
    /<iframe[^>]*src=["']([^"']*)["'][^>]*>/gi,
    /<video[^>]*src=["']([^"']*)["'][^>]*>/gi,
    /<source[^>]*src=["']([^"']*)["'][^>]*>/gi,
    /href=["'](https?:\/\/[^"']*\.(mp4|m3u8|mkv|avi|mov|webm)[^"']*)["']/gi,
    /src=["'](https?:\/\/[^"']*\.(mp4|m3u8|mkv|avi|mov|webm)[^"']*)["']/gi,
    /(https?:\/\/[^"'\s]*\.(mp4|m3u8|mkv|avi|mov|webm)[^"'\s]*)/gi,
    /(https?:\/\/[^"']*\/embed\/[^"']*)/gi,
    /(https?:\/\/[^"']*\/stream\/[^"']*)/gi,
    /(https?:\/\/(mega\.nz|mediafire\.com|drive\.google\.com)[^"'\s]*)/gi,
    // Scripts
    /<script[^>]*>([\s\S]*?)<\/script>/gi,
  ];

  for (const patron of patrones) {
    const regex = new RegExp(patron, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      const link = match[1] || match[0];
      if (link && !link.includes('data:') && !link.includes('javascript:')) {
        links.push(link.trim());
      }
    }
  }

  return [...new Set(links)];
}

// ========================================
// FUNCIONES PARA SERVIDORES ESPECÍFICOS
// ========================================

function extraerDeVimeos(html: string): string | null {
  // Buscar el link real en vimeos.net
  const match = html.match(/<iframe[^>]*src=["']([^"']*)["'][^>]*>/i);
  if (match) return match[1];
  return null;
}

function extraerDeGoodstream(html: string): string | null {
  // Buscar el link real en goodstream.one
  const match = html.match(/<source[^>]*src=["']([^"']*)["'][^>]*>/i) ||
                html.match(/<video[^>]*src=["']([^"']*)["'][^>]*>/i);
  if (match) return match[1];
  return null;
}

function extraerDeVoe(html: string): string | null {
  // Buscar el link real en voe.sx
  const match = html.match(/<iframe[^>]*src=["']([^"']*)["'][^>]*>/i) ||
                html.match(/window\.location\.href\s*=\s*["']([^"']*)["']/i);
  if (match) return match[1];
  return null;
}

function extraerDeDoodstream(html: string): string | null {
  // Buscar el link real en doodstream.com
  const match = html.match(/<video[^>]*src=["']([^"']*)["'][^>]*>/i) ||
                html.match(/file\s*:\s*["']([^"']*)["']/i);
  if (match) return match[1];
  return null;
}

function extraerDeVideoapp(html: string): string | null {
  // Buscar el link real en videoapp.zip
  const match = html.match(/<iframe[^>]*src=["']([^"']*)["'][^>]*>/i) ||
                html.match(/href=["']([^"']*\.(mp4|m3u8)[^"']*)["']/i);
  if (match) return match[1];
  return null;
}

// ========================================
// FUNCIÓN: LIMPIAR PARÁMETROS
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
// FUNCIÓN: VALIDAR LINK
// ========================================
function esLinkValido(link: string): boolean {
  const excluir = [
    'google', 'facebook', 'twitter', 'instagram', 'pinterest',
    'youtube.com/watch', 'youtu.be/watch',
    'whatsapp', 'telegram', 'anuncio', 'ad', 'banner',
    'popup', 'redirect', 'click', 'tracking', 'analytics',
    'doubleclick', 'googletag', 'amazon-adsystem'
  ];
  const linkLower = link.toLowerCase();
  for (const termino of excluir) {
    if (linkLower.includes(termino)) return false;
  }
  return true;
}
