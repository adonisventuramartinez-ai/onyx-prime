// ========================================
// LIB/SCRAPER.TS - SCRAPER SIMPLE Y ESTABLE
// Fuente: VidLink (acepta tmdb_id directo, no bloquea Vercel)
// ========================================

const TMDB_API_KEY = process.env.TMDB_API_KEY || "67fff863bf6ae181cd30a3519662ea70";

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
// 2. GENERAR LINK DE VIDLINK DESDE TMDB_ID
// ========================================
export function generarLinkVidLink(tmdb_id: number): string {
  return `https://vidlink.pro/movie/${tmdb_id}`;
}

// ========================================
// 3. FUNCIÓN PRINCIPAL: BUSCAR PELÍCULA COMPLETA
// ========================================
export async function buscarPeliculaCompleta(nombre: string): Promise<PeliculaScraped | null> {
  try {
    const movie = await buscarEnTMDB(nombre);
    if (!movie) return null;

    // VidLink acepta tmdb_id directo → siempre genera link válido
    const linkDirecto = generarLinkVidLink(movie.id);

    return {
      titulo: movie.title,
      anio: movie.release_date ? movie.release_date.split("-")[0] : "2024",
      genero: obtenerGeneroReal(movie.genre_ids),
      sinopsis: movie.overview || "Sin sinopsis disponible",
      caratula: movie.poster_path
        ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
        : "",
      link_directo: linkDirecto,
      headers: {},
      fuente: "auto",
    };
  } catch (error) {
    console.error("Error en buscarPeliculaCompleta:", error);
    return null;
  }
}

// ========================================
// 4. OBTENER PELÍCULAS DE TMDB POR AÑO
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
