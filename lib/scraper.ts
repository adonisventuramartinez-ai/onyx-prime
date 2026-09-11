const TMDB_API_KEY = process.env.TMDB_API_KEY || "67fff863bf6ae181cd30a3519662ea70";
const CINECALIDAD_URL = "https://www.cinecalidad.am";
const CINEHDPLUS_URL = "https://cinehdplus.surf";

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

// Buscar en TMDB
export async function buscarEnTMDB(nombre: string) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(nombre)}&language=es-ES`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch {
    return null;
  }
}

// Buscar link de película en Cinecalidad
export async function buscarEnCinecalidad(titulo: string): Promise<string | null> {
  try {
    const res = await fetch(`${CINECALIDAD_URL}/?s=${encodeURIComponent(titulo)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
  } catch {
    return null;
  }
}

// Buscar link en CineHDPlus
export async function buscarEnCineHDPlus(titulo: string): Promise<string | null> {
  try {
    const res = await fetch(`${CINEHDPLUS_URL}/?s=${encodeURIComponent(titulo)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
  } catch {
    return null;
  }
}

// Extraer iframe de una página de película
export async function extraerIframe(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": CINECALIDAD_URL,
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    // Buscar iframe con doodstream
    const match = html.match(/<iframe[^>]*src=["']([^"']*dood[^"']*)["'][^>]*>/i);
    if (match) return match[1];
    
    // Buscar cualquier iframe
    const anyMatch = html.match(/<iframe[^>]*src=["']([^"']*)["'][^>]*>/i);
    return anyMatch ? anyMatch[1] : null;
  } catch {
    return null;
  }
}

// Función principal: buscar película completa
export async function buscarPeliculaCompleta(nombre: string): Promise<PeliculaScraped | null> {
  try {
    const movie = await buscarEnTMDB(nombre);
    if (!movie) return null;

    // Buscar en ambas fuentes
    const linkCinecalidad = await buscarEnCinecalidad(movie.title);
    const linkCineHD = await buscarEnCineHDPlus(movie.title);
    
    const linkPagina = linkCinecalidad || linkCineHD;
    
    let linkDirecto = "";
    let headers: Record<string, string> = {};

    if (linkPagina) {
      const iframeUrl = await extraerIframe(linkPagina);
      
      if (iframeUrl && iframeUrl.includes("dood")) {
        // Llamar a nuestra API de extracción
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://onyx-prime.vercel.app";
        const extractRes = await fetch(`${baseUrl}/api/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: iframeUrl }),
        });
        
        if (extractRes.ok) {
          const data = await extractRes.json();
          linkDirecto = data.link_directo;
          headers = data.headers || {};
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
    console.error("Error:", error);
    return null;
  }
}
