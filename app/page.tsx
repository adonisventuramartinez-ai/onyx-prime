"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Film, User, Play, Plus, Check,
  X, Heart, Clock, Settings, LogOut, SlidersHorizontal,
} from "lucide-react";

const CARATULA_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23181818'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='%238a8a8a' text-anchor='middle' dy='.3em'%3ESin imagen%3C/text%3E%3C/svg%3E";

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

const CATEGORIAS = ["Inicio", "Series", "Telenovela", "Mi lista"];
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

export default function HomePage() {
  const router = useRouter();

  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const debouncedBusqueda = useDebounce(busqueda, 300);
  const [categoriaActiva, setCategoriaActiva] = useState("Inicio");
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
        const pelisRes = await fetch("/api/peliculas");
        if (pelisRes.ok) {
          const data = await pelisRes.json();
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

  const destacada = useMemo(
    () => peliculas.find((p) => p.destacada) ?? peliculas[0],
    [peliculas]
  );

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

    if (categoriaActiva === "Mi lista") {
      lista = lista.filter((p) => favoritoIds.has(p.id));
    } else if (categoriaActiva === "Series" || categoriaActiva === "Telenovela") {
      lista = lista.filter((p) => p.genero?.toLowerCase().includes(categoriaActiva.toLowerCase()));
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
  }, [peliculas, debouncedBusqueda, categoriaActiva, favoritoIds, filtroGenero, ordenarPor]);

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginaActual = Math.min(pagina, totalPaginas || 1);
  const peliculasPagina = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  if (errorCarga) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-nf-dark text-nf-cream">
        <div className="max-w-md">
          <p className="font-display text-xl font-semibold text-nf-red mb-2">No pudimos cargar el catálogo</p>
          <p className="text-nf-gray-light mb-6">{errorCarga}</p>
          <button
            onClick={reiniciarCarga}
            className="bg-nf-red hover:bg-nf-red-hover text-white font-semibold px-6 py-2 rounded-sm transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen text-nf-cream pb-16 bg-nf-dark">
      {/* ======================================== */}
      {/* NAV */}
      {/* ======================================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navScrolled ? "bg-nf-dark/95 backdrop-blur-md border-b border-white/10" : "bg-gradient-to-b from-black/70 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-10 py-4 gap-4">
          <div className="flex items-center gap-8">
            <span className="font-display italic text-2xl md:text-[28px] tracking-tight text-nf-cream select-none">
              Onyx<span className="text-nf-red not-italic">.</span>
            </span>
            <nav className="hidden md:flex gap-6 text-sm">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategoriaActiva(cat); setPagina(1); }}
                  className={`transition-colors hover:text-nf-cream ${
                    categoriaActiva === cat ? "text-nf-cream font-semibold" : "text-nf-gray"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                placeholder="Buscar en tu catálogo..."
                className="bg-black/40 border border-white/15 rounded-sm px-4 py-2 pl-9 text-sm w-40 md:w-64 focus:outline-none focus:border-nf-red transition-colors placeholder:text-nf-gray text-nf-cream"
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
                className="hidden md:flex items-center gap-1.5 border border-nf-red/50 text-nf-red hover:bg-nf-red hover:text-white px-3 py-2 rounded-sm text-xs font-semibold transition-colors"
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
                <div className="absolute right-0 mt-2 w-56 bg-nf-surface border border-white/10 rounded-sm shadow-2xl py-2 text-sm z-50">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="font-semibold text-nf-cream truncate">{emailUsuario || "Usuario"}</p>
                    <p className="text-xs text-nf-gray">Sala privada</p>
                  </div>
                  <Link href="/perfil" className="block px-4 py-2 hover:bg-white/5 text-nf-cream transition-colors flex items-center gap-2">
                    <User className="w-4 h-4" /> Mi perfil
                  </Link>
                  <Link href="/historial" className="block px-4 py-2 hover:bg-white/5 text-nf-cream transition-colors flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Historial
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

      {/* ======================================== */}
      {/* HERO — marquesina, no gradiente genérico */}
      {/* ======================================== */}
      {destacada && (
        <section className="relative pt-28 md:pt-36 pb-10 md:pb-14 px-4 md:px-10 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img
              src={destacada.caratula || CARATULA_FALLBACK}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-2xl scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-nf-dark/40 via-nf-dark to-nf-dark" />
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr,260px] gap-8 md:gap-14 items-end">
            <div className="fade-in order-2 md:order-1">
              <p className="text-nf-red text-xs font-semibold tracking-wide mb-3">En cartelera</p>
              <h1 className="font-display italic text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-4 text-nf-cream max-w-xl">
                {destacada.titulo}
              </h1>
              <div className="flex items-center gap-3 text-sm text-nf-gray-light mb-5">
                <span>{destacada.anio}</span>
                <span className="w-1 h-1 rounded-full bg-nf-gray" />
                <span>{destacada.genero}</span>
              </div>
              <p className="text-nf-gray-light leading-relaxed mb-7 max-w-lg line-clamp-3">
                {destacada.sinopsis || "Sin sinopsis disponible."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/ver/${destacada.id}`}
                  className="flex items-center gap-2 bg-nf-red hover:bg-nf-red-hover text-white px-7 py-3 rounded-sm font-semibold transition-colors"
                >
                  <Play className="w-4 h-4 fill-white" /> Reproducir
                </Link>
                <Link
                  href={`/pelicula/${destacada.id}`}
                  className="flex items-center gap-2 border border-white/20 hover:border-white/40 px-6 py-3 rounded-sm font-semibold transition-colors text-nf-cream"
                >
                  Ficha
                </Link>
                <button
                  onClick={() => toggleFavorito(destacada.id)}
                  className="flex items-center gap-2 border border-white/20 hover:border-white/40 px-6 py-3 rounded-sm font-semibold transition-colors text-nf-cream"
                >
                  {favoritoIds.has(destacada.id) ? (
                    <><Check className="w-4 h-4" /> En tu lista</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Mi lista</>
                  )}
                </button>
              </div>
            </div>

            <Link
              href={`/pelicula/${destacada.id}`}
              className="order-1 md:order-2 group relative aspect-[2/3] w-40 sm:w-56 md:w-full mx-auto md:mx-0 rounded-sm overflow-hidden border border-white/10 shadow-2xl"
              style={{ boxShadow: "0 20px 60px -20px rgba(225,29,46,0.3)" }}
            >
              <img
                src={destacada.caratula || CARATULA_FALLBACK}
                alt={destacada.titulo}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; }}
              />
            </Link>
          </div>
        </section>
      )}

      <div className="sprocket-rule text-nf-gray max-w-6xl mx-auto mb-8" />

      {/* ======================================== */}
      {/* CATÁLOGO */}
      {/* ======================================== */}
      <section className="max-w-6xl mx-auto px-4 md:px-10 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="font-display italic text-xl md:text-2xl text-nf-cream">
            {busqueda ? `Resultados para "${busqueda}"` : "Catálogo"}
            <span className="text-sm text-nf-gray ml-2 font-sans not-italic">
              ({filtradas.length})
            </span>
          </h2>

          <div className="relative">
            <button
              onClick={() => setFiltrosAbiertos((v) => !v)}
              className="flex items-center gap-2 border border-white/15 hover:border-white/30 px-3 py-1.5 rounded-sm text-sm text-nf-gray-light transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filtros
            </button>
            {filtrosAbiertos && (
              <div className="absolute right-0 mt-2 w-64 bg-nf-surface border border-white/10 rounded-sm shadow-2xl p-4 z-40 space-y-4">
                <div>
                  <p className="text-xs text-nf-gray mb-1.5">Género</p>
                  <select
                    value={filtroGenero}
                    onChange={(e) => { setFiltroGenero(e.target.value); setPagina(1); }}
                    className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-1.5 text-sm text-nf-cream focus:outline-none focus:border-nf-red"
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
                    className="w-full bg-black/40 border border-white/15 rounded-sm px-3 py-1.5 text-sm text-nf-cream focus:outline-none focus:border-nf-red"
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
                      className={`flex-1 text-sm py-1.5 rounded-sm transition-colors ${vistaGrid === "grid" ? "bg-nf-red text-white font-semibold" : "bg-black/40 text-nf-gray-light"}`}
                    >
                      Cuadrícula
                    </button>
                    <button
                      onClick={() => setVistaGrid("lista")}
                      className={`flex-1 text-sm py-1.5 rounded-sm transition-colors ${vistaGrid === "lista" ? "bg-nf-red text-white font-semibold" : "bg-black/40 text-nf-gray-light"}`}
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
            <p className="text-lg text-nf-gray-light">No hay resultados para &quot;{busqueda}&quot;</p>
          </div>
        ) : (
          <>
            {errorFavoritos && (
              <div className="bg-nf-garnet/15 border border-nf-garnet/40 rounded-sm p-3 mb-4 text-nf-garnet-hover text-sm flex items-center justify-between">
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
                  className="px-4 py-2 border border-white/15 hover:border-white/30 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Anterior
                </button>
                <span className="px-2 text-sm text-nf-gray">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-4 py-2 border border-white/15 hover:border-white/30 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-nf-dark/95 border-t border-white/10 flex justify-around py-2.5 z-40 backdrop-blur-md">
        {CATEGORIAS.map((item) => (
          <button
            key={item}
            onClick={() => { setCategoriaActiva(item); setPagina(1); }}
            className={`text-xs flex flex-col items-center gap-1 px-2 transition-colors ${
              categoriaActiva === item ? "text-nf-red" : "text-nf-gray"
            }`}
          >
            {item === "Inicio" && <Film className="w-5 h-5" />}
            {item === "Series" && <Film className="w-5 h-5" />}
            {item === "Telenovela" && <Film className="w-5 h-5" />}
            {item === "Mi lista" && <Heart className="w-5 h-5" />}
            <span>{item}</span>
          </button>
        ))}
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
    <div className="group relative">
      <Link href={`/ver/${pelicula.id}`}>
        <div className="relative aspect-[2/3] rounded-sm overflow-hidden bg-nf-surface border border-white/5 transition-all duration-300 group-hover:border-nf-red/60">
          {cargandoImg && <div className="absolute inset-0 bg-nf-surface animate-pulse" />}
          <img
            src={pelicula.caratula || CARATULA_FALLBACK}
            alt={pelicula.titulo}
            className={`w-full h-full object-cover transition-opacity duration-500 ${cargandoImg ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setCargandoImg(false)}
            onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; setCargandoImg(false); }}
          />
          {esNueva && (
            <span className="absolute top-2 left-2 bg-nf-red text-white text-[9px] font-bold px-2 py-0.5 rounded-sm z-10">
              NUEVO
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <span className="text-nf-cream text-xs font-medium flex items-center gap-1.5">
              <Play className="w-3 h-3 fill-nf-cream" /> Reproducir
            </span>
          </div>
        </div>
        <h4 className="mt-2 text-sm font-medium truncate text-nf-cream">{pelicula.titulo}</h4>
        <p className="text-xs text-nf-gray truncate">{pelicula.genero}</p>
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
      <div className="flex gap-4 bg-nf-surface/60 hover:bg-nf-surface rounded-sm p-3 transition-colors border border-white/5">
        <div className="w-16 h-24 flex-shrink-0 rounded-sm overflow-hidden bg-nf-surface">
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
