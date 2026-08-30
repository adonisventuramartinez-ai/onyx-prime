"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Plus, ThumbsUp, Share2 } from "lucide-react";

interface Pelicula {
  id: number;
  titulo: string;
  anio: string;
  genero: string;
  sinopsis: string;
  caratula: string;
  link_directo: string;
  fuente: string;
}

export default function VerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`/api/peliculas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPelicula(data);
        setCargando(false);
      });
  }, [id]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E50914]" />
      </div>
    );
  }

  if (!pelicula) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center">
        <p>Película no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Botón volver */}
      <button
        onClick={() => router.back()}
        className="fixed top-4 left-4 z-50 p-2 bg-black/60 backdrop-blur-sm rounded-full border border-gray-700 hover:bg-gray-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Reproductor */}
      <div className="w-full h-[60vh] bg-black flex items-center justify-center">
        {pelicula.link_directo ? (
          <video
            controls
            autoPlay
            className="w-full h-full object-contain"
            poster={pelicula.caratula}
          >
            <source src={pelicula.link_directo} type="video/mp4" />
            Tu navegador no soporta reproducción de video.
          </video>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-gray-900 to-black">
            <Play className="w-20 h-20 opacity-20" />
            <p className="mt-4 text-lg">No hay link disponible</p>
            <p className="text-sm text-gray-600 mt-2">Agrega un link de reproducción desde el panel de admin</p>
          </div>
        )}
      </div>

      {/* Info de la película */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold">{pelicula.titulo}</h1>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <span className="text-sm text-green-400 font-semibold">★ 8.7</span>
          <span className="text-sm text-gray-400">{pelicula.anio}</span>
          <span className="text-sm text-gray-400">{pelicula.genero}</span>
          {pelicula.fuente === "cinecalidad" && (
            <span className="text-xs bg-[#E50914]/20 text-[#E50914] px-2 py-0.5 rounded-full">
              Cinecalidad
            </span>
          )}
        </div>
        <p className="text-gray-300 text-sm mt-4 leading-relaxed max-w-2xl">
          {pelicula.sinopsis || "Sin sinopsis disponible"}
        </p>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-md font-semibold hover:bg-gray-200 transition-colors">
            <Play className="w-4 h-4 fill-black" /> Reproducir
          </button>
          <button className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-600/50 px-6 py-2.5 rounded-md font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Mi lista
          </button>
          <button className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-600/50 px-6 py-2.5 rounded-md font-semibold transition-colors">
            <ThumbsUp className="w-4 h-4" /> Calificar
          </button>
          <button className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-600/50 px-6 py-2.5 rounded-md font-semibold transition-colors">
            <Share2 className="w-4 h-4" /> Compartir
          </button>
        </div>
      </div>
    </div>
  );
}
