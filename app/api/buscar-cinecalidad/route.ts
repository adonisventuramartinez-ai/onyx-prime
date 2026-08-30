import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");

  if (!nombre) {
    return NextResponse.json({ error: "Nombre de película requerido" }, { status: 400 });
  }

  try {
    // ========================================
    // PASO 1: Buscar en Cinecalidad
    // ========================================
    const searchUrl = `https://cinecalidad.gg/?s=${encodeURIComponent(nombre)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "No se pudo acceder a Cinecalidad" }, { status: 404 });
    }

    const html = await response.text();
    
    // ========================================
    // PASO 2: Extraer datos de la película
    // ========================================
    const pelicula = extraerPeliculaDeHTML(html, nombre);

    if (!pelicula) {
      return NextResponse.json({ error: "No se encontró la película" }, { status: 404 });
    }

    // ========================================
    // PASO 3: Obtener link directo sin anuncios
    // ========================================
    if (pelicula.link) {
      const linkDirecto = await obtenerLinkDirecto(pelicula.link);
      pelicula.link_directo = linkDirecto || pelicula.link;
    }

    return NextResponse.json({ pelicula });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al buscar la película" }, { status: 500 });
  }
}

// ========================================
// FUNCIÓN: Extraer película del HTML
// ========================================
function extraerPeliculaDeHTML(html: string, nombreBuscado: string) {
  // Buscar el primer resultado de la búsqueda
  const regexResultado = /<article[^>]*class="[^"]*movie-item[^"]*"[^>]*>([\s\S]*?)<\/article>/i;
  const match = regexResultado.exec(html);
  
  if (!match) return null;

  const item = match[1];

  // Extraer título
  const tituloMatch = item.match(/<h[2-3][^>]*>([^<]*)<\/h[2-3]>/i) || 
                      item.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*)<\/span>/i);
  const titulo = tituloMatch ? tituloMatch[1].trim() : nombreBuscado;

  // Extraer año
  const anioMatch = item.match(/\b(19\d{2}|20\d{2})\b/);
  const anio = anioMatch ? anioMatch[1] : "2024";

  // Extraer carátula
  const imgMatch = item.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
  const caratula = imgMatch ? imgMatch[1] : "";

  // Extraer link de la página de la película
  const linkMatch = item.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
  const link = linkMatch ? linkMatch[1] : "";

  // Extraer sinopsis
  const sinopsisMatch = item.match(/<p[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]*)<\/p>/i) ||
                        item.match(/<div[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]*)<\/div>/i);
  const sinopsis = sinopsisMatch ? sinopsisMatch[1].trim() : "Sin sinopsis disponible";

  // Extraer género
  const generoMatch = item.match(/<span[^>]*class="[^"]*genre[^"]*"[^>]*>([^<]*)<\/span>/i);
  const genero = generoMatch ? generoMatch[1].trim() : "Desconocido";

  return {
    titulo,
    anio,
    genero,
    sinopsis,
    caratula: caratula.startsWith("http") ? caratula : `https://cinecalidad.gg${caratula}`,
    link: link.startsWith("http") ? link : `https://cinecalidad.gg${link}`,
    link_directo: "",
    fuente: "cinecalidad",
  };
}

// ========================================
// FUNCIÓN: Obtener link directo sin anuncios
// ========================================
async function obtenerLinkDirecto(urlPagina: string): Promise<string | null> {
  try {
    const response = await fetch(urlPagina, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Buscar links de descarga directa (sin anuncios)
    const patrones = [
      // Patrón 1: Links de descarga directa
      /<a[^>]*href="(https?:\/\/[^"]*\.(mp4|mkv|avi|mov|webm)[^"]*)"[^>]*>/gi,
      // Patrón 2: Links de streaming directo
      /<iframe[^>]*src="(https?:\/\/[^"]*)"[^>]*>/gi,
      // Patrón 3: Links de descarga con clase específica
      /<a[^>]*class="[^"]*download[^"]*"[^>]*href="([^"]*)"[^>]*>/gi,
      // Patrón 4: Links de Mega, MediaFire, etc.
      /<a[^>]*href="(https?:\/\/(mega\.nz|mediafire\.com|drive\.google\.com)[^"]*)"[^>]*>/gi,
    ];

    for (const patron of patrones) {
      const regex = new RegExp(patron);
      let match;
      while ((match = regex.exec(html)) !== null) {
        const link = match[1];
        if (link && !link.includes("anuncio") && !link.includes("ad")) {
          return link;
        }
      }
    }

    // Si no encuentra link directo, devolver la página de detalle
    return urlPagina;

  } catch (error) {
    console.error("Error obteniendo link directo:", error);
    return null;
  }
}
