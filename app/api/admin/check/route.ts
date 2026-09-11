import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = crearClienteServidor();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isAdmin: false, email: null }, { status: 401 });
    }

    const admins = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const email = user.email?.toLowerCase() || "";
    const isAdmin = admins.includes(email);

    return NextResponse.json({ isAdmin, email: user.email });
  } catch (error) {
    console.error("Error en admin/check:", error);
    return NextResponse.json({ isAdmin: false, email: null }, { status: 500 });
  }
}
