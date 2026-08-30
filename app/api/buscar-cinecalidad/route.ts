import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const nombre = req.nextUrl.searchParams.get("nombre");

  if (!nombre) {
    return NextResponse.json({ error: "Nombre de película requerido" }, { status: 400 });
  }

  try {
    // Construir URL de búsqueda en Cinecalidad
    const searchUrl = `https://cinecalidad.gg/?s=${encodeURIComponent(nombre)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "No se pudo acceder a Cinecalidad" }, { status: 404 });
    }

    const html = await response.text();
    
    // Buscar resultados con expresiones regulares (más robusto que Cheerio)
    const regexResultados = /<article[^>]*class="[^"]*movie-item[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    const resultados = [];
    let match;

    while ((match = regexResultados.exec(html)) !== null) {
      const item = match[1];
      
      // Extraer título
      const tituloMatch = item.match(/<h2[^>]*>([^<]*)<\/h2>/i) || item.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*)<\/span>/i);
      const titulo = tituloMatch ? tituloMatch[1].trim() : "";
      
      // Extraer año
      const anioMatch = item.match(/(\d{4})/);
      const anio = anioMatch ? anioMatch[1] : "";
      
      // Extraer carátula
      const imagenMatch = item.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
      const caratula = imagenMatch ? imagenMatch[1] : "";
      
      // Extraer link
      const linkMatch = item.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
      const link = linkMatch ? linkMatch[1] : "";

      // Extraer sinopsis
      const sinopsisMatch = item.match(/<p[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]*)<\/p>/i) ||
                            item.match(/<div[^>]*class="[^"]*synopsis[^"]*"[^>]*>([^<]*)<\/div>/i);
      const sinopsis = sinopsisMatch ? sinopsisMatch[1].trim() : "";

      // Extraer género
      const generoMatch = item.match(/<span[^>]*class="[^"]*genre[^"]*"[^>]*>([^<]*)<\/span>/i);
      const genero = generoMatch ? generoMatch[1].trim() : "";

      if (titulo) {
        resultados.push({
          titulo,
          anio: anio || "2024",
          genero: genero || "Desconocido",
          sinopsis: sinopsis || "Sin sinopsis disponible",
          caratula: caratula.startsWith("http") ? caratula : `https://cinecalidad.gg${caratula}`,
          link_directo: link.startsWith("http") ? link : `https://cinecalidad.gg${link}`,
          fuente: "cinecalidad",
        });
      }
    }

    if (resultados.length === 0) {
      return NextResponse.json({ error: "No se encontró la película" }, { status: 404 });
    }

    // Devolver el primer resultado
    return NextResponse.json({ pelicula: resultados[0] });

  } catch (error) {
    console.error("Error al buscar:", error);
    return NextResponse.json({ error: "Error al buscar la película" }, { status: 500 });
  }
}
