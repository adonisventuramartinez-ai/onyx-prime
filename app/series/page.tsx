"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Tv, Play, X, SlidersHorizontal, Clock } from "lucide-react";

const CARATULA_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23181818'/%3E%3Crect x='0' y='0' width='300' height='450' fill='none' stroke='%233a3a3a' stroke-width='2'/%3E%3Ctext x='50%25' y='225' font-family='Arial' font-size='18' font-weight='bold' letter-spacing='1' fill='%238a8a8a' text-anchor='middle'%3ESIN IMAGEN%3C/text%3E%3C/svg%3E";

type Serie = {
  id: string;
  tmdb_id: number | null;
  titulo: string;
  titulo_original: string;
  anio: number | string;
  genero: string;
  sinopsis: string;
  caratula: string;
  backdrop: string;
  num_temporadas: number;
  num_episodios: number;
  estado: string;
  creado_en: string;
};

const GENEROS_POPULARES = [
  "Acción", "Comedia", "Drama", "Terror", "Ciencia Ficción",
  "Romance", "Animación", "Misterio", "Crimen", "Suspense",
];
const POR_PAGINA = 20;

type OrdenPor = "reciente" | "titulo" | "anio";
type VistaGrid = "grid" | "lista";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const debouncedBusqueda = useDebounce(busqueda, 300);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [vistaGrid, setVistaGrid] = useState<VistaGrid>("grid");
  const [ordenarPor, setOrdenarPor] = useState<OrdenPor>("reciente");
  const [filtroGenero, setFiltroGenero] = useState<string>("todos");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    let mounted = true;

    const cargarSeries = async () => {
      setErrorCarga(null);
      try {
        const res = await fetch("/api/series");
        if (res.ok) {
          const data = await res.json();
          const lista = data.series || data || [];
          if (mounted) setSeries(lista);
        } else {
          if (mounted) setErrorCarga("Error al cargar las series");
        }
      } catch (error) {
        if (mounted) setErrorCarga("Error de conexión al cargar series");
      } finally {
        if (mounted) setCargando(false);
      }
    };

    cargarSeries();
    return () => { mounted = false; };
  }, []);

  const generos = useMemo(
    () => [...new Set(series.map((s) => s.genero).filter(Boolean))],
    [series]
  );

  const filtradas = useMemo(() => {
    let lista = [...series];

    if (debouncedBusqueda.trim()) {
      lista = lista.filter((s) =>
        s.titulo?.toLowerCase().includes(debouncedBusqueda.toLowerCase())
      );
    }

    if (filtroGenero !== "todos") {
      lista = lista.filter((s) => s.genero === filtroGenero);
    }

    if (ordenarPor === "titulo") {
      lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (ordenarPor === "anio") {
      lista.sort((a, b) => Number(b.anio) - Number(a.anio));
    } else {
      lista.sort((a, b) => {
        const dateA = a.creado_en ? new Date(a.creado_en).getTime() : 0;
        const dateB = b.creado_en ? new Date(b.creado_en).getTime() : 0;
        return dateB - dateA;
      });
    }

    return lista;
  }, [series, debouncedBusqueda, filtroGenero, ordenarPor]);

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginaActual = Math.min(pagina, totalPaginas || 1);
  const seriesPagina = filtradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  return (
    <main className="min-h-screen text-nf-cream pb-16 bg-nf-dark pt-24 md:pt-28">
      <section className="max-w-6xl mx-auto px-4 md:px-10 pb-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-white mb-2">
            Series<span className="text-nf-red">.</span>
          </h1>
          <p className="text-nf-gray-light text-sm">
            {series.length} series en tu catálogo
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              placeholder="Buscar series..."
              className="w-full bg-black/40 border border-white/15 rounded px-4 py-2 pl-9 text-sm focus:outline-none focus:border-nf-red transition-colors placeholder:text-nf-gray text-nf-cream"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-nf-gray" />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-2.5 text-nf-gray hover:text-nf-cream"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setFiltrosAbiertos((v) => !v)}
              className="flex items-center gap-2 border border-white/15 hover:border-white/30 px-3 py-1.5 rounded text-sm text-nf-gray-light transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filtros
            </button>
            {filtrosAbiertos && (
              <div className="absolute right-0 mt-2 w-64 bg-nf-surface border border-white/10 rounded shadow-2xl p-4 z-40 space-y-4">
                <div>
                  <p className="text-xs text-nf-gray mb-1.5">Género</p>
                  <select
                    value={filtroGenero}
                    onChange={(e) => { setFiltroGenero(e.target.value); setPagina(1); }}
                    className="w-full bg-black/40 border border-white/15 rounded px-3 py-1.5 text-sm text-nf-cream focus:outline-none focus:border-nf-red"
                  >
                    <option value="todos">Todos</option>
                    {GENEROS_POPULARES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                    {generos.filter((g) => !GENEROS_POPULARES.includes(g)).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-nf-gray mb-1.5">Ordenar por</p>
                  <select
                    value={ordenarPor}
                    onChange={(e) => { setOrdenarPor(e.target.value as OrdenPor); setPagina(1); }}
                    className="w-full bg-black/40 border border-white/15 rounded px-3 py-1.5 text-sm text-nf-cream focus:outline-none focus:border-nf-red"
                  >
                    <option value="reciente">Más reciente</option>
                    <option value="titulo">Título (A-Z)</option>
                    <option value="anio">Año (nuevo-viejo)</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-nf-gray mb-1.5">Vista</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVistaGrid("grid")}
                      className={`flex-1 text-sm py-1.5 rounded transition-colors ${vistaGrid === "grid" ? "bg-nf-red text-white font-semibold" : "bg-black/40 text-nf-gray-light"}`}
                    >
                      Cuadrícula
                    </button>
                    <button
                      onClick={() => setVistaGrid("lista")}
                      className={`flex-1 text-sm py-1.5 rounded transition-colors ${vistaGrid === "lista" ? "bg-nf-red text-white font-semibold" : "bg-black/40 text-nf-gray-light"}`}
                    >
                      Lista
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {errorCarga && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-6 text-red-400 text-sm">
            {errorCarga}
          </div>
        )}

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-nf-red border-t-transparent" />
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-20 text-nf-gray">
            <Tv className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2 text-nf-gray-light">Aún no hay series</p>
            <Link href="/admin" className="text-nf-red hover:underline text-sm">
              Agrega tu primera serie
            </Link>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20 text-nf-gray">
            <p className="text-lg text-nf-gray-light">
              No hay resultados para &quot;{busqueda}&quot;
            </p>
          </div>
        ) : (
          <>
            {vistaGrid === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                {seriesPagina.map((s) => (
                  <TarjetaSerie key={s.id} serie={s} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {seriesPagina.map((s) => (
                  <TarjetaSerieLista key={s.id} serie={s} />
                ))}
              </div>
            )}

            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-4 py-2 border border-white/15 hover:border-white/30 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Anterior
                </button>
                <span className="px-2 text-sm text-nf-gray">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-4 py-2 border border-white/15 hover:border-white/30 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function TarjetaSerie({ serie }: { serie: Serie }) {
  const [cargandoImg, setCargandoImg] = useState(true);

  return (
    <Link href={`/serie/${serie.id}`} className="group relative card-brutal">
      <div className="relative aspect-[2/3] rounded overflow-hidden bg-nf-surface border border-white/5 transition-all duration-300 group-hover:border-nf-red">
        {cargandoImg && <div className="absolute inset-0 bg-nf-surface animate-pulse" />}
        <img
          src={serie.caratula || CARATULA_FALLBACK}
          alt={serie.titulo}
          className={`w-full h-full object-cover transition-opacity duration-500 ${cargandoImg ? "opacity-0" : "opacity-100"}`}
          onLoad={() => setCargandoImg(false)}
          onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; setCargandoImg(false); }}
        />
        <span className="absolute top-2 left-2 bg-nf-red text-white chip-brutal px-2 py-0.5 rounded z-10 text-[10px] font-extrabold uppercase tracking-wide">
          Serie
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <span className="text-white text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
            <Play className="w-3 h-3 fill-white" /> Ver episodios
          </span>
        </div>
      </div>
      <h4 className="mt-2 text-sm font-bold truncate text-white">{serie.titulo}</h4>
      <p className="text-xs text-nf-gray chip-brutal truncate">
        {serie.num_temporadas} temp · {serie.genero}
      </p>
    </Link>
  );
}

function TarjetaSerieLista({ serie }: { serie: Serie }) {
  return (
    <Link href={`/serie/${serie.id}`}>
      <div className="flex gap-4 bg-nf-surface/60 hover:bg-nf-surface rounded p-3 transition-colors border border-white/5">
        <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-nf-surface">
          <img
            src={serie.caratula || CARATULA_FALLBACK}
            alt={serie.titulo}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; }}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="font-semibold text-nf-cream truncate">{serie.titulo}</h4>
          <div className="flex items-center gap-2 text-xs text-nf-gray">
            <span>{serie.anio}</span>
            <span>·</span>
            <span>{serie.num_temporadas} temporadas</span>
            <span>·</span>
            <span>{serie.genero}</span>
          </div>
          <p className="text-sm text-nf-gray line-clamp-1 mt-1">{serie.sinopsis}</p>
        </div>
        <div className="self-center text-nf-gray">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
