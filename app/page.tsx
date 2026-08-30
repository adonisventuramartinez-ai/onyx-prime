"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Home as HomeIcon, Film, List, Tv, User, Shield } from "lucide-react";

interface Pelicula {
  id: number;
  titulo: string;
  anio: string;
  genero: string;
  caratula: string;
  link_directo: string;
  fuente: string;
}

export default function Home() {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetch("/api/peliculas")
      .then((res) => res.json())
      .then((data) => {
        setPeliculas(data);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  const filtradas = peliculas.filter((p) =>
    p.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black pb-20 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold flex items-center gap-1">
            <span className="text-white">ONYX</span>
            <span className="text-[#d4af37]">PRIME</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-white/10 text-sm px-4 py-2 pl-10 rounded-full border border-white/10 focus:border-[#d4af37] focus:outline-none transition-colors w-40 focus:w-56 text-white"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-full text-xs transition-colors"
            >
              <Shield className="w-4 h-4" /> Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="mb-6 flex gap-3">
          <Link
            href="/scrapear"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm transition-colors"
          >
            🌐 Scrapear de Cinecalidad
          </Link>
        </div>

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Film className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No hay películas en el catálogo</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtradas.map((pelicula) => (
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
                        Sin carátula
                      </div>
                    )}
                    {pelicula.fuente === "cinecalidad" && (
                      <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                        Cinecalidad
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-xs text-white font-medium">▶ Reproducir</span>
                    </div>
                  </div>
                  <h4 className="mt-2 text-sm font-medium truncate">{pelicula.titulo}</h4>
                  <p className="text-xs text-gray-500">{pelicula.anio} · {pelicula.genero}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Navegación inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 px-4 py-2">
        <div className="flex justify-around max-w-md mx-auto">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-white">
            <HomeIcon className="w-5 h-5" />
            <span className="text-[10px]">Inicio</span>
          </Link>
          <Link href="/admin" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
            <Shield className="w-5 h-5" />
            <span className="text-[10px]">Admin</span>
          </Link>
          <Link href="/scrapear" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
            <Tv className="w-5 h-5" />
            <span className="text-[10px]">Scrapear</span>
          </Link>
          <button className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
            <List className="w-5 h-5" />
            <span className="text-[10px]">Lista</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
