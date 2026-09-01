import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PY", { dateStyle: "short", timeStyle: "short" });
}

export default async function AuditoriaPage() {
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

  const { data: registros, error } = esAdministrador
    ? await supabase
        .from("auditoria")
        .select("id, tabla_afectada, registro_id, accion, fecha, snapshot, usuario:usuario_id(nombre)")
        .order("fecha", { ascending: false })
        .limit(200)
    : { data: [], error: null };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/auditoria" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Auditoría</h1>
        <p className="text-sm text-slate-500">Historial de acciones registradas en el sistema</p>
      </header>

      <main className="p-6">
        {!esAdministrador && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Esta sección es solo para usuarios con rol Administrador.
          </div>
        )}

        {esAdministrador && (
          <>
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                No se pudo cargar el historial: {error.message}
              </div>
            )}

            {(registros ?? []).length === 0 && !error && (
              <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
                Todavía no hay registros de auditoría. Esta tabla no se completa automáticamente
                hoy — ningún módulo del sistema graba todavía una fila acá cuando se cancela o
                elimina algo. Queda pendiente decidir con Martin qué acciones deberían quedar
                registradas (por ejemplo, al eliminar un registro de forma irreversible) antes de
                empezar a cargarla.
              </div>
            )}

            {(registros ?? []).length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Fecha</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Tabla</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Acción</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Usuario</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(registros ?? []).map((r) => {
                      const usuario = r.usuario as unknown as { nombre: string } | null;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 align-top">
                          <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                            {formatFecha(r.fecha)}
                          </td>
                          <td className="px-4 py-2 font-medium text-slate-900">
                            {r.tabla_afectada}
                          </td>
                          <td className="px-4 py-2 text-slate-600">{r.accion}</td>
                          <td className="px-4 py-2 text-slate-600">{usuario?.nombre ?? "—"}</td>
                          <td className="px-4 py-2 text-slate-400 font-mono text-xs">
                            {r.registro_id}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
