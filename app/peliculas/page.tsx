"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Film, User, Play, Plus, Check,
  X, Heart, Settings, LogOut, SlidersHorizontal,
} from "lucide-react";

const CARATULA_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23181818'/%3E%3Crect x='0' y='0' width='300' height='450' fill='none' stroke='%233a3a3a' stroke-width='2'/%3E%3Cg transform='translate(150,190)' fill='none' stroke='%23e11d2e' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='-35' y='-25' width='70' height='50' rx='4'/%3E%3Cpolygon points='12,-8 30,0 12,8' fill='%23e11d2e' stroke='none'/%3E%3C/g%3E%3Ctext x='50%25' y='265' font-family='Arial' font-size='18' font-weight='bold' letter-spacing='1' fill='%238a8a8a' text-anchor='middle'%3ESIN IMAGEN%3C/text%3E%3C/svg%3E";

type Pelicula = {
  id: string;
  titulo: string;
  anio: number | string;
  genero: string;
  sinopsis: string;
  caratula: string;
  link_directo: string;
  fuente: "manual" | "auto";
  destacada?: boolean;
  creado_en: string;
};

const GENEROS_POPULARES = ["Acción", "Comedia", "Drama", "Terror", "Ciencia Ficción", "Romance", "Animación"];
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

export default function PeliculasPage() {
  const router = useRouter();

  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const debouncedBusqueda = useDebounce(busqueda, 300);
  const [navScrolled, setNavScrolled] = useState(false);
  const [favoritoIds, setFavoritoIds] = useState<Set<string>>(new Set());
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [emailUsuario, setEmailUsuario] = useState<string | null>(null);
  const [vistaGrid, setVistaGrid] = useState<VistaGrid>("grid");
  const [ordenarPor, setOrdenarPor] = useState<OrdenPor>("reciente");
  const [filtroGenero, setFiltroGenero] = useState<string>("todos");
  const [pagina, setPagina] = useState(1);
  const [errorFavoritos, setErrorFavoritos] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vistaGuardada = localStorage.getItem("vista_onyx") as VistaGrid | null;
    if (vistaGuardada) setVistaGrid(vistaGuardada);
    const ordenGuardado = localStorage.getItem("orden_onyx") as OrdenPor | null;
    if (ordenGuardado) setOrdenarPor(ordenGuardado);
  }, []);

  useEffect(() => { localStorage.setItem("vista_onyx", vistaGrid); }, [vistaGrid]);
  useEffect(() => { localStorage.setItem("orden_onyx", ordenarPor); }, [ordenarPor]);

  useEffect(() => {
    let mounted = true;

    const cargarDatos = async () => {
      setErrorCarga(null);
      try {
        const res = await fetch("/api/peliculas");
        if (res.ok) {
          const data = await res.json();
          const pelis = data.peliculas || data || [];
          if (mounted) setPeliculas(pelis);
        } else {
          if (mounted) setErrorCarga("Error al cargar las películas");
        }
      } catch (error) {
        if (mounted) setErrorCarga("Error de conexión al cargar películas");
      } finally {
        if (mounted) setCargando(false);
      }
    };

    const cargarFavoritos = async () => {
      try {
        const favRes = await fetch("/api/favoritos");
        if (favRes.ok) {
          const ids = await favRes.json();
          if (mounted) setFavoritoIds(new Set(ids));
        }
      } catch (error) {
        if (mounted) setErrorFavoritos("Error de conexión al cargar favoritos");
      }
    };

    const verificarAdmin = async () => {
      try {
        const adminRes = await fetch("/api/admin/check");
        if (adminRes.ok) {
          const data = await adminRes.json();
          if (mounted) {
            setEsAdmin(Boolean(data.isAdmin));
            setEmailUsuario(data.email || null);
          }
        }
      } catch (error) {
        if (mounted) setEsAdmin(false);
      }
    };

    cargarDatos();
    cargarFavoritos();
    verificarAdmin();

    const onScroll = () => { if (mounted) setNavScrolled(window.scrollY > 40); };
    window.addEventListener("scroll", onScroll);

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (mounted) setMenuAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      mounted = false;
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const cerrarSesion = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {}
  };

  const toggleFavorito = useCallback(async (id: string) => {
    const yaEsta = favoritoIds.has(id);
    const nuevoSet = new Set(favoritoIds);
    yaEsta ? nuevoSet.delete(id) : nuevoSet.add(id);
    setFavoritoIds(nuevoSet);
    setErrorFavoritos(null);

    try {
      const res = yaEsta
        ? await fetch(`/api/favoritos?pelicula_id=${id}`, { method: "DELETE" })
        : await fetch("/api/favoritos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pelicula_id: id }),
          });

      if (!res.ok) {
        const rollbackSet = new Set(favoritoIds);
        yaEsta ? rollbackSet.add(id) : rollbackSet.delete(id);
        setFavoritoIds(rollbackSet);
        setErrorFavoritos("Error al guardar el favorito");
      }
    } catch (error) {
      const rollbackSet = new Set(favoritoIds);
      yaEsta ? rollbackSet.add(id) : rollbackSet.delete(id);
      setFavoritoIds(rollbackSet);
      setErrorFavoritos("Error de conexión al guardar favorito");
    }
  }, [favoritoIds]);

  const reiniciarCarga = () => {
    setErrorCarga(null);
    setCargando(true);
    window.location.reload();
  };

  const generos = useMemo(
    () => [...new Set(peliculas.map((p) => p.genero).filter(Boolean))],
    [peliculas]
  );

  const filtradas = useMemo(() => {
    let lista = [...peliculas];

    if (debouncedBusqueda.trim()) {
      lista = lista.filter((p) =>
        p.titulo?.toLowerCase().includes(debouncedBusqueda.toLowerCase())
      );
    }

    if (filtroGenero !== "todos") {
      lista = lista.filter((p) => p.genero === filtroGenero);
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
  }, [peliculas, debouncedBusqueda, filtroGenero, ordenarPor]);

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginaActual = Math.min(pagina, totalPaginas || 1);
  const peliculasPagina = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  if (errorCarga) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-nf-dark text-nf-cream">
        <div className="max-w-md">
          <p className="font-display text-xl font-semibold text-nf-red mb-2">
            No pudimos cargar el catálogo
          </p>
          <p className="text-nf-gray-light mb-6">{errorCarga}</p>
          <button
            onClick={reiniciarCarga}
            className="bg-nf-red hover:bg-nf-red-hover text-white font-semibold px-6 py-2 rounded transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen text-nf-cream pb-16 bg-nf-dark">
      {/* NAV */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-nf-dark/95 backdrop-blur-md border-b border-white/10"
            : "bg-gradient-to-b from-black/70 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-10 py-4 gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-display text-2xl md:text-[28px] tracking-tight text-nf-cream select-none">
              Onyx<span className="text-nf-red not-italic">.</span>
            </Link>
            <nav className="hidden md:flex gap-6 text-sm">
              <Link
                href="/"
                className="transition-colors hover:text-nf-cream uppercase text-[13px] tracking-wide font-extrabold text-nf-gray"
              >
                Inicio
              </Link>
              <Link
                href="/peliculas"
                className="transition-colors hover:text-nf-cream uppercase text-[13px] tracking-wide font-extrabold text-white"
              >
                Películas
              </Link>
              <Link
                href="/series"
                className="transition-colors hover:text-nf-cream uppercase text-[13px] tracking-wide font-extrabold text-nf-gray"
              >
                Series
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                placeholder="Buscar películas..."
                className="bg-black/40 border border-white/15 rounded px-4 py-2 pl-9 text-sm w-40 md:w-64 focus:outline-none focus:border-nf-red transition-colors placeholder:text-nf-gray text-nf-cream"
                aria-label="Buscar películas"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-nf-gray" />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 top-2.5 text-nf-gray hover:text-nf-cream"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {esAdmin && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 border border-nf-red/50 text-nf-red hover:bg-nf-red hover:text-white px-3 py-2 rounded text-xs font-extrabold uppercase tracking-wide text-[13px] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" /> Panel
              </Link>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuAbierto((v) => !v)}
                className="w-8 h-8 rounded-full bg-nf-red flex items-center justify-center font-semibold text-sm text-white hover:bg-nf-red-hover transition-colors"
                aria-label="Menú de usuario"
              >
                {emailUsuario ? emailUsuario[0].toUpperCase() : "U"}
              </button>
              {menuAbierto && (
                <div className="absolute right-0 mt-2 w-56 bg-nf-surface border border-white/10 rounded shadow-2xl py-2 text-sm z-50">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="font-semibold text-nf-cream truncate">{emailUsuario || "Usuario"}</p>
                    <p className="text-xs text-nf-gray">Sala privada</p>
                  </div>
                  <Link href="/perfil" className="block px-4 py-2 hover:bg-white/5 text-nf-cream transition-colors flex items-center gap-2">
                    <User className="w-4 h-4" /> Mi perfil
                  </Link>
                  <Link href="/historial" className="block px-4 py-2 hover:bg-white/5 text-nf-cream transition-colors flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Historial
                  </Link>
                  {esAdmin && (
                    <>
                      <div className="border-t border-white/10 my-1" />
                      <Link href="/admin" className="block px-4 py-2 hover:bg-white/5 text-nf-red transition-colors flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Panel admin
                      </Link>
                    </>
                  )}
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={cerrarSesion}
                    className="block w-full text-left px-4 py-2 hover:bg-white/5 text-nf-garnet-hover transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CATÁLOGO */}
      <section className="max-w-6xl mx-auto px-4 md:px-10 pt-28 md:pt-32 pb-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-white mb-2">
            Películas<span className="text-nf-red">.</span>
          </h1>
          <p className="text-nf-gray-light text-sm">
            {peliculas.length} películas en tu catálogo
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="font-display text-xl md:text-2xl text-nf-cream">
            {busqueda ? `Resultados para "${busqueda}"` : "Todas las películas"}
            <span className="text-sm text-nf-gray ml-2 font-sans not-italic">
              ({filtradas.length})
            </span>
          </h2>

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
                    {GENEROS_POPULARES.map((g) => <option key={g} value={g}>{g}</option>)}
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

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-nf-red border-t-transparent" />
          </div>
        ) : peliculas.length === 0 ? (
          <div className="text-center py-20 text-nf-gray">
            <Film className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2 text-nf-gray-light">Tu catálogo está vacío</p>
            <Link href="/admin" className="text-nf-red hover:underline text-sm">
              Agrega tu primera película
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
            {errorFavoritos && (
              <div className="bg-nf-garnet/15 border border-nf-garnet/40 rounded p-3 mb-4 text-nf-garnet-hover text-sm flex items-center justify-between">
                <span>{errorFavoritos}</span>
                <button onClick={() => setErrorFavoritos(null)} className="hover:text-nf-cream">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {vistaGrid === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                {peliculasPagina.map((p) => (
                  <TarjetaPelicula key={p.id} pelicula={p} enLista={favoritoIds.has(p.id)} onToggle={toggleFavorito} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {peliculasPagina.map((p) => (
                  <TarjetaPeliculaLista key={p.id} pelicula={p} enLista={favoritoIds.has(p.id)} onToggle={toggleFavorito} />
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

      {/* NAV MÓVIL */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-nf-dark/95 border-t border-white/10 flex justify-around py-2.5 z-40 backdrop-blur-md">
        <Link
          href="/"
          className="text-xs flex flex-col items-center gap-1 px-2 text-nf-gray"
        >
          <Film className="w-5 h-5" />
          <span>Inicio</span>
        </Link>
        <Link
          href="/peliculas"
          className="text-xs flex flex-col items-center gap-1 px-2 text-nf-red"
        >
          <Film className="w-5 h-5" />
          <span>Películas</span>
        </Link>
        <Link
          href="/series"
          className="text-xs flex flex-col items-center gap-1 px-2 text-nf-gray"
        >
          <Film className="w-5 h-5" />
          <span>Series</span>
        </Link>
      </nav>
    </main>
  );
}

function TarjetaPelicula({
  pelicula, enLista, onToggle,
}: { pelicula: Pelicula; enLista: boolean; onToggle: (id: string) => void }) {
  const [cargandoImg, setCargandoImg] = useState(true);
  const esNueva = new Date(pelicula.creado_en).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7;

  return (
    <div className="group relative card-brutal">
      <Link href={`/ver/${pelicula.id}`}>
        <div className="relative aspect-[2/3] rounded overflow-hidden bg-nf-surface border border-white/5 transition-all duration-300 group-hover:border-nf-red">
          {cargandoImg && <div className="absolute inset-0 bg-nf-surface animate-pulse" />}
          <img
            src={pelicula.caratula || CARATULA_FALLBACK}
            alt={pelicula.titulo}
            className={`w-full h-full object-cover transition-opacity duration-500 ${cargandoImg ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setCargandoImg(false)}
            onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; setCargandoImg(false); }}
          />
          {esNueva && (
            <span className="absolute top-2 left-2 bg-nf-red text-white chip-brutal px-2 py-0.5 rounded z-10">
              Nuevo
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <span className="text-white text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
              <Play className="w-3 h-3 fill-white" /> Reproducir
            </span>
          </div>
        </div>
        <h4 className="mt-2 text-sm font-bold truncate text-white">{pelicula.titulo}</h4>
        <p className="text-xs text-nf-gray chip-brutal truncate">{pelicula.genero}</p>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(pelicula.id); }}
        className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black text-nf-cream text-xs z-20"
        aria-label={enLista ? "Quitar de mi lista" : "Añadir a mi lista"}
      >
        {enLista ? <Check className="w-4 h-4 text-nf-red" /> : <Plus className="w-4 h-4" />}
      </button>
    </div>
  );
}

function TarjetaPeliculaLista({
  pelicula, enLista, onToggle,
}: { pelicula: Pelicula; enLista: boolean; onToggle: (id: string) => void }) {
  return (
    <Link href={`/ver/${pelicula.id}`}>
      <div className="flex gap-4 bg-nf-surface/60 hover:bg-nf-surface rounded p-3 transition-colors border border-white/5">
        <div className="w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-nf-surface">
          <img
            src={pelicula.caratula || CARATULA_FALLBACK}
            alt={pelicula.titulo}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; }}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="font-semibold text-nf-cream truncate">{pelicula.titulo}</h4>
          <div className="flex items-center gap-2 text-xs text-nf-gray">
            <span>{pelicula.anio}</span>
            <span>·</span>
            <span>{pelicula.genero}</span>
          </div>
          <p className="text-sm text-nf-gray line-clamp-1 mt-1">{pelicula.sinopsis}</p>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(pelicula.id); }}
          className={`self-center p-2 rounded-full transition-colors ${
            enLista ? "bg-nf-red/20 text-nf-red" : "bg-white/5 text-nf-cream"
          } hover:bg-nf-red/30`}
          aria-label={enLista ? "Quitar de mi lista" : "Añadir a mi lista"}
        >
          {enLista ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>
    </Link>
  );
}
