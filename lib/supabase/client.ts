import { createBrowserClient } from "@supabase/ssr";

export function crearClienteNavegador() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Faltan variables de entorno de Supabase en el navegador");
    // Devolver un cliente dummy para evitar que la app se rompa
    return createBrowserClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
