"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Home, Film, List, Star, User, Play, Plus, Check,
  X, Heart, Eye, Clock, Settings, LogOut
} from "lucide-react";

const CARATULA_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23222222'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='%23808080' text-anchor='middle' dy='.3em'%3ESin imagen%3C/text%3E%3C/svg%3E";

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
  rating?: string;
  duracion?: string;
};

const CATEGORIAS = ["Inicio", "Telenovela", "Películas", "Series", "Mi lista"];
const GENEROS_POPULARES = ["Acción", "Comedia", "Drama", "Terror", "Ciencia Ficción", "Romance", "Animación"];
const POR_PAGINA = 20;

type OrdenPor = "reciente" | "titulo" | "anio" | "popular";
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

  // Estado
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const debouncedBusqueda = useDebounce(busqueda, 300);
  const [categoriaActiva, setCategoriaActiva] = useState("Inicio");
  const [navScrolled, setNavScrolled] = useState(false);
  const [favoritoIds, setFavoritoIds] = useState<Set<string>>(new Set());
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [emailUsuario, setEmailUsuario] = useState<string | null>(null);
  const [modoOscuro, setModoOscuro] = useState(false);
  const [vistaGrid, setVistaGrid] = useState<VistaGrid>("grid");
  const [ordenarPor, setOrdenarPor] = useState<OrdenPor>("reciente");
  const [filtroGenero, setFiltroGenero] = useState<string>("todos");
  const [pagina, setPagina] = useState(1);
  const [cargandoFavoritos, setCargandoFavoritos] = useState(false);
  const [errorFavoritos, setErrorFavoritos] = useState<string | null>(null);

  // Ref para el menú
  const menuRef = useRef<HTMLDivElement>(null);

  // Cargar preferencias guardadas
  useEffect(() => {
    const modoGuardado = localStorage.getItem("modo_oscuro_onyx");
    if (modoGuardado !== null) setModoOscuro(modoGuardado === "true");
    
    const vistaGuardada = localStorage.getItem("vista_onyx") as VistaGrid | null;
    if (vistaGuardada) setVistaGrid(vistaGuardada);
    
    const ordenGuardado = localStorage.getItem("orden_onyx") as OrdenPor | null;
    if (ordenGuardado) setOrdenarPor(ordenGuardado);
  }, []);

  // Guardar preferencias
  useEffect(() => {
    localStorage.setItem("modo_oscuro_onyx", String(modoOscuro));
  }, [modoOscuro]);

  useEffect(() => {
    localStorage.setItem("vista_onyx", vistaGrid);
  }, [vistaGrid]);

  useEffect(() => {
    localStorage.setItem("orden_onyx", ordenarPor);
  }, [ordenarPor]);

  // Cargar datos
  useEffect(() => {
    let mounted = true;

    const cargarDatos = async () => {
      setErrorCarga(null);
      
      try {
        const pelisRes = await fetch("/api/peliculas");
        if (pelisRes.ok) {
          const data = await pelisRes.json();
          const pelis = data.peliculas || data || [];
          const pelisConDatos = pelis.map((p: Pelicula) => ({
            ...p,
            rating: (Math.random() * 3 + 6.5).toFixed(1),
            duracion: `${Math.floor(Math.random() * 60 + 90)} min`,
          }));
          if (mounted) setPeliculas(pelisConDatos);
        } else {
          if (mounted) setErrorCarga("Error al cargar las películas");
        }
      } catch (error) {
        if (mounted) setErrorCarga("Error de conexión al cargar películas");
        console.error("❌ Error al cargar:", error);
      } finally {
        if (mounted) setCargando(false);
      }
    };

    const cargarFavoritos = async () => {
      setCargandoFavoritos(true);
      setErrorFavoritos(null);
      try {
        const favRes = await fetch("/api/favoritos");
        if (favRes.ok) {
          const ids = await favRes.json();
          if (mounted) setFavoritoIds(new Set(ids));
        } else {
          if (mounted) setErrorFavoritos("Error al cargar favoritos");
        }
      } catch (error) {
        if (mounted) setErrorFavoritos("Error de conexión al cargar favoritos");
        console.error("❌ Error al cargar favoritos:", error);
      } finally {
        if (mounted) setCargandoFavoritos(false);
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
        console.error("❌ Error al verificar admin:", error);
      }
    };

    cargarDatos();
    cargarFavoritos();
    verificarAdmin();

    const onScroll = () => {
      if (mounted) setNavScrolled(window.scrollY > 40);
    };
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
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  };

  const toggleFavorito = useCallback(async (id: string) => {
    const yaEsta = favoritoIds.has(id);
    const nuevoSet = new Set(favoritoIds);
    yaEsta ? nuevoSet.delete(id) : nuevoSet.add(id);
    setFavoritoIds(nuevoSet);
    setErrorFavoritos(null);

    try {
      let res;
      if (yaEsta) {
        res = await fetch(`/api/favoritos?pelicula_id=${id}`, { method: "DELETE" });
      } else {
        res = await fetch("/api/favoritos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pelicula_id: id }),
        });
      }
      
      if (!res.ok) {
        // Rollback en caso de error
        const rollbackSet = new Set(favoritoIds);
        yaEsta ? rollbackSet.add(id) : rollbackSet.delete(id);
        setFavoritoIds(rollbackSet);
        setErrorFavoritos("Error al guardar el favorito");
        console.error("❌ Error en toggle favorito");
      }
    } catch (error) {
      const rollbackSet = new Set(favoritoIds);
      yaEsta ? rollbackSet.add(id) : rollbackSet.delete(id);
      setFavoritoIds(rollbackSet);
      setErrorFavoritos("Error de conexión al guardar favorito");
      console.error("❌ Error al toggle favorito:", error);
    }
  }, [favoritoIds]);

  const toggleModoOscuro = () => setModoOscuro((prev) => !prev);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setMenuAbierto(false);
  };

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
      lista = lista.filter((p) =>
        p.genero?.toLowerCase().includes(categoriaActiva.toLowerCase())
      );
    }

    if (filtroGenero !== "todos") {
      lista = lista.filter((p) => p.genero === filtroGenero);
    }

    if (ordenarPor === "titulo") {
      lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (ordenarPor === "anio") {
      lista.sort((a, b) => Number(b.anio) - Number(a.anio));
    } else if (ordenarPor === "popular") {
      lista.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
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

  const theme = modoOscuro
    ? { bg: "#0a0a0a", cardBg: "#141414", border: "#2a2a2a", text: "#e0e0e0", subtext: "#888" }
    : { bg: "#141414", cardBg: "#1a1a1a", border: "#333", text: "#ffffff", subtext: "#888" };

  if (errorCarga) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4" style={{ background: theme.bg, color: theme.text }}>
        <div className="max-w-md">
          <p className="text-xl font-semibold text-[#E50914] mb-2">⚠️ Error al cargar</p>
          <p className="text-gray-400 mb-6">{errorCarga}</p>
          <button
            onClick={reiniciarCarga}
            className="bg-[#E50914] hover:bg-[#b20710] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen text-white pb-20" style={{ background: theme.bg }}>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-black/95 backdrop-blur-md shadow-lg"
            : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-12 py-4 gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-[#E50914] font-black text-2xl md:text-3xl tracking-tight select-none">
                ONYXFLIX
              </span>
              <span className="text-[10px] bg-[#E50914]/20 text-[#E50914] px-2 py-0.5 rounded-full font-semibold">
                PRO
              </span>
            </div>
            <nav className="hidden md:flex gap-5 text-sm text-gray-200">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoriaActiva(cat);
                    setPagina(1);
                  }}
                  className={`transition-colors hover:text-white ${
                    categoriaActiva === cat ? "text-white font-semibold" : "text-gray-400"
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
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar películas..."
                className="bg-black/60 border border-white/20 rounded-full px-4 py-2 pl-10 text-sm w-40 md:w-64 focus:outline-none focus:border-[#E50914] transition-all placeholder:text-gray-500 text-white"
                aria-label="Buscar películas"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={toggleModoOscuro}
              className="hidden md:flex w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
              title="Modo oscuro"
              aria-label="Cambiar tema"
            >
              {modoOscuro ? "☀️" : "🌙"}
            </button>

            <button
              onClick={() => setVistaGrid(vistaGrid === "grid" ? "lista" : "grid")}
              className="hidden md:flex w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors text-xs"
              title="Cambiar vista"
              aria-label="Cambiar vista"
            >
              {vistaGrid === "grid" ? "⊞" : "≡"}
            </button>

            <Link
              href="/admin"
              className={`hidden md:flex items-center gap-1 ${
                esAdmin ? "bg-[#E50914] hover:bg-[#b20710]" : "bg-gray-800 hover:bg-gray-700"
              } px-3 py-2 rounded-full text-xs transition-colors`}
            >
              <User className="w-4 h-4" />
              {esAdmin ? "Admin" : "Login"}
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuAbierto((v) => !v)}
                onKeyDown={handleKeyDown}
                className="w-8 h-8 rounded-full bg-[#E50914] flex items-center justify-center font-bold text-sm text-white hover:bg-[#b20710] transition-colors"
                aria-label="Menú de usuario"
              >
                {emailUsuario ? emailUsuario[0].toUpperCase() : "U"}
              </button>
              {menuAbierto && (
                <div className="absolute right-0 mt-2 w-56 bg-black/95 border border-white/10 rounded-lg shadow-2xl py-2 text-sm z-50 backdrop-blur-md">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="font-semibold text-white">{emailUsuario || "Usuario"}</p>
                    <p className="text-xs text-gray-500">Miembro PRO</p>
                  </div>
                  <Link href="/perfil" className="block px-4 py-2 hover:bg-white/10 text-white transition-colors flex items-center gap-2">
                    <User className="w-4 h-4" /> Mi perfil
                  </Link>
                  <Link href="/favoritos" className="block px-4 py-2 hover:bg-white/10 text-white transition-colors flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Mis favoritos
                  </Link>
                  <Link href="/historial" className="block px-4 py-2 hover:bg-white/10 text-white transition-colors flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Historial
                  </Link>
                  {esAdmin && (
                    <>
                      <div className="border-t border-white/10 my-1" />
                      <Link href="/admin" className="block px-4 py-2 hover:bg-white/10 text-[#E50914] transition-colors flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Panel admin
                      </Link>
                    </>
                  )}
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={cerrarSesion}
                    className="block w-full text-left px-4 py-2 hover:bg-white/10 text-[#E50914] transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {destacada && (
        <section className="relative h-[70vh] min-h-[420px] max-h-[600px] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={destacada.caratula || CARATULA_FALLBACK}
              alt={destacada.titulo}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

          <div className="relative h-full flex flex-col justify-end px-4 md:px-12 pb-16 md:pb-12 max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#E50914] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Destacada
              </span>
              {destacada.rating && (
                <span className="flex items-center gap-1 text-yellow-400 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400" /> {destacada.rating}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-3 drop-shadow-lg leading-tight">
              {destacada.titulo}
            </h1>
            <div className="flex items-center gap-3 text-sm md:text-base text-gray-300 mb-3 flex-wrap">
              <span className="text-green-400 font-semibold">
                {destacada.fuente === "manual" ? "✦ Añadida" : "✦ Catálogo"}
              </span>
              <span>{destacada.anio}</span>
              <span className="border border-gray-500 px-2 text-xs rounded">{destacada.genero}</span>
              {destacada.duracion && <span>{destacada.duracion}</span>}
            </div>
            <p className="hidden md:block text-gray-300 text-base leading-relaxed mb-6 line-clamp-3 max-w-xl">
              {destacada.sinopsis || "Sin sinopsis disponible"}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/ver/${destacada.id}`}
                className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105"
              >
                <Play className="w-5 h-5 fill-black" /> Reproducir
              </Link>
              <Link
                href={`/pelicula/${destacada.id}`}
                className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-700/70 backdrop-blur-sm px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Eye className="w-5 h-5" /> Detalles
              </Link>
              <button
                onClick={() => toggleFavorito(destacada.id)}
                className={`flex items-center gap-2 ${
                  favoritoIds.has(destacada.id)
                    ? "bg-[#E50914] hover:bg-[#b20710]"
                    : "bg-gray-700/50 hover:bg-gray-700/70"
                } backdrop-blur-sm px-6 py-3 rounded-lg font-semibold transition-all`}
                aria-label={favoritoIds.has(destacada.id) ? "Quitar de mi lista" : "Añadir a mi lista"}
              >
                {favoritoIds.has(destacada.id) ? (
                  <><Check className="w-5 h-5" /> En mi lista</>
                ) : (
                  <><Plus className="w-5 h-5" /> Mi lista</>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="relative z-10 -mt-10 md:-mt-20 px-4 md:px-12 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold">
            {busqueda ? `Resultados para "${busqueda}"` : "📽️ Catálogo"}
            <span className="text-sm text-gray-500 ml-2 font-normal">
              ({filtradas.length} películas)
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filtroGenero}
              onChange={(e) => {
                setFiltroGenero(e.target.value);
                setPagina(1);
              }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
            >
              <option value="todos">Todos los géneros</option>
              {GENEROS_POPULARES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
              {generos.map((g) => {
                if (!GENEROS_POPULARES.includes(g)) {
                  return (
                    <option key={g} value={g}>{g}</option>
                  );
                }
                return null;
              })}
            </select>

            <select
              value={ordenarPor}
              onChange={(e) => {
                setOrdenarPor(e.target.value as OrdenPor);
                setPagina(1);
              }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
            >
              <option value="reciente">Más reciente</option>
              <option value="titulo">Título (A-Z)</option>
              <option value="anio">Año (nuevo-viejo)</option>
              <option value="popular">Más populares</option>
            </select>
          </div>
        </div>

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E50914]" />
          </div>
        ) : peliculas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Film className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No hay películas en el catálogo</p>
            <Link href="/admin" className="text-[#E50914] hover:underline text-sm">
              Agrega tu primera película
            </Link>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No hay resultados para "{busqueda}"</p>
          </div>
        ) : (
          <>
            {errorFavoritos && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-red-400 text-sm flex items-center justify-between">
                <span>{errorFavoritos}</span>
                <button onClick={() => setErrorFavoritos(null)} className="hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {vistaGrid === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {peliculasPagina.map((p) => (
                  <TarjetaPelicula
                    key={p.id}
                    pelicula={p}
                    enLista={favoritoIds.has(p.id)}
                    onToggle={toggleFavorito}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {peliculasPagina.map((p) => (
                  <TarjetaPeliculaLista
                    key={p.id}
                    pelicula={p}
                    enLista={favoritoIds.has(p.id)}
                    onToggle={toggleFavorito}
                  />
                ))}
              </div>
            )}

            {totalPaginas > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-gray-400">
                  Página {pagina} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 flex justify-around py-2 z-40 backdrop-blur-md">
        {["Inicio", "Géneros", "Mi lista", "Promoción", "Mío"].map((item) => (
          <button
            key={item}
            onClick={() => {
              if (item === "Inicio") {
                setCategoriaActiva("Inicio");
                setPagina(1);
              }
              if (item === "Mi lista") {
                setCategoriaActiva("Mi lista");
                setPagina(1);
              }
              if (item === "Mío") router.push("/admin");
              if (item === "Géneros") {
                document.querySelector('select')?.focus();
              }
              if (item === "Promoción") {
                router.push("/");
              }
            }}
            className="text-xs text-gray-400 hover:text-white flex flex-col items-center gap-0.5 px-2 transition-colors"
          >
            {item === "Inicio" && <Home className="w-5 h-5" />}
            {item === "Géneros" && <Film className="w-5 h-5" />}
            {item === "Mi lista" && <Heart className="w-5 h-5" />}
            {item === "Promoción" && <Star className="w-5 h-5" />}
            {item === "Mío" && <User className="w-5 h-5" />}
            <span className="text-[9px]">{item}</span>
          </button>
        ))}
      </nav>
    </main>
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
  const [cargandoImg, setCargandoImg] = useState(true);
  const esNueva =
    new Date(pelicula.creado_en).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7;

  return (
    <div className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 relative">
      <Link href={`/ver/${pelicula.id}`}>
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 shadow-lg">
          {cargandoImg && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
          )}
          <img
            src={pelicula.caratula || CARATULA_FALLBACK}
            alt={pelicula.titulo}
            className={`w-full h-full object-cover transition-all duration-500 ${
              cargandoImg ? "opacity-0" : "opacity-100"
            } group-hover:opacity-90 group-hover:scale-105`}
            onLoad={() => setCargandoImg(false)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
              setCargandoImg(false);
            }}
          />
          {esNueva && (
            <span className="absolute top-2 left-2 bg-[#E50914] text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
              NUEVO
            </span>
          )}
          {pelicula.rating && (
            <span className="absolute bottom-2 left-2 bg-black/70 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400" /> {pelicula.rating}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <span className="text-white text-xs font-medium flex items-center gap-1">
              <Play className="w-3 h-3 fill-white" /> Reproducir
            </span>
          </div>
        </div>
        <h4 className="mt-2 text-sm font-medium truncate text-white">{pelicula.titulo}</h4>
        <p className="text-xs text-gray-400 truncate">{pelicula.genero}</p>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(pelicula.id);
        }}
        className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90 text-white text-xs z-20"
        aria-label={enLista ? "Quitar de mi lista" : "Añadir a mi lista"}
      >
        {enLista ? <Check className="w-4 h-4 text-[#E50914]" /> : <Plus className="w-4 h-4" />}
      </button>
    </div>
  );
}

function TarjetaPeliculaLista({
  pelicula,
  enLista,
  onToggle,
}: {
  pelicula: Pelicula;
  enLista: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <Link href={`/ver/${pelicula.id}`}>
      <div className="flex gap-4 bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors border border-white/5">
        <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
          <img
            src={pelicula.caratula || CARATULA_FALLBACK}
            alt={pelicula.titulo}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
            }}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="font-semibold text-white truncate">{pelicula.titulo}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{pelicula.anio}</span>
            <span>•</span>
            <span>{pelicula.genero}</span>
            {pelicula.rating && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-3 h-3 fill-yellow-400" /> {pelicula.rating}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-1 mt-1">{pelicula.sinopsis}</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle(pelicula.id);
          }}
          className={`self-center p-2 rounded-full ${
            enLista ? "bg-[#E50914]/20 text-[#E50914]" : "bg-white/10 text-white"
          } hover:bg-[#E50914]/30 transition-colors`}
          aria-label={enLista ? "Quitar de mi lista" : "Añadir a mi lista"}
        >
          {enLista ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>
    </Link>
  );
}
