import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");

  if (!nombre) {
    return NextResponse.json({ error: "Nombre de película requerido" }, { status: 400 });
  }

  try {
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
    
    const pelicula = extraerPeliculaDeHTML(html, nombre);

    if (!pelicula) {
      return NextResponse.json({ error: "No se encontró la película" }, { status: 404 });
    }

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

function extraerPeliculaDeHTML(html: string, nombreBuscado: string) {
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

  const sinopsisMatch = item.match(/<p[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]*)<\/p>/i) ||
                        item.match(/<div[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]*)<\/div>/i);
  const sinopsis = sinopsisMatch ? sinopsisMatch[1].trim() : "Sin sinopsis disponible";

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

async function obtenerLinkDirecto(urlPagina: string): Promise<string | null> {
  try {
    const response = await fetch(urlPagina, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    const patrones = [
      /<a[^>]*href="(https?:\/\/[^"]*\.(mp4|mkv|avi|mov|webm)[^"]*)"[^>]*>/gi,
      /<iframe[^>]*src="(https?:\/\/[^"]*)"[^>]*>/gi,
      /<a[^>]*class="[^"]*download[^"]*"[^>]*href="([^"]*)"[^>]*>/gi,
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

    return urlPagina;

  } catch (error) {
    console.error("Error obteniendo link directo:", error);
    return null;
  }
}
