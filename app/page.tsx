"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Home as HomeIcon, Film, List, Star, User, Play } from "lucide-react";

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
  badge?: string;
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
          badge: Math.random() > 0.7 ? "prime original" : "",
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
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Navbar superior */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">
            <span className="text-white">ONYX</span>
            <span className="text-[#d4af37]">PRIME</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-white/10 text-sm px-4 py-2 pl-10 rounded-full border border-white/10 focus:border-[#d4af37] focus:outline-none transition-colors w-40 focus:w-56 text-white placeholder-gray-400"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#d4af37] to-[#c19b2e] flex items-center justify-center text-black text-sm font-bold">
              A
            </div>
          </div>
        </div>
      </nav>

      {/* Categorías horizontal */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 overflow-x-auto">
        <div className="flex gap-6 max-w-7xl mx-auto">
          {["Inicio", "Telenovela", "Películas", "Series"].map((cat) => (
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

      {/* Contenido principal */}
      <main className="pt-36 px-4 max-w-7xl mx-auto">
        {/* Hero - Película destacada */}
        {destacada && (
          <section className="relative rounded-2xl overflow-hidden mb-8 h-[320px] bg-gradient-to-br from-gray-900 to-black">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              {destacada.badge && (
                <span className="inline-block px-2 py-1 bg-[#d4af37] text-black text-xs font-bold rounded mb-2">
                  {destacada.badge}
                </span>
              )}
              <h2 className="text-3xl font-bold">{destacada.titulo}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-300">{destacada.rating} ★</span>
                <span className="text-sm text-gray-500">{destacada.anio} · {destacada.genero}</span>
              </div>
              <button className="mt-4 flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
                <Play className="w-4 h-4 fill-black" /> Reproducir
              </button>
            </div>
          </section>
        )}

        {/* Sección: Últimamente nuevo */}
        <section>
          <h3 className="text-lg font-semibold mb-4">📺 Últimamente nuevo</h3>
          {cargando ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d4af37]" />
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>No hay películas en el catálogo</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtradas.slice(0, 10).map((pelicula) => (
                <Link href={`/ver/${pelicula.id}`} key={pelicula.id}>
                  <div className="group cursor-pointer transition-all hover:scale-105">
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
                      {pelicula.badge && (
                        <span className="absolute top-2 left-2 bg-[#d4af37] text-black text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {pelicula.badge}
                        </span>
                      )}
                      {pelicula.rating && (
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                          ★ {pelicula.rating}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <span className="text-xs text-white font-medium">▶ Reproducir</span>
                      </div>
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
          <section className="mt-8">
            <h3 className="text-lg font-semibold mb-4">📅 AGOSTO 27</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtradas.slice(3, 7).map((pelicula) => (
                <Link href={`/ver/${pelicula.id}`} key={pelicula.id}>
                  <div className="group cursor-pointer transition-all hover:scale-105">
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
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 px-4 py-2">
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
            <span className="text-[10px]">Lista</span>
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
Fix: Renombrar icono Home a HomeIcon en página pública
