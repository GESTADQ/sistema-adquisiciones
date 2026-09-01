import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { crearUsuario } from "../actions";
import { ROLES_USUARIO, DESCRIPCION_ROL } from "@/lib/rolesUsuario";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default async function NuevoUsuarioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: propio } = await supabase
    .from("usuario")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (propio?.rol !== "Administrador") {
    redirect("/administracion");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/administracion" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/administracion" className="text-sm text-blue-600 hover:underline">
          ← Volver a Administración y Seguridad
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">Nuevo usuario</h1>
      </header>

      <main className="p-6">
        <form
          action={crearUsuario}
          className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-6"
        >
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" name="nombre" required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" name="email" required className={inputClass} />
            <p className="mt-1 text-xs text-slate-400">
              Le va a llegar un mail de invitación de Supabase para que elija su propia
              contraseña — no se genera ninguna contraseña desde acá.
            </p>
          </div>

          <div>
            <label className={labelClass}>Rol</label>
            <select name="rol" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Seleccionar...
              </option>
              {ROLES_USUARIO.map((r) => (
                <option key={r} value={r}>
                  {DESCRIPCION_ROL[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/administracion"
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Enviar invitación
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
