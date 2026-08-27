import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";

function formatMonto(monto: number) {
  return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 }).format(monto);
}

const ETAPAS = ["Estimado", "Comprometido", "Devengado", "Pagado"] as const;

export default async function FinancieroPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: llamados, error }, { data: movimientos }] = await Promise.all([
    supabase
      .from("llamado")
      .select("id, nro_pac, nombre_llamado, objeto_llamado, monto_estimado_usd, monto_total, moneda")
      .order("nro_pac"),
    supabase.from("movimiento_financiero").select("llamado_id, etapa, monto"),
  ]);

  const totalesPorLlamado = new Map<string, Record<string, number>>();
  for (const m of movimientos ?? []) {
    const acc = totalesPorLlamado.get(m.llamado_id) ?? {};
    acc[m.etapa] = (acc[m.etapa] ?? 0) + Number(m.monto);
    totalesPorLlamado.set(m.llamado_id, acc);
  }

  const filas = (llamados ?? []).sort((a, b) =>
    a.nro_pac.localeCompare(b.nro_pac, undefined, { numeric: true })
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/financiero" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Financiero</h1>
        <p className="text-sm text-slate-500">
          {filas.length} llamados · {movimientos?.length ?? 0} movimientos registrados
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
                {ETAPAS.map((e) => (
                  <th key={e} className="px-4 py-2 text-right font-medium text-slate-500">
                    {e}
                  </th>
                ))}
                <th className="px-4 py-2 text-left font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((llamado) => {
                const totales = totalesPorLlamado.get(llamado.id) ?? {};
                return (
                  <tr key={llamado.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900">{llamado.nro_pac}</td>
                    <td className="px-4 py-2 text-slate-700">
                      {llamado.nombre_llamado || llamado.objeto_llamado}
                    </td>
                    {ETAPAS.map((e) => (
                      <td key={e} className="px-4 py-2 text-right text-slate-600">
                        {totales[e] ? formatMonto(totales[e]) : "—"}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/financiero/${llamado.id}`}
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
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
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
