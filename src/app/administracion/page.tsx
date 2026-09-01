import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { DESCRIPCION_ROL, type RolUsuario } from "@/lib/rolesUsuario";

export default async function AdministracionPage() {
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

  const esAdministrador = propio?.rol === "Administrador";

  const { data: usuarios, error } = await supabase
    .from("usuario")
    .select("id, nombre, email, rol, activo, creado_en")
    .order("nombre");

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/administracion" />
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Administración y Seguridad</h1>
          <p className="text-sm text-slate-500">Usuarios del sistema y sus roles</p>
        </div>
        {esAdministrador && (
          <Link
            href="/administracion/nuevo"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nuevo usuario
          </Link>
        )}
      </header>

      <main className="p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No se pudo cargar el listado: {error.message}
          </div>
        )}

        {!esAdministrador && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Solo los usuarios con rol Administrador pueden ver y editar la lista completa de
            usuarios. Vos ves únicamente tu propio usuario.
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Nombre</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Email</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Rol</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Estado</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(usuarios ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{u.nombre}</td>
                  <td className="px-4 py-2 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {DESCRIPCION_ROL[u.rol as RolUsuario] ?? u.rol}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.activo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {esAdministrador && (
                      <Link
                        href={`/administracion/${u.id}/editar`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {(usuarios ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {esAdministrador && (
          <p className="mt-4 text-sm text-slate-500">
            "+ Nuevo usuario" manda una invitación por email — la persona invitada elige su
            propia contraseña siguiendo el link del mail; recién ahí queda activo el usuario.
          </p>
        )}
      </main>
    </div>
  );
}
