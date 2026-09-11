// ========================================
// LIB/SCRAPER.TS - SCRAPER COMPLETO
// ========================================

const TMDB_API_KEY = process.env.TMDB_API_KEY || "67fff863bf6ae181cd30a3519662ea70";
const CINECALIDAD_URL = "https://www.cinecalidad.am";
const CINEHDPLUS_URL = "https://cinehdplus.surf";

// ========================================
// TIPOS
// ========================================
export interface PeliculaScraped {
  titulo: string;
  anio: string;
  genero: string;
  sinopsis: string;
  caratula: string;
  link_directo: string;
  headers: Record<string, string>;
  fuente: "auto";
}

// ========================================
// 1. BUSCAR EN TMDB
// ========================================
export async function buscarEnTMDB(nombre: string) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(nombre)}&language=es-ES`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error("Error en TMDB:", error);
    return null;
  }
}

// ========================================
// 2. BUSCAR EN CINECALIDAD
// ========================================
export async function buscarEnCinecalidad(titulo: string): Promise<string | null> {
  try {
    const res = await fetch(`${CINECALIDAD_URL}/?s=${encodeURIComponent(titulo)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    const match = html.match(/<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="[^"]*"[^>]*>/i);
    if (match) {
      const link = match[1];
      return link.startsWith("http") ? link : `${CINECALIDAD_URL}${link}`;
    }
    return null;
  } catch (error) {
    console.error("Error buscando en Cinecalidad:", error);
    return null;
  }
}

// ========================================
// 3. BUSCAR EN CINEHDPLUS
// ========================================
export async function buscarEnCineHDPlus(titulo: string): Promise<string | null> {
  try {
    const res = await fetch(`${CINEHDPLUS_URL}/?s=${encodeURIComponent(titulo)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    const match = html.match(/<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="[^"]*"[^>]*>/i);
    if (match) {
      const link = match[1];
      return link.startsWith("http") ? link : `${CINEHDPLUS_URL}${link}`;
    }
    return null;
  } catch (error) {
    console.error("Error buscando en CineHDPlus:", error);
    return null;
  }
}

// ========================================
// 4. EXTRAER IFRAME DE DOODSTREAM
// ========================================
export async function extraerIframeDoodstream(urlPagina: string): Promise<string | null> {
  try {
    const res = await fetch(urlPagina, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": CINECALIDAD_URL,
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    const doodMatch = html.match(/<iframe[^>]*src=["']([^"']*dood[^"']*)["'][^>]*>/i);
    if (doodMatch) return doodMatch[1];
    
    const embedMatch = html.match(/<iframe[^>]*src=["']([^"']*embed[^"']*)["'][^>]*>/i);
    if (embedMatch) return embedMatch[1];
    
    const anyMatch = html.match(/<iframe[^>]*src=["']([^"']*)["'][^>]*>/i);
    return anyMatch ? anyMatch[1] : null;
  } catch (error) {
    console.error("Error extrayendo iframe:", error);
    return null;
  }
}

// ========================================
// 5. EXTRAER LINK DIRECTO DE DOODSTREAM
// ========================================
export async function extraerLinkDoodstream(
  doodstreamUrl: string,
  baseUrl: string
): Promise<{ link_directo: string; headers: Record<string, string> } | null> {
  try {
    const res = await fetch(`${baseUrl}/api/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: doodstreamUrl }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.link_directo) return null;

    return {
      link_directo: data.link_directo,
      headers: data.headers || {},
    };
  } catch (error) {
    console.error("Error extrayendo link de DoodStream:", error);
    return null;
  }
}

// ========================================
// 6. FUNCIÓN PRINCIPAL: BUSCAR PELÍCULA COMPLETA
// ========================================
export async function buscarPeliculaCompleta(nombre: string): Promise<PeliculaScraped | null> {
  try {
    const movie = await buscarEnTMDB(nombre);
    if (!movie) return null;

    const [linkCinecalidad, linkCineHD] = await Promise.all([
      buscarEnCinecalidad(movie.title),
      buscarEnCineHDPlus(movie.title),
    ]);

    const linkPagina = linkCinecalidad || linkCineHD;

    let linkDirecto = "";
    let headers: Record<string, string> = {};

    if (linkPagina) {
      const iframeUrl = await extraerIframeDoodstream(linkPagina);
      if (iframeUrl) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://onyx-prime.vercel.app";
        const extract = await extraerLinkDoodstream(iframeUrl, baseUrl);
        if (extract) {
          linkDirecto = extract.link_directo;
          headers = extract.headers;
        }
      }
    }

    return {
      titulo: movie.title,
      anio: movie.release_date ? movie.release_date.split("-")[0] : "2024",
      genero: "Desconocido",
      sinopsis: movie.overview || "Sin sinopsis disponible",
      caratula: movie.poster_path 
        ? `https://image.tmdb.org/t/p/original${movie.poster_path}` 
        : "",
      link_directo: linkDirecto,
      headers,
      fuente: "auto",
    };
  } catch (error) {
    console.error("Error en buscarPeliculaCompleta:", error);
    return null;
  }
}

// ========================================
// 7. OBTENER PELÍCULAS DE TMDB POR AÑO
// ========================================
export async function obtenerPeliculasPorAnio(anio: number, maxPaginas: number = 3): Promise<any[]> {
  const peliculas: any[] = [];

  try {
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=es-ES&sort_by=popularity.desc&primary_release_year=${anio}&page=${pagina}`;
      
      const res = await fetch(url);
      if (!res.ok) break;

      const data = await res.json();
      if (data.results) peliculas.push(...data.results);
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error("Error obteniendo películas:", error);
  }

  return peliculas;
}
