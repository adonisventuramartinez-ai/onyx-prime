// ========================================
// LIB/SCRAPER.TS - SCRAPER COMPLETO (Películas + Series)
// Fuente: VidLink + TMDB
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

export interface EpisodioScraped {
  tmdb_id: number;
  temporada: number;
  numero: number;
  titulo: string;
  sinopsis: string;
  duracion: number | null;
  caratula: string;
  link_directo: string;
}

export interface SerieScraped {
  tmdb_id: number;
  titulo: string;
  titulo_original: string;
  anio: string;
  genero: string;
  sinopsis: string;
  caratula: string;
  backdrop: string;
  num_temporadas: number;
  num_episodios: number;
  estado: string;
  episodios: EpisodioScraped[];
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
  10759: "Acción y Aventura",
  10762: "Kids",
  10763: "Noticias",
  10764: "Reality",
  10765: "Sci-Fi y Fantasía",
  10766: "Telenovela",
  10767: "Talk Show",
  10768: "Guerra y Política",
};

function obtenerGeneroReal(genre_ids?: number[]): string {
  if (!genre_ids || genre_ids.length === 0) return "Desconocido";
  const nombres = genre_ids.map((id) => GENEROS_TMDB[id]).filter(Boolean);
  return nombres.length > 0 ? nombres.join(", ") : "Desconocido";
}

// ========================================
// 1. BUSCAR PELÍCULA EN TMDB
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
    console.error("Error en TMDB (movie):", error);
    return null;
  }
}

// ========================================
// 2. BUSCAR SERIE EN TMDB
// ========================================
export async function buscarSerieEnTMDB(nombre: string) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(nombre)}&language=es-ES`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error("Error en TMDB (tv):", error);
    return null;
  }
}

// ========================================
// 3. OBTENER DETALLES COMPLETOS DE UNA SERIE
// ========================================
export async function obtenerDetallesSerie(tmdb_id: number) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdb_id}?api_key=${TMDB_API_KEY}&language=es-ES`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error en TMDB (detalles serie):", error);
    return null;
  }
}

// ========================================
// 4. OBTENER EPISODIOS DE UNA TEMPORADA
// ========================================
export async function obtenerEpisodiosTemporada(
  tmdb_id: number,
  temporada: number
): Promise<EpisodioScraped[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdb_id}/season/${temporada}?api_key=${TMDB_API_KEY}&language=es-ES`
    );
    if (!res.ok) return [];
    const data = await res.json();

    if (!data.episodes || !Array.isArray(data.episodes)) return [];

    return data.episodes.map((ep: any) => ({
      tmdb_id: ep.id,
      temporada: ep.season_number,
      numero: ep.episode_number,
      titulo: ep.name || `Episodio ${ep.episode_number}`,
      sinopsis: ep.overview || "Sin sinopsis disponible",
      duracion: ep.runtime || null,
      caratula: ep.still_path
        ? `https://image.tmdb.org/t/p/original${ep.still_path}`
        : "",
      // VidLink para series: /tv/{id}/{temp}/{ep}
      link_directo: `https://vidlink.pro/tv/${tmdb_id}/${ep.season_number}/${ep.episode_number}`,
    }));
  } catch (error) {
    console.error(`Error obteniendo episodios T${temporada}:`, error);
    return [];
  }
}

// ========================================
// 5. GENERAR LINK DE VIDLINK PARA PELÍCULA
// ========================================
export function generarLinkVidLink(tmdb_id: number): string {
  return `https://vidlink.pro/movie/${tmdb_id}`;
}

// ========================================
// 6. FUNCIÓN PRINCIPAL: BUSCAR PELÍCULA COMPLETA
// ========================================
export async function buscarPeliculaCompleta(nombre: string): Promise<PeliculaScraped | null> {
  try {
    const movie = await buscarEnTMDB(nombre);
    if (!movie) return null;

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
// 7. FUNCIÓN PRINCIPAL: BUSCAR SERIE COMPLETA
// ========================================
export async function buscarSerieCompleta(nombre: string): Promise<SerieScraped | null> {
  try {
    const serieBasica = await buscarSerieEnTMDB(nombre);
    if (!serieBasica) return null;

    const detalles = await obtenerDetallesSerie(serieBasica.id);
    if (!detalles) return null;

    const numTemporadas = detalles.number_of_seasons || 0;
    const todosEpisodios: EpisodioScraped[] = [];

    // Cargar episodios de cada temporada (secuencial para no saturar TMDB)
    for (let temp = 1; temp <= numTemporadas; temp++) {
      const episodios = await obtenerEpisodiosTemporada(serieBasica.id, temp);
      todosEpisodios.push(...episodios);
      // Delay pequeño para respetar rate limit de TMDB
      await new Promise((r) => setTimeout(r, 100));
    }

    // Mapear estado de TMDB a español
    const estadoMap: Record<string, string> = {
      "Returning Series": "En emisión",
      Ended: "Finalizada",
      Canceled: "Cancelada",
      "In Production": "En producción",
      Planned: "Planeada",
      Pilot: "Piloto",
    };

    const primerGenero = detalles.genres?.[0]?.name || "Desconocido";
    const todosGeneros = (detalles.genres || []).map((g: any) => g.name).join(", ");

    return {
      tmdb_id: detalles.id,
      titulo: detalles.name,
      titulo_original: detalles.original_name || detalles.name,
      anio: detalles.first_air_date ? detalles.first_air_date.split("-")[0] : "2024",
      genero: todosGeneros || primerGenero,
      sinopsis: detalles.overview || "Sin sinopsis disponible",
      caratula: detalles.poster_path
        ? `https://image.tmdb.org/t/p/original${detalles.poster_path}`
        : "",
      backdrop: detalles.backdrop_path
        ? `https://image.tmdb.org/t/p/original${detalles.backdrop_path}`
        : "",
      num_temporadas: numTemporadas,
      num_episodios: todosEpisodios.length,
      estado: estadoMap[detalles.status] || detalles.status || "Desconocido",
      episodios: todosEpisodios,
      fuente: "auto",
    };
  } catch (error) {
    console.error("Error en buscarSerieCompleta:", error);
    return null;
  }
}

// ========================================
// 8. OBTENER PELÍCULAS DE TMDB POR AÑO
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

// ========================================
// 9. OBTENER SERIES DE TMDB POR AÑO
// ========================================
export async function obtenerSeriesPorAnio(
  anio: number,
  maxPaginas: number = 3
): Promise<any[]> {
  const series: any[] = [];

  try {
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      const url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=es-ES&sort_by=popularity.desc&first_air_date_year=${anio}&page=${pagina}`;

      const res = await fetch(url);
      if (!res.ok) break;

      const data = await res.json();
      if (data.results) series.push(...data.results);

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error("Error obteniendo series:", error);
  }

  return series;
}
