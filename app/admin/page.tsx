"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Pelicula } from "@/lib/db";
import { CARATULA_FALLBACK } from "@/lib/db";
import PeliculaForm, { type DatosPelicula } from "@/components/PeliculaForm";
import { Loader2, Sparkles, Copy, CheckCircle, AlertCircle } from "lucide-react";

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

  // ========================================
  // ESTADO PARA EL LIMPIADOR DE LINKS
  // ========================================
  const [linkInput, setLinkInput] = useState("");
  const [linkLimpio, setLinkLimpio] = useState("");
  const [linkLimpioLista, setLinkLimpioLista] = useState<string[]>([]);
  const [limpiando, setLimpiando] = useState(false);
  const [limpiadoExitoso, setLimpiadoExitoso] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [errorLimpiador, setErrorLimpiador] = useState("");

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

  // ========================================
  // FUNCIÓN: LIMPIAR LINK
  // ========================================
  const limpiarLink = async () => {
    if (!linkInput.trim()) {
      setErrorLimpiador("Pega un link para limpiar");
      return;
    }

    setLimpiando(true);
    setLinkLimpio("");
    setLinkLimpioLista([]);
    setLimpiadoExitoso(false);
    setErrorLimpiador("");
    setCopiado(false);

    try {
      const res = await fetch(`/api/limpiar-link?url=${encodeURIComponent(linkInput.trim())}`);
      const data = await res.json();

      if (data.link_directo) {
        setLinkLimpio(data.link_directo);
        setLinkLimpioLista(data.todos_los_links || []);
        setLimpiadoExitoso(true);
      } else {
        setErrorLimpiador(data.mensaje || "No se encontró link de video");
      }
    } catch (err) {
      setErrorLimpiador("Error al limpiar el link");
    } finally {
      setLimpiando(false);
    }
  };

  const copiarLink = () => {
    if (linkLimpio) {
      navigator.clipboard.writeText(linkLimpio);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
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
          <h1 className="text-nf-red font-black text-2xl">ONYXFLIX · Admin</h1>
          <p className="text-nf-gray-light text-sm">Gestiona el catálogo</p>
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
            className="bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded font-semibold text-sm"
          >
            + Agregar manual
          </Link>
          <Link
            href="/agregar-auto"
            className="bg-purple-600 hover:bg-purple-700 transition-colors px-4 py-2 rounded font-semibold text-sm"
          >
            🤖 Buscar automático
          </Link>
        </div>
      </div>

      {/* ======================================== */}
      {/* LIMPIADOR DE LINKS */}
      {/* ======================================== */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold">🧹 Limpiador de Links</h2>
          <span className="text-xs text-gray-500">(Extrae link directo de video)</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Pega cualquier link de Cinecalidad o página similar..."
            className="flex-1 bg-black/30 border border-white/15 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:outline-none transition-colors text-white placeholder-gray-500 text-sm"
          />
          <button
            onClick={limpiarLink}
            disabled={limpiando}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {limpiando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {limpiando ? "Limpiando..." : "Limpiar link"}
          </button>
        </div>

        {errorLimpiador && (
          <div className="mt-3 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorLimpiador}
          </div>
        )}

        {limpiadoExitoso && linkLimpio && (
          <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-400 mb-1">✅ Link directo (sin anuncios):</p>
                <p className="text-sm text-white truncate font-mono">{linkLimpio}</p>
              </div>
              <button
                onClick={copiarLink}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors whitespace-nowrap"
              >
                {copiado ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
            
            {linkLimpioLista.length > 1 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">📋 Otros links encontrados:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {linkLimpioLista.map((link, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setLinkLimpio(link);
                        navigator.clipboard.writeText(link);
                        setCopiado(true);
                        setTimeout(() => setCopiado(false), 2000);
                      }}
                      className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 truncate max-w-xs transition-colors"
                    >
                      {link}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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

      <div className="overflow-x-auto rounded border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/60 text-nf-gray-light text-left">
            <tr>
              <th className="p-3">Carátula</th>
              <th className="p-3">Título</th>
              <th className="p-3">Año</th>
              <th className="p-3">Género</th>
              <th className="p-3">Fuente</th>
              <th className="p-3">Destacada</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="p-6 text-center text-nf-gray-light">Cargando...</td></tr>
            ) : visibles.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-nf-gray-light">No hay películas que coincidan con el filtro.</td></tr>
            ) : (
              visibles.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <img
                      src={p.caratula || CARATULA_FALLBACK}
                      onError={(e) => { (e.target as HTMLImageElement).src = CARATULA_FALLBACK; }}
                      alt=""
                      className="w-10 h-14 object-cover rounded bg-neutral-800"
                    />
                  </td>
                  <td className="p-3 font-medium">{p.titulo}</td>
                  <td className="p-3 text-nf-gray-light">{p.anio}</td>
                  <td className="p-3 text-nf-gray-light">{p.genero}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      p.fuente === "manual" ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"
                    }`}>
                      {p.fuente}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleDestacada(p)}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        p.destacada ? "bg-nf-red text-white" : "bg-white/10 text-nf-gray-light hover:bg-white/20"
                      }`}
                    >
                      {p.destacada ? "★ Sí" : "☆ No"}
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-3 whitespace-nowrap">
                    <Link href={`/pelicula/${p.id}`} className="text-nf-gray-light hover:text-white text-xs">Ver</Link>
                    <button onClick={() => setEditando(p)} className="text-blue-400 hover:text-blue-300 text-xs">Editar</button>
                    <button
                      onClick={() => eliminar(p.id)}
                      disabled={eliminandoId === p.id}
                      className="text-nf-red hover:text-nf-red-hover text-xs disabled:opacity-40"
                    >
                      {eliminandoId === p.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaSegura === 1}
            className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-sm disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span className="text-sm text-nf-gray-light">Página {paginaSegura} de {totalPaginas}</span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaSegura === totalPaginas}
            className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-sm disabled:opacity-30"
          >
            Siguiente →
          </button>
        </div>
      )}

      {editando && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-2 sm:px-4 py-4 sm:py-8 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setEditando(null)}
        >
          <div className="bg-nf-dark border border-white/10 rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold pr-2 truncate">Editar: {editando.titulo}</h2>
              <button
                onClick={() => setEditando(null)}
                className="text-nf-gray-light hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center shrink-0 rounded hover:bg-white/10"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <PeliculaForm inicial={editando} onGuardar={guardarEdicion} textoBoton="Guardar cambios" />
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="bg-black/50 border border-white/10 rounded p-4">
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-nf-gray-light text-xs uppercase tracking-wide">{label}</p>
    </div>
  );
}
