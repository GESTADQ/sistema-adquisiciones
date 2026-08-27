import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default async function DocumentosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: llamados, error }, { data: documentos }] = await Promise.all([
    supabase.from("llamado").select("id, nro_pac, nombre_llamado, objeto_llamado").order("nro_pac"),
    supabase.from("documento").select("llamado_id"),
  ]);

  const cantidadPorLlamado = new Map<string, number>();
  for (const d of documentos ?? []) {
    cantidadPorLlamado.set(d.llamado_id, (cantidadPorLlamado.get(d.llamado_id) ?? 0) + 1);
  }

  const filas = (llamados ?? []).sort((a, b) =>
    a.nro_pac.localeCompare(b.nro_pac, undefined, { numeric: true })
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/documentos" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Documentos / Expediente</h1>
        <p className="text-sm text-slate-500">
          {filas.length} llamados · {documentos?.length ?? 0} documentos cargados
        </p>
      </header>

      <main className="p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No se pudo cargar el listado: {error.message}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">N° PAC</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Objeto</th>
                <th className="px-4 py-2 text-right font-medium text-slate-500">Documentos</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((llamado) => {
                const cantidad = cantidadPorLlamado.get(llamado.id) ?? 0;
                return (
                  <tr key={llamado.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900">{llamado.nro_pac}</td>
                    <td className="px-4 py-2 text-slate-700">
                      {llamado.nombre_llamado || llamado.objeto_llamado}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      {cantidad > 0 ? (
                        cantidad
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/documentos/${llamado.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Ver / cargar
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Todavía no hay llamados cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
