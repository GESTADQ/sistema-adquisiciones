import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { crearLineaPresupuestaria, eliminarLineaPresupuestaria } from "../actions";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-slate-500";

function formatMonto(monto: number | null, moneda: string) {
  if (monto === null || monto === undefined) return "—";
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "PYG",
    maximumFractionDigits: moneda === "USD" ? 2 : 0,
  }).format(monto);
}

function formatFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-PY", { dateStyle: "medium" }).format(new Date(fecha));
}

const ESTADO_COLOR: Record<string, string> = {
  "Bajo Revisión": "bg-amber-100 text-amber-800",
  Cancelado: "bg-red-100 text-red-800",
  "Ejecución Pendiente": "bg-slate-100 text-slate-700",
  "Pendiente de Implementación": "bg-slate-100 text-slate-700",
  "En Ejecución": "bg-blue-100 text-blue-800",
  Firmado: "bg-emerald-100 text-emerald-800",
  "No incluido": "bg-slate-100 text-slate-500",
};

function EstadoBadge({ estado }: { estado: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        ESTADO_COLOR[estado ?? ""] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {estado ?? "Sin definir"}
    </span>
  );
}

function cronogramaEstado(etapa: {
  fecha_original: string | null;
  fecha_revisada: string | null;
  fecha_real: string | null;
}) {
  if (etapa.fecha_real) return { label: "Cumplido", color: "bg-emerald-100 text-emerald-800" };
  const fechaControl = etapa.fecha_revisada ?? etapa.fecha_original;
  if (fechaControl && new Date(fechaControl) < new Date()) {
    return { label: "Vencido", color: "bg-red-100 text-red-800" };
  }
  if (fechaControl) return { label: "Pendiente", color: "bg-slate-100 text-slate-700" };
  return { label: "Sin fecha", color: "bg-slate-100 text-slate-500" };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function LlamadoDetallePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: llamado, error } = await supabase
    .from("llamado")
    .select(
      `id, nro_pac, nro_step, objeto_llamado, nombre_llamado, moneda, plurianualidad, ad_referendum,
       monto_total, monto_estimado_usd, tipo_revision, estado_step, estado_actividad_step,
       apertura_mercado, ambito_mercado, estado_general, fecha_estimada_llamado,
       situacion_actual, etapa_interna_actual, ultimo_seguimiento, proxima_accion, observaciones,
       modalidad:modalidad_id(nombre, organismo_financiador),
       componente:componente_id(nombre, subcomponente),
       uoc:uoc_id(entidad, uoc, sub_uoc)`
    )
    .eq("id", id)
    .single();

  if (error || !llamado) {
    notFound();
  }

  const [{ data: lineas }, { data: cronograma }, { data: objetosGasto }] = await Promise.all([
    supabase
      .from("llamado_linea_presupuestaria")
      .select(
        "id, programa, proyecto_actividad, sgog, fuente_financiamiento, organismo_financiador, departamento, monto, ejercicio_fiscal, estructura_presupuestaria, objeto_gasto:objeto_gasto_id(codigo, descripcion)"
      )
      .eq("llamado_id", id)
      .order("ejercicio_fiscal"),
    supabase
      .from("cronograma_etapa")
      .select("id, etapa_nombre, orden, fase, fecha_original, fecha_revisada, fecha_real, nro_memo, nro_nota, detalle")
      .eq("llamado_id", id)
      .order("orden"),
    supabase.from("objeto_gasto").select("id, codigo, descripcion").order("codigo"),
  ]);

  const crearLineaConId = crearLineaPresupuestaria.bind(null, id);

  const modalidad = llamado.modalidad as unknown as { nombre: string; organismo_financiador: string } | null;
  const componente = llamado.componente as unknown as { nombre: string; subcomponente: string | null } | null;
  const uoc = llamado.uoc as unknown as { entidad: string; uoc: string; sub_uoc: string | null } | null;

  const totalLineas = (lineas ?? []).reduce((acc, l) => acc + (l.monto ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/planificacion" className="text-sm text-blue-600 hover:underline">
          ← Volver al Plan de Adquisiciones
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              N° PAC {llamado.nro_pac} {llamado.nro_step ? `· STEP ${llamado.nro_step}` : ""}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              {llamado.nombre_llamado || llamado.objeto_llamado}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <EstadoBadge estado={llamado.estado_step} />
            <Link
              href={`/planificacion/${id}/editar`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Editar
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-6 p-6">
        {/* Datos generales */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Datos generales
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo label="Objeto del llamado" valor={llamado.objeto_llamado} />
            <Campo label="Modalidad" valor={modalidad?.nombre} />
            <Campo label="Organismo financiador" valor={modalidad?.organismo_financiador} />
            <Campo label="Componente" valor={componente?.nombre} />
            <Campo label="Subcomponente" valor={componente?.subcomponente} />
            <Campo label="UOC" valor={uoc ? `${uoc.entidad} / ${uoc.uoc}${uoc.sub_uoc ? ` / ${uoc.sub_uoc}` : ""}` : undefined} />
            <Campo label="Monto total" valor={formatMonto(llamado.monto_total, llamado.moneda)} />
            {llamado.monto_estimado_usd && (
              <Campo label="Monto estimado (USD)" valor={formatMonto(llamado.monto_estimado_usd, "USD")} />
            )}
            <Campo label="Fecha estimada del llamado" valor={formatFecha(llamado.fecha_estimada_llamado)} />
            <Campo label="Estado general" valor={llamado.estado_general} />
            <Campo label="Estado STEP" valor={llamado.estado_step ?? "Sin definir"} />
            <Campo label="Estado actividad STEP" valor={llamado.estado_actividad_step} />
            <Campo label="Tipo de revisión" valor={llamado.tipo_revision} />
            <Campo label="Ámbito de mercado" valor={llamado.ambito_mercado} />
            <Campo label="Apertura de mercado" valor={llamado.apertura_mercado} />
            <Campo label="Plurianual" valor={llamado.plurianualidad ? "Sí" : "No"} />
            <Campo label="Ad referéndum" valor={llamado.ad_referendum ? "Sí" : "No"} />
          </dl>
        </section>

        {/* Seguimiento interno */}
        {(llamado.situacion_actual || llamado.etapa_interna_actual || llamado.proxima_accion || llamado.observaciones) && (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Seguimiento interno
            </h2>
            <p className="mb-3 text-xs text-slate-400">
              Bitácora manual del equipo — no alimenta el motor de alertas del Cronograma de Etapas.
            </p>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Situación actual" valor={llamado.situacion_actual} />
              <Campo label="Etapa interna actual" valor={llamado.etapa_interna_actual} />
              <Campo label="Último seguimiento" valor={formatFecha(llamado.ultimo_seguimiento)} />
              <Campo label="Próxima acción" valor={llamado.proxima_accion} />
              {llamado.observaciones && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500">Observaciones</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{llamado.observaciones}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Líneas presupuestarias */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Líneas presupuestarias
            </h2>
            <span className="text-sm text-slate-500">
              {lineas?.length ?? 0} línea{(lineas?.length ?? 0) === 1 ? "" : "s"} · Total{" "}
              {formatMonto(totalLineas, llamado.moneda)}
            </span>
          </div>
          {!lineas || lineas.length === 0 ? (
            <p className="text-sm text-slate-500">Este llamado no tiene líneas presupuestarias cargadas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Ejercicio</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Programa</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Proyecto/Actividad</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">SGOG</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Objeto del gasto</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Fuente financ.</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Departamento</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Estructura presupuestaria</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-500">Monto</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineas.map((l) => {
                    const objetoGasto = l.objeto_gasto as unknown as { codigo: string; descripcion: string } | null;
                    const eliminarConIds = eliminarLineaPresupuestaria.bind(null, l.id, id);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{l.ejercicio_fiscal ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{l.programa ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{l.proyecto_actividad ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{l.sgog ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {objetoGasto ? `${objetoGasto.codigo} · ${objetoGasto.descripcion}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{l.fuente_financiamiento ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{l.departamento ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-500">{l.estructura_presupuestaria ?? "—"}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {formatMonto(l.monto, llamado.moneda)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <form action={eliminarConIds}>
                            <button type="submit" className="text-xs text-red-600 hover:underline">
                              Eliminar
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <details className="mt-4 rounded-md border border-slate-200">
            <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-blue-600">
              + Agregar línea presupuestaria
            </summary>
            <form action={crearLineaConId} className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Ejercicio fiscal</label>
                <input name="ejercicio_fiscal" type="number" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Programa</label>
                <input name="programa" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Proyecto/Actividad</label>
                <input name="proyecto_actividad" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>SGOG</label>
                <input name="sgog" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Objeto del gasto</label>
                <select name="objeto_gasto_id" className={inputClass} defaultValue="">
                  <option value="">— Sin definir —</option>
                  {objetosGasto?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.codigo} · {o.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fuente de financiamiento</label>
                <input name="fuente_financiamiento" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Organismo financiador</label>
                <input name="organismo_financiador" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Departamento</label>
                <input name="departamento" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Estructura presupuestaria (SIAF)</label>
                <input name="estructura_presupuestaria" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Monto *</label>
                <input name="monto" type="number" step="0.01" required className={inputClass} />
              </div>
              <div className="flex items-end sm:col-span-3">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Agregar línea
                </button>
              </div>
            </form>
          </details>
        </section>

        {/* Cronograma de etapas */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Cronograma de Etapas
          </h2>
          {!cronograma || cronograma.length === 0 ? (
            <p className="text-sm text-slate-500">Este llamado todavía no tiene etapas cargadas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Etapa</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Fase</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Fecha original</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Fecha revisada</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Fecha real</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Estado</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cronograma.map((e) => {
                    const estado = cronogramaEstado(e);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">{e.etapa_nombre}</td>
                        <td className="px-3 py-2 text-slate-600">{e.fase}</td>
                        <td className="px-3 py-2 text-slate-600">{formatFecha(e.fecha_original)}</td>
                        <td className="px-3 py-2 text-slate-600">{formatFecha(e.fecha_revisada)}</td>
                        <td className="px-3 py-2 text-slate-600">{formatFecha(e.fecha_real)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${estado.color}`}>
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {[e.nro_memo, e.nro_nota].filter(Boolean).join(" / ") || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{valor || "—"}</dd>
    </div>
  );
}
