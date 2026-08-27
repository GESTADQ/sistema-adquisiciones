import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";

function formatMonto(monto: number | null, moneda: string) {
  if (monto === null || monto === undefined) return "—";
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "PYG",
    maximumFractionDigits: moneda === "USD" ? 2 : 0,
  }).format(monto);
}

export default async function AdjudicacionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: llamados, error }, { data: adjudicaciones }] = await Promise.all([
    supabase
      .from("llamado")
      .select("id, nro_pac, nro_step, nombre_llamado, objeto_llamado, moneda")
      .eq("estado_general", "Activo")
      .order("nro_pac"),
    supabase.from("adjudicacion").select("llamado_id, nro_resolucion, monto_adjudicado, fecha_resolucion"),
  ]);

  const adjudicacionPorLlamado = new Map((adjudicaciones ?? []).map((a) => [a.llamado_id, a]));

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/adjudicacion" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Adjudicación</h1>
        <p className="text-sm text-slate-500">
          {llamados?.length ?? 0} llamados activos · {adjudicaciones?.length ?? 0} con adjudicación cargada
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
                <th className="px-4 py-2 text-left font-medium text-slate-500">N° Resolución</th>
                <th className="px-4 py-2 text-right font-medium text-slate-500">Monto adjudicado</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Estado</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {llamados?.map((l) => {
                const adj = adjudicacionPorLlamado.get(l.id);
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900">{l.nro_pac}</td>
                    <td className="px-4 py-2 text-slate-700">{l.nombre_llamado || l.objeto_llamado}</td>
                    <td className="px-4 py-2 text-slate-600">{adj?.nro_resolucion ?? "—"}</td>
                    <td className="px-4 py-2 text-right text-slate-700">
                      {adj ? formatMonto(adj.monto_adjudicado, l.moneda) : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {adj ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Adjudicado
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/adjudicacion/${l.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {adj ? "Ver / editar" : "Cargar adjudicación"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
