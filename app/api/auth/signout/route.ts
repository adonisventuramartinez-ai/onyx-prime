import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function POST() {
  const supabase = crearClienteServidor();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
