import { createClient } from "@supabase/supabase-js";

// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.warn(
    "⚠️ Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY). " +
    "Configúralas en Vercel > Project Settings > Environment Variables."
  );
}

// ========================================
// CLIENTE ADMIN (para el servidor - API routes)
// ========================================
// Usamos un placeholder si faltan las variables para que el MÓDULO no
// tire toda la app abajo en el build/al arrancar (createClient lanza un
// error inmediato si la URL viene vacía). Si de verdad faltan las
// variables reales, las llamadas a Supabase fallarán con un error claro
// en runtime en vez de un crash silencioso en todas las rutas.
export const supabaseAdmin = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_SECRET || "placeholder",
  { auth: { persistSession: false } }
);

// ========================================
// CLIENTE PARA EL NAVEGADOR
// ========================================
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);

// ========================================
// BUCKET PARA ALMACENAMIENTO
// ========================================
export const BUCKET = "archivos-programados";

// ========================================
// TIPOS
// ========================================
export type Pelicula = {
  id: string;
  titulo: string;
  anio: number;
  genero: string;
  sinopsis: string;
  caratula: string;
  link_directo: string;
  fuente: "manual" | "auto";
  destacada?: boolean;
  creado_en: string;
};

export type Favorito = {
  id: string;
  usuario_id: string;
  pelicula_id: string;
  creado_en: string;
};

export type Historial = {
  id: string;
  usuario_id: string;
  pelicula_id: string;
  visto_en: string;
};

// ========================================
// CONSTANTES
// ========================================
export const CARATULA_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23222222'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='%23808080' text-anchor='middle' dy='.3em'%3ESin imagen%3C/text%3E%3C/svg%3E";
