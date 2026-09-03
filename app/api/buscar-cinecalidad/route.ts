import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");
  const linkDirectoProporcionado = req.nextUrl.searchParams.get("link");

  // Si el usuario proporcionó un link directo, usarlo
  if (linkDirectoProporcionado) {
    try {
      const pelicula = await extraerPeliculaDesdeLink(linkDirectoProporcionado);
      if (pelicula) {
        return NextResponse.json({ pelicula });
      }
    } catch (error) {
      console.error("Error al extraer desde link:", error);
    }
  }

  if (!nombre) {
    return NextResponse.json({ error: "Nombre de película o link requerido" }, { status: 400 });
  }

  try {
    // ========================================
    // OPCIÓN 1: BUSCAR EN CINECALIDAD
    // ========================================
    const searchUrl = `https://www.cinecalidad.am/?s=${encodeURIComponent(nombre)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Referer": "https://www.cinecalidad.am/",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "No se pudo acceder a Cinecalidad" }, { status: 404 });
    }

    const html = await response.text();
    
    let pelicula = extraerPeliculaDeBusqueda(html, nombre);

    if (!pelicula) {
      const linkGenerado = `https://www.cinecalidad.am/ver-pelicula/${nombre.toLowerCase().replace(/ /g, "-")}/`;
      pelicula = await extraerPeliculaDesdeLink(linkGenerado);
    }

    if (!pelicula) {
      return NextResponse.json({ error: "No se encontró la película en Cinecalidad" }, { status: 404 });
    }

    // Limpiar el link directo de anuncios y redireccionamientos
    if (pelicula.link_directo) {
      pelicula.link_directo = limpiarLink(pelicula.link_directo);
    }

    return NextResponse.json({ pelicula });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al buscar la película" }, { status: 500 });
  }
}

// ========================================
// FUNCIÓN: Extraer desde link directo
// ========================================
async function extraerPeliculaDesdeLink(link: string) {
  try {
    const response = await fetch(link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.cinecalidad.am/",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extraer título
    const tituloMatch = html.match(/<h1[^>]*>([^<]*)<\/h1>/i) ||
                        html.match(/<title>([^<]*)<\/title>/i);
    const titulo = tituloMatch ? tituloMatch[1].trim().replace(" - Cinecalidad", "") : "Sin título";

    // Extraer año
    const anioMatch = html.match(/\b(19\d{2}|20\d{2})\b/);
    const anio = anioMatch ? anioMatch[1] : "2024";

    // Extraer carátula (MEJORADO)
    const imgMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*poster[^"]*"[^>]*>/i) ||
                     html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i) ||
                     html.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
    const caratula = imgMatch ? imgMatch[1] : "";

    // Extraer sinopsis
    const sinopsisMatch = html.match(/<p[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]*)<\/p>/i) ||
                          html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    const sinopsis = sinopsisMatch ? sinopsisMatch[1].trim() : "Sin sinopsis disponible";

    // Extraer género
    const generoMatch = html.match(/<span[^>]*class="[^"]*genre[^"]*"[^>]*>([^<]*)<\/span>/i);
    const genero = generoMatch ? generoMatch[1].trim() : "Desconocido";

    // Buscar link directo de descarga (sin anuncios)
    let linkDirecto = await obtenerLinkDirectoDesdePagina(html, link);

    // Si no hay link directo, usar la página de detalle
    if (!linkDirecto) {
      linkDirecto = link;
    }

    // Limpiar el link de anuncios y redireccionamientos
    linkDirecto = limpiarLink(linkDirecto);

    return {
      titulo,
      anio,
      genero,
      sinopsis,
      caratula: caratula.startsWith("http") ? caratula : `https://www.cinecalidad.am${caratula}`,
      link_directo: linkDirecto,
      fuente: "cinecalidad",
    };

  } catch (error) {
    console.error("Error al extraer desde link:", error);
    return null;
  }
}

