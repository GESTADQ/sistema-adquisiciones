import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la service_role key — bypasea RLS por completo. SOLO se usa
// server-side, y SOLO dentro de Server Actions que ya verificaron
// explícitamente (antes de llamar a esto) que quien invoca es Administrador.
// Nunca importar este archivo desde un componente cliente ni exponer
// SUPABASE_SERVICE_ROLE_KEY con el prefijo NEXT_PUBLIC_.
//
// La key se carga desde una variable de entorno que Martin tiene que cargar
// él mismo en Vercel (Project Settings → Environment Variables) — Claude no
// la escribe nunca, ni acá ni en Vercel, por regla de seguridad fija.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
