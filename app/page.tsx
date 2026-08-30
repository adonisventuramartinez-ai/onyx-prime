"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Home as HomeIcon, Film, List, Star, User, Play, Info } from "lucide-react";

interface Pelicula {
  id: number;
  titulo: string;
  anio: string;
  genero: string;
  sinopsis: string;
  caratula: string;
  link_directo: string;
  fuente: string;
  rating?: string;
}

export default function Home() {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Inicio");

  useEffect(() => {
    fetch("/api/peliculas")
      .then((res) => res.json())
      .then((data) => {
        const pelisConRating = data.map((p: Pelicula) => ({
          ...p,
          rating: (Math.random() * 2 + 6.5).toFixed(1),
        }));
        setPeliculas(pelisConRating);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  const filtradas = peliculas.filter((p) =>
    p.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const destacada = peliculas.length > 0 ? peliculas[0] : null;

  return (
    <div className="min-h-screen bg-[#141414] text-white pb-20">
      {/* Navbar estilo Netflix */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/95 to-transparent px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-white">ONYX</span>
            <span className="text-[#E50914]">FLIX</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Títulos, personas, géneros..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-black/60 text-sm px-4 py-2 pl-10 rounded-full border border-gray-700 focus:border-[#E50914] focus:outline-none transition-colors w-40 focus:w-64 text-white placeholder-gray-400"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <div className="w-8 h-8 rounded-full bg-[#E50914] flex items-center justify-center text-white text-sm font-bold">
              U
            </div>
          </div>
        </div>
      </nav>

      {/* Categorías */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#141414]/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 overflow-x-auto">
        <div className="flex gap-6 max-w-7xl mx-auto">
          {["Inicio", "Telenovela", "Películas", "Series", "Mi lista"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                categoria === cat ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <main className="pt-36 px-4 max-w-7xl mx-auto">
        {/* Hero - Película destacada */}
        {destacada && (
          <section className="relative rounded-xl overflow-hidden mb-10 h-[400px] md:h-[500px] bg-gradient-to-br from-gray-900 to-black">
            {destacada.caratula && (
              <div className="absolute inset-0">
                <img
                  src={destacada.caratula}
                  alt={destacada.titulo}
                  className="w-full h-full object-cover opacity-60"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-2xl">
              <span className="inline-block px-3 py-1 bg-[#E50914] text-white text-xs font-bold rounded mb-3">
                DESTACADA
              </span>
              <h2 className="text-4xl md:text-6xl font-bold mb-2">{destacada.titulo}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-green-400 font-semibold">{destacada.rating} ★</span>
                <span className="text-sm text-gray-300">{destacada.anio}</span>
                <span className="text-sm text-gray-400">{destacada.genero}</span>
              </div>
              <p className="text-sm text-gray-300 mt-3 line-clamp-2 max-w-xl">
                {destacada.sinopsis || "Sin sinopsis disponible"}
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link
                  href={`/ver/${destacada.id}`}
                  className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-md font-semibold hover:bg-gray-200 transition-colors"
                >
                  <Play className="w-4 h-4 fill-black" /> Reproducir
                </Link>
                <button className="flex items-center gap-2 bg-gray-700/70 hover:bg-gray-600/70 px-6 py-2.5 rounded-md font-semibold transition-colors">
                  <Info className="w-4 h-4" /> Más información
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Sección: Últimamente nuevo */}
        <section>
          <h3 className="text-xl font-semibold mb-4">🔥 Últimamente nuevo</h3>
          {cargando ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E50914]" />
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">No hay películas en el catálogo</p>
              <p className="text-sm mt-2">Agrega películas desde el panel de administrador</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtradas.slice(0, 10).map((pelicula) => (
                <Link href={`/ver/${pelicula.id}`} key={pelicula.id}>
                  <div className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10">
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                      {pelicula.caratula ? (
                        <img
                          src={pelicula.caratula}
                          alt={pelicula.titulo}
                          className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                          Sin imagen
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <span className="text-white text-xs font-medium flex items-center gap-1">
                          <Play className="w-3 h-3 fill-white" /> Reproducir
                        </span>
                      </div>
                      {pelicula.rating && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                          ★ {pelicula.rating}
                        </span>
                      )}
                    </div>
                    <h4 className="mt-2 text-sm font-medium truncate">{pelicula.titulo}</h4>
                    <p className="text-xs text-gray-500 truncate">{pelicula.genero}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Sección adicional: AGOSTO 27 */}
        {!cargando && filtradas.length > 3 && (
          <section className="mt-10">
            <h3 className="text-xl font-semibold mb-4">📅 AGOSTO 27</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtradas.slice(3, 7).map((pelicula) => (
                <Link href={`/ver/${pelicula.id}`} key={pelicula.id}>
                  <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                      {pelicula.caratula ? (
                        <img
                          src={pelicula.caratula}
                          alt={pelicula.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                          Sin imagen
                        </div>
                      )}
                      {pelicula.rating && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                          ★ {pelicula.rating}
                        </span>
                      )}
                    </div>
                    <h4 className="mt-2 text-sm font-medium truncate">{pelicula.titulo}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Navegación inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-gray-800 px-4 py-2">
        <div className="flex justify-around max-w-md mx-auto">
          <button className="flex flex-col items-center gap-0.5 text-white">
            <HomeIcon className="w-5 h-5" />
            <span className="text-[10px]">Inicio</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
            <Film className="w-5 h-5" />
            <span className="text-[10px]">Géneros</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
            <List className="w-5 h-5" />
            <span className="text-[10px]">Mi lista</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
            <Star className="w-5 h-5" />
            <span className="text-[10px]">Promoción</span>
          </button>
          <Link href="/admin" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
            <User className="w-5 h-5" />
            <span className="text-[10px]">Mío</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
