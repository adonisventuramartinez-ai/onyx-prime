import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ========================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// ========================================
const RUTAS_PUBLICAS = [
  "/",                                    // 👈 Página principal
  "/login",
  "/api/auth",
  "/api/scrapear-estrenos/worker",
  "/api/scrapear-estrenos",
  "/api/scrapear-estrenos/estado",
  "/api/buscar-cinecalidad",
  "/api/limpiar-link",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  
  // Verificar si la ruta es pública
  const esRutaPublica = RUTAS_PUBLICAS.some((ruta) => {
    if (ruta === "/") return pathname === "/";
    return pathname.startsWith(ruta);
  });

  // Redirigir a login si no está autenticado y la ruta no es pública
  if (!user && !esRutaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("siguiente", pathname);
    return NextResponse.redirect(url);
  }

  // Redirigir al home si está autenticado y va a login
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("siguiente");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
