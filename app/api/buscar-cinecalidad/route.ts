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
    
    // Extraer datos de la búsqueda
    let pelicula = extraerPeliculaDeBusqueda(html, nombre);

    // Si no encontró en la búsqueda, intentar buscar directamente
    if (!pelicula) {
      // Intentar con el link directo generado
      const linkGenerado = `https://www.cinecalidad.am/ver-pelicula/${nombre.toLowerCase().replace(/ /g, "-")}/`;
      pelicula = await extraerPeliculaDesdeLink(linkGenerado);
    }

    if (!pelicula) {
      return NextResponse.json({ error: "No se encontró la película en Cinecalidad" }, { status: 404 });
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

    // Extraer carátula
    const imgMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*poster[^"]*"[^>]*>/i) ||
                     html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
    const caratula = imgMatch ? imgMatch[1] : "";

    // Extraer sinopsis
    const sinopsisMatch = html.match(/<p[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]*)<\/p>/i) ||
                          html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    const sinopsis = sinopsisMatch ? sinopsisMatch[1].trim() : "Sin sinopsis disponible";

    // Extraer género
    const generoMatch = html.match(/<span[^>]*class="[^"]*genre[^"]*"[^>]*>([^<]*)<\/span>/i);
    const genero = generoMatch ? generoMatch[1].trim() : "Desconocido";

    // Buscar link directo de descarga
    const linkDirecto = await obtenerLinkDirectoDesdePagina(html, link);

    return {
      titulo,
      anio,
      genero,
      sinopsis,
      caratula: caratula.startsWith("http") ? caratula : `https://www.cinecalidad.am${caratula}`,
      link_directo: linkDirecto || link,
      fuente: "cinecalidad",
    };

  } catch (error) {
    console.error("Error al extraer desde link:", error);
    return null;
  }
}

// ========================================
// FUNCIÓN: Extraer de búsqueda
// ========================================
function extraerPeliculaDeBusqueda(html: string, nombreBuscado: string) {
  const regexResultado = /<article[^>]*class="[^"]*movie-item[^"]*"[^>]*>([\s\S]*?)<\/article>/i;
  const match = regexResultado.exec(html);
  
  if (!match) return null;

  const item = match[1];

  const tituloMatch = item.match(/<h[2-3][^>]*>([^<]*)<\/h[2-3]>/i) || 
                      item.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*)<\/span>/i);
  const titulo = tituloMatch ? tituloMatch[1].trim() : nombreBuscado;

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

  return {
    titulo,
    anio,
    genero,
    sinopsis,
    caratula: caratula.startsWith("http") ? caratula : `https://www.cinecalidad.am${caratula}`,
    link_directo: link ? (link.startsWith("http") ? link : `https://www.cinecalidad.am${link}`) : "",
    fuente: "cinecalidad",
  };
}

// ========================================
// FUNCIÓN: Obtener link directo sin anuncios
// ========================================
async function obtenerLinkDirectoDesdePagina(html: string, urlBase: string): Promise<string | null> {
  const patrones = [
    /<a[^>]*href="(https?:\/\/[^"]*\.(mp4|mkv|avi|mov|webm|m3u8|mpd)[^"]*)"[^>]*>/gi,
    /<a[^>]*class="[^"]*download[^"]*"[^>]*href="([^"]*)"[^>]*>/gi,
    /<a[^>]*href="(https?:\/\/(mega\.nz|mediafire\.com|drive\.google\.com)[^"]*)"[^>]*>/gi,
    /<source[^>]*src="([^"]*)"[^>]*>/gi,
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
          !link.includes("telegram")) {
        return link;
      }
    }
  }

  return null;
}