// ========================================
// FUNCIÓN: Extraer de búsqueda (MEJORADA)
// ========================================
function extraerPeliculaDeBusqueda(html: string, nombreBuscado: string) {
  // Múltiples patrones para encontrar resultados
  const patrones = [
    /<article[^>]*class="[^"]*movie-item[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*movie[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<li[^>]*class="[^"]*movie[^"]*"[^>]*>([\s\S]*?)<\/li>/i,
  ];

  for (const patron of patrones) {
    const match = patron.exec(html);
    if (match) {
      const item = match[1];
      
      const tituloMatch = item.match(/<h[2-3][^>]*>([^<]*)<\/h[2-3]>/i) || 
                          item.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*)<\/span>/i) ||
                          item.match(/<a[^>]*>([^<]*)<\/a>/i);
      const titulo = tituloMatch ? tituloMatch[1].trim() : nombreBuscado;

      if (titulo && titulo.length > 3) {
        const anioMatch = item.match(/\b(19\d{2}|20\d{2})\b/);
        const anio = anioMatch ? anioMatch[1] : "2024";

        const imgMatch = item.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
        const caratula = imgMatch ? imgMatch[1] : "";

        const linkMatch = item.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
        const link = linkMatch ? linkMatch[1] : "";

        const sinopsisMatch = item.match(/<p[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]*)<\/p>/i);
        const sinopsis = sinopsisMatch ? sinopsisMatch[1].trim() : "Sin sinopsis disponible";

        const generoMatch = item.match(/<span[^>]*class="[^"]*genre[^"]*"[^>]*>([^<]*)<\/span>/i);
        const genero = generoMatch ? generoMatch[1].trim() : "Desconocido";

        let linkDirecto = link ? (link.startsWith("http") ? link : `https://www.cinecalidad.am${link}`) : "";
        linkDirecto = limpiarLink(linkDirecto);

        return {
          titulo,
          anio,
          genero,
          sinopsis,
          caratula: caratula.startsWith("http") ? caratula : `https://www.cinecalidad.am${caratula}`,
          link_directo: linkDirecto,
          fuente: "cinecalidad",
        };
      }
    }
  }

  return null;
}

// ========================================
// FUNCIÓN: Obtener link directo sin anuncios (MEJORADA)
// ========================================
async function obtenerLinkDirectoDesdePagina(html: string, urlBase: string): Promise<string | null> {
  // Patrones para encontrar links de descarga directa
  const patrones = [
    /<a[^>]*href="(https?:\/\/[^"]*\.(mp4|mkv|avi|mov|webm|m3u8|mpd)[^"]*)"[^>]*>/gi,
    /<a[^>]*class="[^"]*download[^"]*"[^>]*href="([^"]*)"[^>]*>/gi,
    /<a[^>]*href="(https?:\/\/(mega\.nz|mediafire\.com|drive\.google\.com)[^"]*)"[^>]*>/gi,
    /<source[^>]*src="([^"]*)"[^>]*>/gi,
    /<iframe[^>]*src="(https?:\/\/[^"]*)"[^>]*>/gi,
    /<video[^>]*src="([^"]*)"[^>]*>/gi,
    /<a[^>]*href="(https?:\/\/[^"]*\/download\/[^"]*)"[^>]*>/gi,
  ];

  for (const patron of patrones) {
    const regex = new RegExp(patron);
    let match;
    while ((match = regex.exec(html)) !== null) {
      const link = match[1];
      if (link && 
          !link.includes("anuncio") && 
          !link.includes("ad") &&
          !link.includes("google") &&
          !link.includes("facebook") &&
          !link.includes("twitter") &&
          !link.includes("instagram") &&
          !link.includes("pinterest") &&
          !link.includes("youtube") &&
          !link.includes("whatsapp") &&
          !link.includes("telegram") &&
          !link.includes("redirect") &&
          !link.includes("click") &&
          !link.includes("popup") &&
          !link.includes("banner") &&
          !link.includes("out.php") &&
          !link.includes("go.php")) {
        return limpiarLink(link);
      }
    }
  }

  return null;
}

// ========================================
// FUNCIÓN: Limpiar link de anuncios y redireccionamientos (MEJORADA)
// ========================================
function limpiarLink(link: string): string {
  if (!link) return "";

  // Eliminar parámetros de rastreo y anuncios
  const parametrosBasura = [
    'utm_', 'ref=', 'source=', 'campaign=', 'medium=',
    'affiliate', 'affid=', 'partner=', 'promo=', 'click=',
    'redirect=', 'ad=', 'banner=', 'popup=', 'fbclid=',
    'tracking', 'analytics', 'campaign', 'source', 'medium',
    'term', 'content', 'placement', 'network', 'device'
  ];

  let linkLimpio = link;

  // Si el link tiene un redirect, extraer la URL real
  if (linkLimpio.includes('redirect') || linkLimpio.includes('go/') || linkLimpio.includes('out.php')) {
    const match = linkLimpio.match(/(https?:\/\/[^?&]*)/);
    if (match) {
      linkLimpio = match[1];
    }
  }

  // Eliminar parámetros basura
  try {
    const url = new URL(linkLimpio);
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
    linkLimpio = url.toString();
  } catch (e) {
    // Si no es una URL válida, intentar con regex
    for (const basura of parametrosBasura) {
      const regex = new RegExp(`[?&]${basura}[^&]*&?`, 'gi');
      linkLimpio = linkLimpio.replace(regex, '');
    }
    linkLimpio = linkLimpio.replace(/\?$/, '').replace(/&$/, '');
  }

  // Eliminar fragmentos (#) que no sirven
  if (linkLimpio.includes('#')) {
    linkLimpio = linkLimpio.split('#')[0];
  }

  return linkLimpio;
}
