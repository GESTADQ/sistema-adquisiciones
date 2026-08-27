import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default async function ContratosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: adjudicaciones, error }, { data: contratos }] = await Promise.all([
    supabase
      .from("adjudicacion")
      .select("id, llamado_id, llamado:llamado_id(id, nro_pac, nombre_llamado, objeto_llamado)")
      .order("llamado_id"),
    supabase.from("contrato").select("llamado_id, estado, nro_contrato_step, nro_contrato_mopc, fecha_vencimiento"),
  ]);

  const contratoPorLlamado = new Map((contratos ?? []).map((c) => [c.llamado_id, c]));

  const filas = (adjudicaciones ?? [])
    .map((a) => {
      const llamado = a.llamado as unknown as { id: string; nro_pac: string; nombre_llamado: string | null; objeto_llamado: string | null } | null;
      return llamado ? { adjudicacionId: a.id, llamado } : null;
    })
    .filter((f): f is { adjudicacionId: string; llamado: { id: string; nro_pac: string; nombre_llamado: string | null; objeto_llamado: string | null } } => f !== null)
    .sort((x, y) => x.llamado.nro_pac.localeCompare(y.llamado.nro_pac, undefined, { numeric: true }));

  const estadoBadge = (estado: string) => {
    const clases: Record<string, string> = {
      Vigente: "bg-emerald-100 text-emerald-800",
      Cerrado: "bg-slate-100 text-slate-600",
      Liquidado: "bg-blue-100 text-blue-800",
    };
    return clases[estado] ?? "bg-slate-100 text-slate-600";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/contratos" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Gestión Contractual</h1>
        <p className="text-sm text-slate-500">
          {filas.length} llamados adjudicados · {contratos?.length ?? 0} con contrato cargado
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
                <th className="px-4 py-2 text-left font-medium text-slate-500">N° Contrato STEP</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">N° Contrato MOPC</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Vencimiento</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Estado</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map(({ llamado }) => {
                const c = contratoPorLlamado.get(llamado.id);
                return (
                  <tr key={llamado.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900">{llamado.nro_pac}</td>
                    <td className="px-4 py-2 text-slate-700">{llamado.nombre_llamado || llamado.objeto_llamado}</td>
                    <td className="px-4 py-2 text-slate-600">{c?.nro_contrato_step ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{c?.nro_contrato_mopc ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{c?.fecha_vencimiento ?? "—"}</td>
                    <td className="px-4 py-2">
                      {c ? (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${estadoBadge(c.estado)}`}>
                          {c.estado}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Sin contrato
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/contratos/${llamado.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {c ? "Ver / editar" : "Cargar contrato"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    Todavía no hay llamados adjudicados.
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
