// ========================================
// LIB/SCRAPER.TS - SCRAPER COMPLETO
// ========================================

import * as cheerio from "cheerio";

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
// MAPA DE GÉNEROS TMDB
// ========================================
const GENEROS_TMDB: Record<number, string> = {
  28: "Acción",
  12: "Aventura",
  16: "Animación",
  35: "Comedia",
  80: "Crimen",
  99: "Documental",
  18: "Drama",
  10751: "Familia",
  14: "Fantasía",
  36: "Historia",
  27: "Terror",
  10402: "Música",
  9648: "Misterio",
  10749: "Romance",
  878: "Ciencia Ficción",
  10770: "Película de TV",
  53: "Suspense",
  10752: "Bélica",
  37: "Western",
};

function obtenerGeneroReal(genre_ids?: number[]): string {
  if (!genre_ids || genre_ids.length === 0) return "Desconocido";
  const nombres = genre_ids.map((id) => GENEROS_TMDB[id]).filter(Boolean);
  return nombres.length > 0 ? nombres.join(", ") : "Desconocido";
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
// 2. BUSCAR EN CINECALIDAD (con cheerio)
// ========================================
export async function buscarEnCinecalidad(titulo: string): Promise<string | null> {
  try {
    const res = await fetch(`${CINECALIDAD_URL}/?s=${encodeURIComponent(titulo)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const selectores = [
      "article a[href*='/pelicula/']",
      ".post a[href*='/pelicula/']",
      ".item a[href*='/pelicula/']",
      "h2 a",
      "h3 a",
      "article a",
      ".post a",
    ];

    for (const sel of selectores) {
      const href = $(sel).first().attr("href");
      if (href && !href.includes("/?s=") && !href.includes("category")) {
        return href.startsWith("http") ? href : `${CINECALIDAD_URL}${href}`;
      }
    }

    return null;
  } catch (error) {
    console.error("Error buscando en Cinecalidad:", error);
    return null;
  }
}

// ========================================
// 3. BUSCAR EN CINEHDPLUS (con cheerio)
// ========================================
export async function buscarEnCineHDPlus(titulo: string): Promise<string | null> {
  try {
    const res = await fetch(`${CINEHDPLUS_URL}/?s=${encodeURIComponent(titulo)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const selectores = [
      "article a[href*='/pelicula/']",
      ".post a[href*='/pelicula/']",
      ".item a[href*='/pelicula/']",
      "h2 a",
      "h3 a",
      "article a",
      ".post a",
    ];

    for (const sel of selectores) {
      const href = $(sel).first().attr("href");
      if (href && !href.includes("/?s=") && !href.includes("category")) {
        return href.startsWith("http") ? href : `${CINEHDPLUS_URL}${href}`;
      }
    }

    return null;
  } catch (error) {
    console.error("Error buscando en CineHDPlus:", error);
    return null;
  }
}

// ========================================
// 4. EXTRAER IFRAME DEL HOST DE VIDEO
// ========================================
export async function extraerIframeDoodstream(urlPagina: string): Promise<string | null> {
  try {
    const res = await fetch(urlPagina, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: CINECALIDAD_URL,
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Buscar iframes con hosts conocidos primero
    const doodMatch = html.match(/<iframe[^>]*src=["']([^"']*(?:dood|voe|vimeos|goodstream|hlswish|videoapp|dr0pstream)[^"']*)["'][^>]*>/i);
    if (doodMatch) return doodMatch[1];

    const embedMatch = html.match(/<iframe[^>]*src=["']([^"']*embed[^"']*)["'][^>]*>/i);
    if (embedMatch) return embedMatch[1];

    // Cualquier iframe como último recurso
    const anyMatch = html.match(/<iframe[^>]*src=["']([^"']*)["'][^>]*>/i);
    return anyMatch ? anyMatch[1] : null;
  } catch (error) {
    console.error("Error extrayendo iframe:", error);
    return null;
  }
}

// ========================================
// 5. EXTRAER LINK DIRECTO (llamando a /api/extract)
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

    // Buscar en ambas fuentes en paralelo
    const [linkCinecalidad, linkCineHD] = await Promise.all([
      buscarEnCinecalidad(movie.title),
      buscarEnCineHDPlus(movie.title),
    ]);

    const linkPagina = linkCinecalidad || linkCineHD;

    let linkDirecto = "";
    let headers: Record<string, string> = {};

    // Si encontramos página, extraemos el iframe del host
    if (linkPagina) {
      const iframeUrl = await extraerIframeDoodstream(linkPagina);
      if (iframeUrl) {
        // Guardamos la URL del iframe (NO el .m3u8).
        // El reproductor llamará a /api/extract cuando el usuario le dé play.
        linkDirecto = iframeUrl;
        headers = {
          Referer: linkPagina,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        };
      }
    }

    return {
      titulo: movie.title,
      anio: movie.release_date ? movie.release_date.split("-")[0] : "2024",
      genero: obtenerGeneroReal(movie.genre_ids),
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
export async function obtenerPeliculasPorAnio(
  anio: number,
  maxPaginas: number = 3
): Promise<any[]> {
  const peliculas: any[] = [];

  try {
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=es-ES&sort_by=popularity.desc&primary_release_year=${anio}&page=${pagina}`;

      const res = await fetch(url);
      if (!res.ok) break;

      const data = await res.json();
      if (data.results) peliculas.push(...data.results);

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error("Error obteniendo películas:", error);
  }

  return peliculas;
}
