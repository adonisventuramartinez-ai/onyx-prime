import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

async function esAdmin(supabase: ReturnType<typeof crearClienteServidor>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes((user.email || "").toLowerCase());
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = crearClienteServidor();
  const { data, error } = await supabase
    .from("peliculas")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Película no encontrada" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = crearClienteServidor();

  if (!(await esAdmin(supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const camposPermitidos = ["titulo", "anio", "genero", "sinopsis", "caratula", "link_directo", "destacada"];
  const actualizacion: Record<string, unknown> = {};
  for (const campo of camposPermitidos) {
    if (campo in body) actualizacion[campo] = body[campo];
  }

  const { data, error } = await supabase
    .from("peliculas")
    .update(actualizacion)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = crearClienteServidor();

  if (!(await esAdmin(supabase))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { error } = await supabase.from("peliculas").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
