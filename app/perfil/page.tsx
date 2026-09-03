"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";

export default function PerfilPage() {
  const supabase = crearClienteNavegador();

  const [cargando, setCargando] = useState(true);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [mensajePerfil, setMensajePerfil] = useState("");
  const [errorPerfil, setErrorPerfil] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        setEmail(user.email || "");
        setNombre((user.user_metadata?.nombre as string) || "");
        setAvatarUrl((user.user_metadata?.avatar_url as string) || "");
      }
      setCargando(false);
    });
  }, []);

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPerfil("");
    setMensajePerfil("");
    setGuardandoPerfil(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { nombre, avatar_url: avatarUrl },
      });
      if (error) throw error;
      setMensajePerfil("Perfil actualizado.");
    } catch (err: any) {
      setErrorPerfil(err.message || "No se pudo actualizar el perfil");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const cambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPassword("");
    setMensajePassword("");

    if (nuevaPassword.length < 6) {
      setErrorPassword("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorPassword("Las contraseñas no coinciden.");
      return;
    }

    setGuardandoPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
      if (error) throw error;
      setMensajePassword("Contraseña actualizada.");
      setNuevaPassword("");
      setConfirmarPassword("");
    } catch (err: any) {
      setErrorPassword(err.message || "No se pudo cambiar la contraseña");
    } finally {
      setGuardandoPassword(false);
    }
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-nf-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-nf-red border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-nf-dark px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mi perfil</h1>
          <Link href="/" className="text-nf-gray-light hover:text-white text-sm">
            ← Volver al catálogo
          </Link>
        </div>

        <section className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-nf-red flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                (nombre || email)[0]?.toUpperCase()
              )}
            </div>
            <div>
              <p className="font-semibold">{nombre || "Sin nombre"}</p>
              <p className="text-nf-gray-light text-sm">{email}</p>
            </div>
          </div>

          <form onSubmit={guardarPerfil} className="space-y-4">
            <Campo label="Nombre">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input"
                placeholder="Tu nombre"
              />
            </Campo>
            <Campo label="URL de foto de perfil (opcional)">
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="input"
                placeholder="https://..."
              />
            </Campo>

            {errorPerfil && <p className="text-nf-red text-sm">{errorPerfil}</p>}
            {mensajePerfil && <p className="text-green-500 text-sm">{mensajePerfil}</p>}

            <button
              type="submit"
              disabled={guardandoPerfil}
              className="bg-nf-red hover:bg-nf-red-hover transition-colors px-6 py-2.5 rounded font-semibold disabled:opacity-50"
            >
              {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </section>

        <hr className="border-white/10" />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
          <form onSubmit={cambiarPassword} className="space-y-4">
            <Campo label="Nueva contraseña">
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="input"
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </Campo>
            <Campo label="Confirmar nueva contraseña">
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="input"
                minLength={6}
              />
            </Campo>

            {errorPassword && <p className="text-nf-red text-sm">{errorPassword}</p>}
            {mensajePassword && <p className="text-green-500 text-sm">{mensajePassword}</p>}

            <button
              type="submit"
              disabled={guardandoPassword}
              className="bg-white/10 hover:bg-white/20 transition-colors px-6 py-2.5 rounded font-semibold disabled:opacity-50"
            >
              {guardandoPassword ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </form>
        </section>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          padding: 10px 14px;
          color: white;
          outline: none;
          transition: border-color 0.2s;
        }
        .input:focus {
          border-color: white;
        }
      `}</style>
    </main>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-nf-gray-light">{label}</span>
      {children}
    </label>
  );
}
