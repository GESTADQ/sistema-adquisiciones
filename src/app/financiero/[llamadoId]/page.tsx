import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { crearMovimiento, eliminarMovimiento } from "../actions";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

const ETAPAS = ["Estimado", "Comprometido", "Devengado", "Pagado"] as const;

const ETAPA_COLOR: Record<string, string> = {
  Estimado: "bg-slate-100 text-slate-700",
  Comprometido: "bg-amber-100 text-amber-800",
  Devengado: "bg-blue-100 text-blue-800",
  Pagado: "bg-emerald-100 text-emerald-800",
};

function formatMonto(monto: number) {
  return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 }).format(monto);
}

export default async function FinancieroDetallePage({
  params,
}: {
  params: Promise<{ llamadoId: string }>;
}) {
  const { llamadoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: llamado } = await supabase
    .from("llamado")
    .select("id, nro_pac, nombre_llamado, objeto_llamado, monto_estimado_usd, monto_total, moneda, componente_id")
    .eq("id", llamadoId)
    .maybeSingle();

  if (!llamado) {
    notFound();
  }

  const [{ data: movimientos, error }, { data: objetosGasto }, { data: componentes }] = await Promise.all([
    supabase
      .from("movimiento_financiero")
      .select(
        "id, etapa, monto, fecha, referencia, objeto_gasto:objeto_gasto_id(id, codigo, descripcion), componente:componente_id(id, codigo, nombre)"
      )
      .eq("llamado_id", llamadoId)
      .order("fecha", { ascending: false }),
    supabase.from("objeto_gasto").select("id, codigo, descripcion").order("codigo"),
    supabase.from("componente_proyecto").select("id, codigo, nombre").order("codigo"),
  ]);

  const totales: Record<string, number> = {};
  for (const m of movimientos ?? []) {
    totales[m.etapa] = (totales[m.etapa] ?? 0) + Number(m.monto);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/financiero" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/financiero" className="text-sm text-blue-600 hover:underline">
          ← Volver a Financiero
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          {llamado.nro_pac} — {llamado.nombre_llamado || llamado.objeto_llamado}
        </h1>
        <p className="text-sm text-slate-500">
          Estimado en Planificación: {llamado.monto_estimado_usd ? `USD ${formatMonto(llamado.monto_estimado_usd)}` : "—"}
          {" · "}
          Monto total: {llamado.monto_total ? `${llamado.moneda ?? ""} ${formatMonto(llamado.monto_total)}` : "—"}
        </p>
      </header>

      <main className="space-y-6 p-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No se pudo cargar el historial financiero: {error.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ETAPAS.map((e) => (
            <div key={e} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-slate-500">{e}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {totales[e] ? formatMonto(totales[e]) : "—"}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Movimientos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Etapa</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Fecha</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-500">Monto</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Objeto de gasto</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Componente</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Referencia</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(movimientos ?? []).map((m) => {
                  const objetoGasto = m.objeto_gasto as unknown as { codigo: string; descripcion: string } | null;
                  const componente = m.componente as unknown as { codigo: string; nombre: string } | null;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ETAPA_COLOR[m.etapa] ?? "bg-slate-100 text-slate-600"}`}>
                          {m.etapa}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-600">{m.fecha}</td>
                      <td className="px-4 py-2 text-right text-slate-900">{formatMonto(Number(m.monto))}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {objetoGasto ? `${objetoGasto.codigo} — ${objetoGasto.descripcion}` : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{componente ? componente.nombre : "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{m.referencia ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <form action={eliminarMovimiento.bind(null, m.id, llamadoId)}>
                          <button type="submit" className="text-sm text-red-600 hover:underline">
                            Eliminar
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {(movimientos ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                      Todavía no hay movimientos cargados para este llamado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form action={crearMovimiento.bind(null, llamadoId)} className="grid grid-cols-1 gap-4 border-t border-slate-200 p-4 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className={labelClass}>Etapa</label>
              <select name="etapa" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Seleccionar…
                </option>
                {ETAPAS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha</label>
              <input type="date" name="fecha" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Monto</label>
              <input type="number" step="0.01" name="monto" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Objeto de gasto</label>
              <select name="objeto_gasto_id" className={inputClass} defaultValue="">
                <option value="">—</option>
                {(objetosGasto ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.codigo} — {o.descripcion}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Componente</label>
              <select name="componente_id" className={inputClass} defaultValue={llamado.componente_id ?? ""}>
                <option value="">—</option>
                {(componentes ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Referencia</label>
              <input type="text" name="referencia" className={inputClass} placeholder="N° comprobante, etc." />
            </div>
            <div className="sm:col-span-3 lg:col-span-6">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Agregar movimiento
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
