"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

// ========================================
// FALLBACK PARA CARÁTULA
// ========================================
const CARATULA_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23222222'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='%23808080' text-anchor='middle' dy='.3em'%3ESin imagen%3C/text%3E%3C/svg%3E";

// ========================================
// TIPOS
// ========================================
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

const CATEGORIAS = ["Inicio", "Telenovela", "Películas", "Series", "Mi lista"];

export default function HomePage() {
  const router = useRouter();
  const supabase = crearClienteNavegador();

  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Inicio");
  const [navScrolled, setNavScrolled] = useState(false);
  const [favoritoIds, setFavoritoIds] = useState<Set<string>>(new Set());
  const [emailUsuario, setEmailUsuario] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    const cargarDatos = () => {
      fetch("/api/peliculas")
        .then((res) => {
          if (!res.ok) throw new Error("Error al cargar películas");
          return res.json();
        })
        .then((data) => {
          const pelis = data.peliculas || data || [];
          setPeliculas(pelis);
          setCargando(false);
        })
        .catch((err) => {
          console.error("❌ Error al cargar películas:", err);
          setCargando(false);
        });

      fetch("/api/favoritos")
        .then((res) => (res.ok ? res.json() : []))
        .then((ids: string[]) => setFavoritoIds(new Set(ids)))
        .catch(() => {});

      supabase.auth.getUser().then(({ data }) => {
        setEmailUsuario(data.user?.email ?? null);
      });

      fetch("/api/admin/check")
        .then((res) => (res.ok ? res.json() : { isAdmin: false }))
        .then((data) => setEsAdmin(Boolean(data.isAdmin)))
        .catch(() => setEsAdmin(false));
    };

    cargarDatos();

    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cerrarSesion = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const toggleFavorito = async (id: string) => {
    const yaEsta = favoritoIds.has(id);
    setFavoritoIds((prev) => {
      const next = new Set(prev);
      yaEsta ? next.delete(id) : next.add(id);
      return next;
    });

    if (yaEsta) {
      await fetch(`/api/favoritos?pelicula_id=${id}`, { method: "DELETE" }).catch(() => {});
    } else {
      await fetch("/api/favoritos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pelicula_id: id }),
      }).catch(() => {});
    }
  };

  const destacada = peliculas.find((p) => p.destacada) ?? peliculas[0];

  const generos = useMemo(
    () => [...new Set(peliculas.map((p) => p.genero).filter(Boolean))],
    [peliculas]
  );

  const filtradas = useMemo(() => {
    let lista = peliculas;
    if (busqueda.trim()) {
      lista = lista.filter((p) => p.titulo?.toLowerCase().includes(busqueda.toLowerCase()));
    }
    if (categoriaActiva === "Mi lista") {
      lista = lista.filter((p) => favoritoIds.has(p.id));
    } else if (categoriaActiva === "Series" || categoriaActiva === "Telenovela") {
      lista = lista.filter((p) => p.genero?.toLowerCase().includes(categoriaActiva.toLowerCase()));
    }
    return lista;
  }, [peliculas, busqueda, categoriaActiva, favoritoIds]);

  const recientes = [...peliculas]
    .sort((a, b) => {
      const dateA = a.creado_en ? new Date(a.creado_en).getTime() : 0;
      const dateB = b.creado_en ? new Date(b.creado_en).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 12);

  return (
    <main className="min-h-screen bg-[#141414] text-white pb-20">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          navScrolled ? "bg-black" : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-12 py-4 gap-4">
          <div className="flex items-center gap-8">
            <span className="text-[#E50914] font-black text-2xl md:text-3xl tracking-tight select-none">
              ONYXFLIX
            </span>
            <nav className="hidden md:flex gap-5 text-sm text-gray-200">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActiva(cat)}
                  className={`transition-colors hover:text-white ${
                    categoriaActiva === cat ? "text-white font-semibold" : "text-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Títulos, personas, géneros"
              className="bg-black/70 border border-white/30 rounded px-3 py-1.5 text-sm w-36 md:w-64 focus:outline-none focus:border-white transition-all placeholder:text-gray-400"
            />

            <div className="relative">
              <button
                onClick={() => setMenuAbierto((v) => !v)}
                className="w-8 h-8 rounded bg-[#E50914] flex items-center justify-center font-bold text-sm"
              >
                {emailUsuario ? emailUsuario[0].toUpperCase() : "?"}
              </button>
              {menuAbierto && (
                <div className="absolute right-0 mt-2 w-48 bg-black/95 border border-white/10 rounded shadow-lg py-2 text-sm">
                  <p className="px-4 py-1.5 text-gray-400 truncate">{emailUsuario}</p>
                  <Link href="/perfil" className="block px-4 py-1.5 hover:bg-white/10">
                    Mi perfil
                  </Link>
                  {esAdmin && (
                    <Link href="/admin" className="block px-4 py-1.5 hover:bg-white/10">
                      Panel admin
                    </Link>
                  )}
                  <button
                    onClick={cerrarSesion}
                    className="block w-full text-left px-4 py-1.5 hover:bg-white/10 text-[#E50914]"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      {destacada && (
        <section className="relative h-[56vw] max-h-[85vh] min-h-[420px] w-full overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={destacada.caratula || CARATULA_FALLBACK}
              alt={destacada.titulo}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

          <div className="relative h-full flex flex-col justify-end px-4 md:px-12 pb-24 md:pb-0 max-w-xl">
            <h1 className="text-3xl md:text-6xl font-black mb-3 drop-shadow-lg leading-tight">
              {destacada.titulo}
            </h1>
            <div className="flex items-center gap-3 text-sm md:text-base text-gray-200 mb-3">
              <span className="text-green-500 font-semibold">
                {destacada.fuente === "manual" ? "Añadida" : "Catálogo"}
              </span>
              <span>{destacada.anio}</span>
              <span className="border border-gray-400 px-1.5 text-xs rounded">
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
                ▶ Reproducir
              </Link>
              <Link
                href={`/pelicula/${destacada.id}`}
                className="flex items-center gap-2 bg-gray-500/40 text-white px-6 py-2.5 rounded font-semibold hover:bg-gray-500/60 transition-colors"
              >
                Más información
              </Link>
              <button
                onClick={() => toggleFavorito(destacada.id)}
                className="flex items-center gap-2 bg-gray-500/40 text-white px-6 py-2.5 rounded font-semibold hover:bg-gray-500/60 transition-colors"
              >
                {favoritoIds.has(destacada.id) ? "✓ En mi lista" : "+ Mi lista"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CATÁLOGO */}
      <section className="relative z-10 -mt-10 md:-mt-24 px-4 md:px-12 pb-20 space-y-10">
        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E50914]" />
          </div>
        ) : peliculas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No hay películas en el catálogo</p>
          </div>
        ) : busqueda.trim() || categoriaActiva !== "Inicio" ? (
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-3">Resultados</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtradas.slice(0, 10).map((p) => (
                <TarjetaPelicula key={p.id} pelicula={p} enLista={favoritoIds.has(p.id)} onToggle={toggleFavorito} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-3">Agregadas recientemente</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recientes.map((p) => (
                  <TarjetaPelicula key={p.id} pelicula={p} enLista={favoritoIds.has(p.id)} onToggle={toggleFavorito} />
                ))}
              </div>
            </div>
            {generos.map((genero) => (
              <div key={genero}>
                <h2 className="text-lg md:text-xl font-semibold mb-3">{genero}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {peliculas.filter((p) => p.genero === genero).map((p) => (
                    <TarjetaPelicula key={p.id} pelicula={p} enLista={favoritoIds.has(p.id)} onToggle={toggleFavorito} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </section>

      {/* NAVEGACIÓN INFERIOR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 flex justify-around py-2 z-40">
        {["Inicio", "Géneros", "Mi lista", "Promoción", "Mío"].map((item) => (
          <button
            key={item}
            onClick={() => {
              if (item === "Inicio") setCategoriaActiva("Inicio");
              if (item === "Mi lista") setCategoriaActiva("Mi lista");
              if (item === "Mío") router.push("/admin");
            }}
            className="text-xs text-gray-400 hover:text-white flex flex-col items-center gap-1 px-2"
          >
            {item}
          </button>
        ))}
      </nav>
    </main>
  );
}

// ========================================
// TARJETA DE PELÍCULA
// ========================================
function TarjetaPelicula({
  pelicula,
  enLista,
  onToggle,
}: {
  pelicula: Pelicula;
  enLista: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10">
      <Link href={`/pelicula/${pelicula.id}`}>
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
          <img
            src={pelicula.caratula || CARATULA_FALLBACK}
            alt={pelicula.titulo}
            className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
            onError={(e) => {
              (e.target as HTMLImageElement).src = CARATULA_FALLBACK;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
            <span className="text-white text-xs font-medium">▶ Reproducir</span>
          </div>
        </div>
        <h4 className="mt-2 text-sm font-medium truncate">{pelicula.titulo}</h4>
        <p className="text-xs text-gray-500 truncate">{pelicula.genero}</p>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggle(pelicula.id);
        }}
        className="absolute top-2 right-2 bg-black/60 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 text-white text-xs"
      >
        {enLista ? "✓" : "+"}
      </button>
    </div>
  );
}
