import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Recuperación de contraseña (pedido de Martin, 2/10/2026): ambos pasos
  // tienen que ser públicos. "/recuperar-contrasena" porque todavía no hay
  // sesión cuando se pide el link, y "/actualizar-contrasena" porque la
  // sesión de recuperación que entrega Supabase llega por el fragmento (#)
  // de la URL y el middleware (server) no la ve en el primer request — si
  // esta ruta no fuera pública, se redirigiría a /login antes de que el
  // browser llegue a procesar esa sesión.
  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/recuperar-contrasena") ||
    request.nextUrl.pathname.startsWith("/actualizar-contrasena");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
