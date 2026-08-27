import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  guardarContrato,
  crearHitoContrato,
  eliminarHitoContrato,
  crearModificacionContrato,
  eliminarModificacionContrato,
  crearCertificacionPago,
  eliminarCertificacionPago,
} from "../actions";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-slate-500";

const ESTADOS_CONTRATO = ["Vigente", "Cerrado", "Liquidado"];
const ESTADOS_HITO = ["Pendiente", "Cumplido", "Vencido"];
const TIPOS_MODIFICACION = ["Ampliación", "Prórroga", "Evento compensable"];
const TIPOS_CERTIFICACION = ["Anticipo", "Certificación", "Retención"];

function toDateInputValue(fecha: string | null) {
  if (!fecha) return "";
  return fecha.slice(0, 10);
}

function formatMonto(monto: number | null) {
  if (monto === null || monto === undefined) return "—";
  return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(monto);
}

type PageProps = { params: Promise<{ llamadoId: string }> };

export default async function ContratoDetallePage({ params }: PageProps) {
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
    .select("id, nro_pac, nombre_llamado, objeto_llamado")
    .eq("id", llamadoId)
    .single();

  if (error || !llamado) {
    notFound();
  }

  const [{ data: adjudicacion }, { data: contrato }, { data: usuarios }] = await Promise.all([
    supabase.from("adjudicacion").select("id").eq("llamado_id", llamadoId).maybeSingle(),
    supabase
      .from("contrato")
      .select(
        "id, administrador_contrato, fecha_firma, fecha_orden_inicio, estado, nro_contrato_step, nro_contrato_mopc, codigo_contratacion_dncp, plazo, fecha_vencimiento"
      )
      .eq("llamado_id", llamadoId)
      .maybeSingle(),
    supabase.from("usuario").select("id, nombre").order("nombre"),
  ]);

  const [{ data: hitos }, { data: modificaciones }, { data: certificaciones }] = await Promise.all([
    contrato
      ? supabase
          .from("contrato_hito")
          .select("id, nombre, fecha_planificada, fecha_real, estado")
          .eq("contrato_id", contrato.id)
          .order("fecha_planificada")
      : Promise.resolve({ data: [] as never[] }),
    contrato
      ? supabase
          .from("contrato_modificacion")
          .select("id, tipo, fecha, detalle")
          .eq("contrato_id", contrato.id)
          .order("fecha")
      : Promise.resolve({ data: [] as never[] }),
    contrato
      ? supabase
          .from("contrato_certificacion_pago")
          .select("id, tipo, fecha, monto_devengado, monto_pagado")
          .eq("contrato_id", contrato.id)
          .order("fecha")
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const guardarConId = guardarContrato.bind(null, llamadoId, adjudicacion?.id ?? null);
  const crearHitoConId = contrato ? crearHitoContrato.bind(null, contrato.id, llamadoId) : null;
  const crearModificacionConId = contrato ? crearModificacionContrato.bind(null, contrato.id, llamadoId) : null;
  const crearCertificacionConId = contrato ? crearCertificacionPago.bind(null, contrato.id, llamadoId) : null;

  const totalDevengado = (certificaciones ?? []).reduce((acc, c) => acc + (c.monto_devengado ?? 0), 0);
  const totalPagado = (certificaciones ?? []).reduce((acc, c) => acc + (c.monto_pagado ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/contratos" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/contratos" className="text-sm text-blue-600 hover:underline">
          ← Volver a Gestión Contractual
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">
          Contrato — N° PAC {llamado.nro_pac}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          {llamado.nombre_llamado || llamado.objeto_llamado}
        </p>
        {!adjudicacion && (
          <p className="mt-2 text-xs text-amber-600">
            Este llamado todavía no tiene una adjudicación cargada — se puede cargar el contrato igual, pero
            conviene completar primero la Adjudicación para vincular ambos registros.
          </p>
        )}
      </header>

      <main className="space-y-6 p-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Datos del contrato
          </h2>
          <form action={guardarConId} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Administrador de contrato</label>
              <select
                name="administrador_contrato"
                defaultValue={contrato?.administrador_contrato ?? ""}
                className={inputClass}
              >
                <option value="">— Seleccionar —</option>
                {usuarios?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select name="estado" defaultValue={contrato?.estado ?? "Vigente"} className={inputClass}>
                {ESTADOS_CONTRATO.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha de firma</label>
              <input
                name="fecha_firma"
                type="date"
                defaultValue={toDateInputValue(contrato?.fecha_firma ?? null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Fecha de orden de inicio</label>
              <input
                name="fecha_orden_inicio"
                type="date"
                defaultValue={toDateInputValue(contrato?.fecha_orden_inicio ?? null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>N° Contrato STEP</label>
              <input name="nro_contrato_step" defaultValue={contrato?.nro_contrato_step ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>N° Contrato MOPC</label>
              <input name="nro_contrato_mopc" defaultValue={contrato?.nro_contrato_mopc ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Código de contratación DNCP</label>
              <input
                name="codigo_contratacion_dncp"
                defaultValue={contrato?.codigo_contratacion_dncp ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Plazo</label>
              <input name="plazo" defaultValue={contrato?.plazo ?? ""} className={inputClass} placeholder="ej. 180 días" />
            </div>
            <div>
              <label className={labelClass}>Fecha de vencimiento</label>
              <input
                name="fecha_vencimiento"
                type="date"
                defaultValue={toDateInputValue(contrato?.fecha_vencimiento ?? null)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {contrato ? "Guardar cambios" : "Crear contrato"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Hitos del contrato</h2>
            {!contrato && <p className="text-xs text-slate-400">Primero cargá y guardá los datos del contrato arriba.</p>}
          </div>

          {contrato && (
            <>
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Nombre</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Fecha planificada</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Fecha real</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Estado</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hitos?.map((h) => {
                      const eliminarConIds = eliminarHitoContrato.bind(null, h.id, llamadoId);
                      return (
                        <tr key={h.id}>
                          <td className="px-3 py-2 text-slate-700">{h.nombre}</td>
                          <td className="px-3 py-2 text-slate-600">{h.fecha_planificada ?? "—"}</td>
                          <td className="px-3 py-2 text-slate-600">{h.fecha_real ?? "—"}</td>
                          <td className="px-3 py-2 text-slate-600">{h.estado}</td>
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
                    {hitos?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                          Todavía no hay hitos cargados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {crearHitoConId && (
                <form action={crearHitoConId} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Nombre *</label>
                    <input name="nombre" required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Fecha planificada</label>
                    <input name="fecha_planificada" type="date" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Fecha real</label>
                    <input name="fecha_real" type="date" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Estado</label>
                    <select name="estado" defaultValue="Pendiente" className={inputClass}>
                      {ESTADOS_HITO.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-5 flex justify-end">
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      + Agregar hito
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Modificaciones</h2>

          {contrato && (
            <>
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Fecha</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Detalle</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modificaciones?.map((m) => {
                      const eliminarConIds = eliminarModificacionContrato.bind(null, m.id, llamadoId);
                      return (
                        <tr key={m.id}>
                          <td className="px-3 py-2 text-slate-700">{m.tipo}</td>
                          <td className="px-3 py-2 text-slate-600">{m.fecha}</td>
                          <td className="px-3 py-2 text-slate-600">{m.detalle ?? "—"}</td>
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
                    {modificaciones?.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                          Todavía no hay modificaciones cargadas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {crearModificacionConId && (
                <form action={crearModificacionConId} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className={labelClass}>Tipo *</label>
                    <select name="tipo" required defaultValue="" className={inputClass}>
                      <option value="" disabled>
                        — Seleccionar —
                      </option>
                      {TIPOS_MODIFICACION.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Fecha *</label>
                    <input name="fecha" type="date" required className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Detalle</label>
                    <input name="detalle" className={inputClass} />
                  </div>
                  <div className="sm:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      + Agregar modificación
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Certificaciones de pago
          </h2>

          {contrato && (
            <>
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Fecha</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">Monto devengado</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">Monto pagado</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certificaciones?.map((c) => {
                      const eliminarConIds = eliminarCertificacionPago.bind(null, c.id, llamadoId);
                      return (
                        <tr key={c.id}>
                          <td className="px-3 py-2 text-slate-700">{c.tipo}</td>
                          <td className="px-3 py-2 text-slate-600">{c.fecha}</td>
                          <td className="px-3 py-2 text-right text-slate-700">{formatMonto(c.monto_devengado)}</td>
                          <td className="px-3 py-2 text-right text-slate-700">{formatMonto(c.monto_pagado)}</td>
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
                    {certificaciones?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                          Todavía no hay certificaciones cargadas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {certificaciones && certificaciones.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 font-medium">
                        <td className="px-3 py-2 text-slate-600" colSpan={2}>
                          Total
                        </td>
                        <td className="px-3 py-2 text-right text-slate-900">{formatMonto(totalDevengado)}</td>
                        <td className="px-3 py-2 text-right text-slate-900">{formatMonto(totalPagado)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {crearCertificacionConId && (
                <form action={crearCertificacionConId} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className={labelClass}>Tipo *</label>
                    <select name="tipo" required defaultValue="" className={inputClass}>
                      <option value="" disabled>
                        — Seleccionar —
                      </option>
                      {TIPOS_CERTIFICACION.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Fecha *</label>
                    <input name="fecha" type="date" required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Monto devengado</label>
                    <input name="monto_devengado" type="number" step="0.01" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Monto pagado</label>
                    <input name="monto_pagado" type="number" step="0.01" className={inputClass} />
                  </div>
                  <div className="sm:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      + Agregar certificación
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
