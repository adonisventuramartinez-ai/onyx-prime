"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Pelicula } from "@/lib/db";
import { CARATULA_FALLBACK } from "@/lib/db";

const CATEGORIAS = ["Inicio", "Telenovela", "Películas", "Series", "Mi lista"];

export default function HomePage() {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Inicio");
  const [navScrolled, setNavScrolled] = useState(false);
  const [misListaIds, setMisListaIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/peliculas")
      .then((res) => res.json())
      .then((data) => {
        setPeliculas(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch(() => setCargando(false));

    const guardado = localStorage.getItem("onyxflix-mi-lista");
    if (guardado) {
      setMisListaIds(new Set(JSON.parse(guardado)));
    }

    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMiLista = (id: string) => {
    setMisListaIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("onyxflix-mi-lista", JSON.stringify([...next]));
      return next;
    });
  };

  const destacada = peliculas.find((p) => p.destacada) ?? peliculas[0];

  const generos = useMemo(
    () => [...new Set(peliculas.map((p) => p.genero).filter(Boolean))],
    [peliculas]
  );

  const filtradas = useMemo(() => {
    let lista = peliculas;
    if (busqueda.trim()) {
      lista = lista.filter((p) =>
        p.titulo.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    if (categoriaActiva === "Mi lista") {
      lista = lista.filter((p) => misListaIds.has(p.id));
    } else if (categoriaActiva === "Series" || categoriaActiva === "Telenovela") {
      lista = lista.filter((p) =>
        p.genero?.toLowerCase().includes(categoriaActiva.toLowerCase())
      );
    }
    return lista;
  }, [peliculas, busqueda, categoriaActiva, misListaIds]);

  const recientes = [...peliculas]
    .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
    .slice(0, 12);

  return (
    <main className="min-h-screen bg-nf-dark">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          navScrolled ? "bg-nf-black" : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-12 py-4 gap-4">
          <div className="flex items-center gap-8">
            <span className="text-nf-red font-black text-2xl md:text-3xl tracking-tight select-none">
              ONYXFLIX
            </span>
            <nav className="hidden md:flex gap-5 text-sm text-gray-200">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActiva(cat)}
                  className={`transition-colors hover:text-white ${
                    categoriaActiva === cat
                      ? "text-white font-semibold"
                      : "text-nf-gray-light"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Títulos, personas, géneros"
                className="bg-black/70 border border-white/30 rounded px-3 py-1.5 text-sm w-36 md:w-64 focus:outline-none focus:border-white transition-all placeholder:text-nf-gray-light"
              />
            </div>
            <Link
              href="/admin"
              className="text-sm text-nf-gray-light hover:text-white transition-colors hidden sm:block"
            >
              Mío
            </Link>
          </div>
        </div>
      </header>

      {destacada && (
        <section className="relative h-[56vw] max-h-[85vh] min-h-[420px] w-full overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={destacada.caratula || CARATULA_FALLBACK}
              alt={destacada.titulo}
              onError={(e) => {
                (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
              }}
              className="w-full h-full object-cover hero-ken-burns"
            />
          </div>
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="absolute inset-0 bg-hero-fade-bottom" />

          <div className="relative h-full flex flex-col justify-end md:justify-center px-4 md:px-12 pb-24 md:pb-0 max-w-xl fade-in">
            <h1 className="text-3xl md:text-6xl font-black mb-3 drop-shadow-lg leading-tight">
              {destacada.titulo}
            </h1>
            <div className="flex items-center gap-3 text-sm md:text-base text-gray-200 mb-3">
              <span className="text-green-500 font-semibold">
                {destacada.fuente === "manual" ? "Añadida" : "Cinecalidad"}
              </span>
              <span>{destacada.anio}</span>
              <span className="border border-nf-gray-light px-1.5 text-xs rounded">
                {destacada.genero}
              </span>
            </div>
            <p className="hidden md:block text-gray-200 text-base leading-relaxed mb-6 line-clamp-3">
              {destacada.sinopsis}
            </p>
            <div className="flex gap-3">
              <Link
                href={`/ver/${destacada.id}`}
                className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded font-semibold hover:bg-white/80 transition-colors"
              >
                <PlayIcon /> Reproducir
              </Link>
              <button
                onClick={() => toggleMiLista(destacada.id)}
                className="flex items-center gap-2 bg-gray-500/40 text-white px-6 py-2.5 rounded font-semibold hover:bg-gray-500/60 transition-colors backdrop-blur-sm"
              >
                <InfoIcon />
                {misListaIds.has(destacada.id) ? "En mi lista" : "Mi lista"}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="relative z-10 -mt-10 md:-mt-24 px-4 md:px-12 pb-20 space-y-10">
        {cargando ? (
          <SkeletonRows />
        ) : peliculas.length === 0 ? (
          <EmptyState />
        ) : busqueda.trim() || categoriaActiva !== "Inicio" ? (
          <Fila titulo={`Resultados`} peliculas={filtradas} misListaIds={misListaIds} onToggle={toggleMiLista} />
        ) : (
          <>
            <Fila titulo="Agregadas recientemente" peliculas={recientes} misListaIds={misListaIds} onToggle={toggleMiLista} />
            {generos.map((genero) => (
              <Fila
                key={genero}
                titulo={genero}
                peliculas={peliculas.filter((p) => p.genero === genero)}
                misListaIds={misListaIds}
                onToggle={toggleMiLista}
              />
            ))}
          </>
        )}
      </section>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-nf-black border-t border-white/10 flex justify-around py-2 z-40">
        {["Inicio", "Géneros", "Mi lista", "Promoción", "Mío"].map((item) => (
          <Link
            key={item}
            href={item === "Mío" ? "/admin" : "#"}
            onClick={() => {
              if (item === "Inicio") setCategoriaActiva("Inicio");
              if (item === "Mi lista") setCategoriaActiva("Mi lista");
            }}
            className="text-xs text-nf-gray-light hover:text-white flex flex-col items-center gap-1 px-2"
          >
            {item}
          </Link>
        ))}
      </nav>
    </main>
  );
}

function Fila({
  titulo,
  peliculas,
  misListaIds,
  onToggle,
}: {
  titulo: string;
  peliculas: Pelicula[];
  misListaIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (peliculas.length === 0) return null;
  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold mb-3">{titulo}</h2>
      <div className="row-scroll flex gap-2 overflow-x-auto pb-4">
        {peliculas.map((p) => (
          <TarjetaPelicula key={p.id} pelicula={p} enLista={misListaIds.has(p.id)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

function TarjetaPelicula({
  pelicula,
  enLista,
  onToggle,
}: {
  pelicula: Pelicula;
  enLista: boolean;
  onToggle: (id: string) => void;
}) {
  const esNueva =
    new Date(pelicula.creado_en).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7;

  return (
    <div className="group relative flex-none w-[42vw] sm:w-[28vw] md:w-[19vw] lg:w-[15vw] transition-transform duration-300 hover:z-20 hover:scale-110">
      <Link href={`/ver/${pelicula.id}`}>
        <div className="relative rounded overflow-hidden aspect-[2/3] bg-neutral-800 shadow-lg">
          <img
            src={pelicula.caratula || CARATULA_FALLBACK}
            alt={pelicula.titulo}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
            }}
            className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-75"
          />
          {esNueva && (
            <span className="absolute top-1.5 left-1.5 bg-nf-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              NUEVO
            </span>
          )}
          <div className="absolute inset-0 bg-card-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
            <p className="text-xs font-semibold line-clamp-1">{pelicula.titulo}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-nf-gray-light">{pelicula.anio}</span>
              <span className="text-[10px] border border-white/40 px-1 rounded">{pelicula.genero}</span>
            </div>
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggle(pelicula.id);
        }}
        aria-label={enLista ? "Quitar de mi lista" : "Añadir a mi lista"}
        className="absolute top-1.5 right-1.5 bg-black/60 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
      >
        {enLista ? "✓" : "+"}
      </button>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-8 pt-10">
      {[1, 2, 3].map((row) => (
        <div key={row} className="space-y-3">
          <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex-none w-[19vw] aspect-[2/3] bg-white/10 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <p className="text-xl font-semibold">Tu catálogo está vacío</p>
      <p className="text-nf-gray-light max-w-sm">
        Agrega tu primera película desde el panel de administrador para verla aquí.
      </p>
      <Link
        href="/admin"
        className="mt-2 bg-nf-red hover:bg-nf-red-hover transition-colors px-6 py-2.5 rounded font-semibold"
      >
        Ir al panel admin
      </Link>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    </svg>
  );
}
