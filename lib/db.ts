import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  throw new Error("Faltan variables de entorno de Supabase");
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { persistSession: false },
});
