"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ROLES_USUARIO } from "@/lib/rolesUsuario";

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

// Alta de usuario nuevo. Usa el cliente admin (service_role) para crear el
// usuario en Supabase Auth vía invitación por email — la persona nueva pone
// su propia contraseña siguiendo el link del mail, nunca pasa por acá una
// contraseña en texto plano. Recién cuando el alta en Auth confirma un id,
// se inserta la fila correspondiente en public.usuario (que es la que exige
// la FK usuario.id → auth.users.id).
export async function crearUsuario(formData: FormData) {
  await verificarEsAdministrador();

  const nombre = str(formData, "nombre");
  const email = str(formData, "email");
  const rol = str(formData, "rol");

  if (!nombre) throw new Error("El nombre es obligatorio.");
  if (!email) throw new Error("El email es obligatorio.");
  if (!rol || !ROLES_USUARIO.includes(rol as (typeof ROLES_USUARIO)[number])) {
    throw new Error("El rol es obligatorio.");
  }

  const admin = createAdminClient();

  const { data: invitado, error: errorInvite } = await admin.auth.admin.inviteUserByEmail(email);

  if (errorInvite || !invitado?.user) {
    throw new Error(
      errorInvite?.message ?? "No se pudo enviar la invitación en Supabase Auth."
    );
  }

  const { error: errorInsert } = await admin
    .from("usuario")
    .insert({ id: invitado.user.id, nombre, email, rol, activo: true });

  if (errorInsert) {
    // Si falla la carga de la fila en public.usuario, no dejamos un usuario
    // de Auth huérfano sin fila correspondiente.
    await admin.auth.admin.deleteUser(invitado.user.id);
    throw new Error(errorInsert.message);
  }

  revalidatePath("/administracion");
  redirect("/administracion");
}
