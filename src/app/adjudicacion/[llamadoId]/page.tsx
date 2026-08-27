import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { guardarAdjudicacion, crearItemAdjudicacion, eliminarItemAdjudicacion } from "../actions";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-slate-500";

function formatMonto(monto: number | null, moneda: string) {
  if (monto === null || monto === undefined) return "—";
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "PYG",
    maximumFractionDigits: moneda === "USD" ? 2 : 0,
  }).format(monto);
}

function toDateInputValue(fecha: string | null) {
  if (!fecha) return "";
  return fecha.slice(0, 10);
}

type PageProps = { params: Promise<{ llamadoId: string }> };

export default async function AdjudicacionDetallePage({ params }: PageProps) {
  const { llamadoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: llamado, error } = await supabase
    .from("llamado")
    .select("id, nro_pac, nombre_llamado, objeto_llamado, moneda, monto_total")
    .eq("id", llamadoId)
    .single();

  if (error || !llamado) {
    notFound();
  }

  const { data: adjudicacion } = await supabase
    .from("adjudicacion")
    .select("id, nro_resolucion, monto_adjudicado, fecha_resolucion, fecha_notificacion, hubo_impugnacion")
    .eq("llamado_id", llamadoId)
    .maybeSingle();

  const [{ data: items }, { data: proveedores }] = await Promise.all([
    adjudicacion
      ? supabase
          .from("adjudicacion_item")
          .select("id, item_lote, monto_adjudicado, proveedor:proveedor_id(id, razon_social)")
          .eq("adjudicacion_id", adjudicacion.id)
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("proveedor").select("id, razon_social").eq("inhabilitado", false).order("razon_social"),
  ]);

  const guardarConId = guardarAdjudicacion.bind(null, llamadoId);
  const crearItemConId = adjudicacion ? crearItemAdjudicacion.bind(null, adjudicacion.id, llamadoId) : null;

  const totalItems = (items ?? []).reduce((acc, it) => acc + (it.monto_adjudicado ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/adjudicacion" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/adjudicacion" className="text-sm text-blue-600 hover:underline">
          ← Volver a Adjudicación
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">
          Adjudicación — N° PAC {llamado.nro_pac}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          {llamado.nombre_llamado || llamado.objeto_llamado} · Monto planificado:{" "}
          {formatMonto(llamado.monto_total, llamado.moneda)}
        </p>
      </header>

      <main className="space-y-6 p-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Datos de la adjudicación
          </h2>
          <form action={guardarConId} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>N° Resolución</label>
              <input
                name="nro_resolucion"
                defaultValue={adjudicacion?.nro_resolucion ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Monto adjudicado</label>
              <input
                name="monto_adjudicado"
                type="number"
                step="0.01"
                defaultValue={adjudicacion?.monto_adjudicado ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Fecha de resolución</label>
              <input
                name="fecha_resolucion"
                type="date"
                defaultValue={toDateInputValue(adjudicacion?.fecha_resolucion ?? null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Fecha de notificación</label>
              <input
                name="fecha_notificacion"
                type="date"
                defaultValue={toDateInputValue(adjudicacion?.fecha_notificacion ?? null)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  name="hubo_impugnacion"
                  type="checkbox"
                  defaultChecked={!!adjudicacion?.hubo_impugnacion}
                  className="rounded border-slate-300"
                />
                Hubo impugnación
              </label>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {adjudicacion ? "Guardar cambios" : "Crear adjudicación"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Ítems / lotes adjudicados
            </h2>
            {!adjudicacion && (
              <p className="text-xs text-slate-400">Primero cargá y guardá los datos de la adjudicación arriba.</p>
            )}
          </div>

          {adjudicacion && (
            <>
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Ítem / lote</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Proveedor</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">Monto</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items?.map((it) => {
                      const proveedor = it.proveedor as unknown as { id: string; razon_social: string } | null;
                      const eliminarConIds = eliminarItemAdjudicacion.bind(null, it.id, llamadoId);
                      return (
                        <tr key={it.id}>
                          <td className="px-3 py-2 text-slate-700">{it.item_lote ?? "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{proveedor?.razon_social ?? "—"}</td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {formatMonto(it.monto_adjudicado, llamado.moneda)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <form action={eliminarConIds}>
                              <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                                Eliminar
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                    {items?.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                          Todavía no hay ítems cargados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {items && items.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 font-medium">
                        <td className="px-3 py-2 text-slate-600" colSpan={2}>
                          Total
                        </td>
                        <td className="px-3 py-2 text-right text-slate-900">
                          {formatMonto(totalItems, llamado.moneda)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {crearItemConId && (
                <form action={crearItemConId} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className={labelClass}>Ítem / lote</label>
                    <input name="item_lote" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Proveedor *</label>
                    <select name="proveedor_id" required className={inputClass}>
                      <option value="">— Seleccionar —</option>
                      {proveedores?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.razon_social}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Monto</label>
                    <input name="monto_adjudicado" type="number" step="0.01" className={inputClass} />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      + Agregar ítem
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
