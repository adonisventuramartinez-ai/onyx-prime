"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Pelicula } from "@/lib/db";
import { CARATULA_FALLBACK } from "@/lib/db";
import PeliculaForm, { type DatosPelicula } from "@/components/PeliculaForm";

const POR_PAGINA = 8;

export default function AdminPage() {
  const [verificando, setVerificando] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);
  const [emailUsuario, setEmailUsuario] = useState("");

  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [cargando, setCargando] = useState(true);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [editando, setEditando] = useState<Pelicula | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroFuente, setFiltroFuente] = useState<"todas" | "manual" | "auto">("todas");
  const [filtroGenero, setFiltroGenero] = useState("todos");
  const [orden, setOrden] = useState<"reciente" | "titulo" | "anio">("reciente");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((data) => {
        setEsAdmin(Boolean(data.isAdmin));
        setEmailUsuario(data.email || "");
        setVerificando(false);
      })
      .catch(() => setVerificando(false));
  }, []);

  useEffect(() => {
    if (!esAdmin) return;
    cargarPeliculas();
  }, [esAdmin]);

  const cargarPeliculas = () => {
    setCargando(true);
    fetch("/api/peliculas")
      .then((res) => res.json())
      .then((data) => {
        setPeliculas(Array.isArray(data.peliculas) ? data.peliculas : []);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta película? Esta acción no se puede deshacer.")) return;
    setEliminandoId(id);
    try {
      const res = await fetch(`/api/peliculas/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPeliculas((prev) => prev.filter((p) => p.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "No se pudo eliminar la película");
      }
    } finally {
      setEliminandoId(null);
    }
  };

  const toggleDestacada = async (p: Pelicula) => {
    const res = await fetch(`/api/peliculas/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destacada: !p.destacada }),
    });
    if (res.ok) {
      const actualizada = await res.json();
      setPeliculas((prev) => prev.map((x) => (x.id === p.id ? actualizada : x)));
    }
  };

  const guardarEdicion = async (datos: DatosPelicula) => {
    if (!editando) return;
    const res = await fetch(`/api/peliculas/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Error al guardar los cambios");
    }
    const actualizada = await res.json();
    setPeliculas((prev) => prev.map((x) => (x.id === editando.id ? actualizada : x)));
    setEditando(null);
  };

  const generos = useMemo(
    () => [...new Set(peliculas.map((p) => p.genero).filter(Boolean))],
    [peliculas]
  );

  const filtradas = useMemo(() => {
    let lista = [...peliculas];

    if (busqueda.trim()) {
      lista = lista.filter((p) => p.titulo.toLowerCase().includes(busqueda.toLowerCase()));
    }
    if (filtroFuente !== "todas") {
      lista = lista.filter((p) => p.fuente === filtroFuente);
    }
    if (filtroGenero !== "todos") {
      lista = lista.filter((p) => p.genero === filtroGenero);
    }

    if (orden === "titulo") {
      lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (orden === "anio") {
      lista.sort((a, b) => b.anio - a.anio);
    } else {
      lista.sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());
    }

    return lista;
  }, [peliculas, busqueda, filtroFuente, filtroGenero, orden]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice(
    (paginaSegura - 1) * POR_PAGINA,
    paginaSegura * POR_PAGINA
  );

  if (verificando) {
    return (
      <main className="min-h-screen bg-nf-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-nf-red border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!esAdmin) {
    return (
      <main className="min-h-screen bg-nf-dark flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl font-semibold">No tienes acceso al panel de administrador</p>
        <p className="text-nf-gray-light text-sm max-w-sm">
          Tu cuenta ({emailUsuario || "sin sesión"}) no está en la lista de administradores.
          Pídele al dueño del proyecto que agregue tu correo a la variable de entorno{" "}
          <code className="bg-white/10 px-1 rounded">ADMIN_EMAILS</code>.
        </p>
        <Link href="/" className="bg-nf-red hover:bg-nf-red-hover transition-colors px-6 py-2.5 rounded font-semibold">
          Volver al catálogo
        </Link>
      </main>
    );
  }

  const total = peliculas.length;
  const auto = peliculas.filter((p) => p.fuente === "auto").length;
  const manual = peliculas.filter((p) => p.fuente === "manual").length;
  const destacadas = peliculas.filter((p) => p.destacada).length;

  return (
    <main className="min-h-screen bg-nf-dark px-4 md:px-10 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display italic text-nf-cream text-2xl">Onyx <span className="text-nf-red not-italic">· Panel</span></h1>
          <p className="text-nf-gray-light text-sm">Gestiona tu catálogo</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded font-semibold text-sm"
          >
            Ver catálogo
          </Link>
          <Link
            href="/agregar"
            className="bg-nf-red hover:bg-nf-red-hover transition-colors px-4 py-2 rounded font-semibold text-sm"
          >
            + Agregar película
          </Link>
        </div>
      </div>

      {/* ======================================== */}
      {/* ESTADÍSTICAS */}
      {/* ======================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl">
        <Stat label="Total" valor={total} />
        <Stat label="Manuales" valor={manual} />
        <Stat label="Automáticas" valor={auto} />
        <Stat label="Destacadas" valor={destacadas} />
      </div>

      {/* ======================================== */}
      {/* FILTROS Y TABLA */}
      {/* ======================================== */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          placeholder="Buscar por título..."
          className="bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-white flex-1 min-w-[180px]"
        />
        <select
          value={filtroFuente}
          onChange={(e) => { setFiltroFuente(e.target.value as any); setPagina(1); }}
          className="bg-white/5 border border-white/15 rounded px-3 py-2 text-sm"
        >
          <option value="todas">Todas las fuentes</option>
          <option value="manual">Manuales</option>
          <option value="auto">Automáticas</option>
        </select>
        <select
          value={filtroGenero}
          onChange={(e) => { setFiltroGenero(e.target.value); setPagina(1); }}
          className="bg-white/5 border border-white/15 rounded px-3 py-2 text-sm"
        >
          <option value="todos">Todos los géneros</option>
          {generos.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as any)}
          className="bg-white/5 border border-white/15 rounded px-3 py-2 text-sm"
        >
          <option value="reciente">Más reciente</option>
          <option value="titulo">Título (A-Z)</option>
          <option value="anio">Año (nuevo-viejo)</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded border
