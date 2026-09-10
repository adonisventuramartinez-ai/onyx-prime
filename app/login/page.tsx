"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siguiente = searchParams.get("siguiente") || "/";

  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const supabase = crearClienteNavegador();

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    try {
      if (modo === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push(siguiente);
        router.refresh();
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre } },
        });
        if (err) throw err;
        setMensaje(
          "Cuenta creada. Si tu proyecto pide confirmar el correo, revisa tu bandeja de entrada antes de iniciar sesión."
        );
        setModo("login");
      }
    } catch (err: any) {
      setError(traducirError(err.message));
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 bg-nf-dark">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-nf-black via-nf-dark to-nf-dark" />
        <div className="absolute inset-x-0 top-0 sprocket-rule text-nf-gray opacity-20" />
      </div>

      <div className="absolute top-6 left-6 md:left-12">
        <span className="font-display italic text-2xl md:text-3xl tracking-tight text-nf-cream select-none">
          Onyx<span className="text-nf-red not-italic">.</span>
        </span>
      </div>

      <div className="relative z-10 w-full max-w-md bg-nf-surface/90 border border-white/10 rounded-sm p-8 md:p-12 space-y-6">
        <h1 className="font-display italic text-2xl md:text-3xl text-nf-cream">
          {modo === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>

        <form onSubmit={manejarSubmit} className="space-y-4">
          {modo === "registro" && (
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              className="login-input"
              required
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="login-input"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            minLength={6}
            className="login-input"
            required
          />

          {error && <p className="text-nf-garnet-hover text-sm">{error}</p>}
          {mensaje && <p className="text-green-500 text-sm">{mensaje}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-nf-red hover:bg-nf-red-hover text-nf-black transition-colors py-3 rounded-sm font-semibold disabled:opacity-50"
          >
            {cargando ? "Un momento..." : modo === "login" ? "Iniciar sesión" : "Registrarme"}
          </button>
        </form>

        <div className="text-nf-gray-light text-sm">
          {modo === "login" ? (
            <p>
              ¿Primera vez aquí?{" "}
              <button
                onClick={() => { setModo("registro"); setError(""); setMensaje(""); }}
                className="text-nf-cream hover:underline font-semibold"
              >
                Crea una cuenta
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => { setModo("login"); setError(""); setMensaje(""); }}
                className="text-nf-cream hover:underline font-semibold"
              >
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        .login-input {
          width: 100%;
          background: rgba(20, 18, 16, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 2px;
          padding: 14px 16px;
          color: #f3eee4;
          outline: none;
          transition: border-color 0.2s;
        }
        .login-input:focus {
          border-color: #d98e3b;
        }
        .login-input::placeholder {
          color: #948c7e;
        }
      `}</style>
    </main>
  );
}

function traducirError(msg: string) {
  if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (msg.includes("User already registered")) return "Ya existe una cuenta con ese correo.";
  if (msg.includes("Password should be")) return "La contraseña debe tener al menos 6 caracteres.";
  return msg;
}
