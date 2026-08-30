"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Film, Trash2, Edit, Eye } from "lucide-react";

interface Pelicula {
  id: number;
  titulo: string;
  anio: string;
  genero: string;
  caratula: string;
  link_directo: string;
  fuente: string;
}

export default function AdminPage() {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/peliculas")
      .then((res) => res.json())
      .then((data) => {
        setPeliculas(data);
        setCargando(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="text-white">ONYX</span>
              <span className="text-[#d4af37]">PRIME</span>
              <span className="ml-2 text-sm text-gray-500 font-normal">Admin</span>
            </h1>
            <p className="text-gray-400 text-sm">Gestiona tu catálogo de películas</p>
          </div>
          <Link
            href="/agregar"
            className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#c19b2e] text-black px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" /> Agregar Película
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Películas</p>
            <p className="text-2xl font-bold text-white">{peliculas.length}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Cinecalidad</p>
            <p className="text-2xl font-bold text-blue-400">
              {peliculas.filter(p => p.fuente === "cinecalidad").length}
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Manuales</p>
            <p className="text-2xl font-bold text-green-400">
              {peliculas.filter(p => p.fuente === "manual").length}
            </p>
          </div>
        </div>

        {/* Lista de películas */}
        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]" />
          </div>
        ) : peliculas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Film className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No hay películas en el catálogo</p>
            <Link href="/agregar" className="text-[#d4af37] hover:underline text-sm">
              Agrega tu primera película
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Película</th>
                  <th className="pb-3 pr-4">Año</th>
                  <th className="pb-3 pr-4">Género</th>
                  <th className="pb-3 pr-4">Fuente</th>
                  <th className="pb-3 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {peliculas.map((pelicula, index) => (
                  <tr key={pelicula.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 pr-4 text-gray-500">{index + 1}</td>
                    <td className="py-3 pr-4 font-medium">{pelicula.titulo}</td>
                    <td className="py-3 pr-4 text-gray-400">{pelicula.anio}</td>
                    <td className="py-3 pr-4 text-gray-400">{pelicula.genero}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        pelicula.fuente === "cinecalidad" 
                          ? "bg-blue-500/20 text-blue-400" 
                          : "bg-green-500/20 text-green-400"
                      }`}>
                        {pelicula.fuente}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/ver/${pelicula.id}`}
                          className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
