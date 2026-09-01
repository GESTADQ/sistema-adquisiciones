"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

// Defensa en profundidad: además de las políticas RLS (usuario_update_admin_o_propio,
// que ya restringen la fila), esta Server Action verifica explícitamente que quien
// edita rol/activo de OTRO usuario sea Administrador antes de intentar el update —
// evita que la UI llegue a mostrar un error genérico de Postgres si alguien intenta
// forzar la acción sin ser admin.
async function verificarEsAdministrador() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: propio } = await supabase
    .from("usuario")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (propio?.rol !== "Administrador") {
    throw new Error("Solo un Administrador puede modificar usuarios.");
  }

  return supabase;
}

export async function actualizarUsuario(usuarioId: string, formData: FormData) {
  const supabase = await verificarEsAdministrador();

  const nombre = str(formData, "nombre");
  const rol = str(formData, "rol");
  const activo = formData.get("activo") === "on";

  if (!nombre) throw new Error("El nombre es obligatorio.");
  if (!rol) throw new Error("El rol es obligatorio.");

  const { error } = await supabase
    .from("usuario")
    .update({ nombre, rol, activo })
    .eq("id", usuarioId);

  if (error) throw new Error(error.message);

  revalidatePath("/administracion");
  redirect("/administracion");
}
