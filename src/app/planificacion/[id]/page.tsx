import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  crearLineaPresupuestaria,
  eliminarLineaPresupuestaria,
  crearEtapaCronograma,
  actualizarEtapaCronograma,
  eliminarEtapaCronograma,
  crearHito,
  actualizarHito,
  eliminarHito,
  crearMontoEjercicio,
  eliminarMontoEjercicio,
  crearCodigoCatalogoDetalle,
  eliminarCodigoCatalogoDetalle,
} from "../actions";
import { HITOS_POR_CATEGORIA, esCategoriaLlamadoValida } from "@/lib/hitosStep";
import AppNav from "@/components/AppNav";
import { formatIdentificadorLlamado } from "@/lib/identificadorLlamado";
import { DEPARTAMENTOS, valorDepartamento } from "@/lib/departamentos";

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

function toDateInputValue(fecha: string | null) {
  if (!fecha) return "";
  return fecha.slice(0, 10);
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
      `id, nro_pac, nro_proceso_interno, nro_step, objeto_llamado, nombre_llamado, moneda, plurianualidad, ad_referendum,
       monto_total, monto_estimado_usd, tipo_revision, estado_step, estado_actividad_step,
       apertura_mercado, ambito_mercado, estado_general, fecha_estimada_llamado,
       situacion_actual, etapa_interna_actual, ultimo_seguimiento, proxima_accion, observaciones,
       categoria_llamado, categoria_inversion, tipo_cambio, precalificacion, proceso_contratacion,
       opciones_evaluacion, riesgo_esas, tipo_documento_contratacion, requisitos_calificacion,
       nivel_entidad, entidad, uoc_uep, sub_uoc, unidad_jerarquica, codigo_sicp,
       nro_referencia_step, categoria_step, metodo_adquisicion_step, componente_step,
       numero_etapas, numero_sobres, descripcion_step, descripcion_step_sincronizada,
       modalidad:modalidad_id(nombre, organismo_financiador),
       componente:componente_id(nombre, subcomponente),
       uoc:uoc_id(entidad, uoc, sub_uoc),
       objeto_gasto:objeto_gasto_id(codigo, descripcion)`
    )
    .eq("id", id)
    .single();

  if (error || !llamado) {
    notFound();
  }

  const [
    { data: lineas },
    { data: cronograma },
    { data: usuarios },
    { data: hitos },
    { data: objetosGasto },
    { data: montosEjercicio },
    { data: codigoCatalogoDetalle },
  ] = await Promise.all([
      supabase
        .from("llamado_linea_presupuestaria")
        .select(
          "id, clase, programa, subprograma, proyecto_actividad, sgog, objeto_gasto_id, objeto_gasto:objeto_gasto_id(codigo, descripcion), fuente_financiamiento, organismo_financiador, departamento, cuenta, monto, ejercicio_fiscal"
        )
        .eq("llamado_id", id)
        .order("ejercicio_fiscal"),
      supabase
        .from("cronograma_etapa")
        .select(
          "id, etapa_nombre, orden, fase, fecha_original, fecha_revisada, fecha_real, responsable:responsable(id, nombre), nro_memo, nro_nota, detalle"
        )
        .eq("llamado_id", id)
        .order("orden"),
      supabase.from("usuario").select("id, nombre").order("nombre"),
      supabase.from("llamado_hito").select("id, tipo_hito, fecha_planificada, fecha_real").eq("llamado_id", id),
      supabase.from("objeto_gasto").select("id, codigo, descripcion").order("codigo"),
      supabase
        .from("llamado_monto_ejercicio")
        .select("id, ejercicio_fiscal, monto")
        .eq("llamado_id", id)
        .order("ejercicio_fiscal"),
      supabase
        .from("pac_codigo_catalogo_detalle")
        .select("id, codigo, descripcion, monto, orden")
        .eq("llamado_id", id)
        .order("orden"),
    ]);

  const crearLineaConId = crearLineaPresupuestaria.bind(null, id);
  const crearEtapaConId = crearEtapaCronograma.bind(null, id);
  const crearMontoEjercicioConId = crearMontoEjercicio.bind(null, id);
  const crearCodigoCatalogoConId = crearCodigoCatalogoDetalle.bind(null, id);

  const totalMontosEjercicio = (montosEjercicio ?? []).reduce((acc, m) => acc + (m.monto ?? 0), 0);
  const totalCodigoCatalogo = (codigoCatalogoDetalle ?? []).reduce((acc, c) => acc + (c.monto ?? 0), 0);

  const catalogoHitos = esCategoriaLlamadoValida(llamado.categoria_llamado)
    ? HITOS_POR_CATEGORIA[llamado.categoria_llamado]
    : null;
  const hitosPorTipo = new Map((hitos ?? []).map((h) => [h.tipo_hito, h]));

  const modalidad = llamado.modalidad as unknown as { nombre: string; organismo_financiador: string } | null;
  const componente = llamado.componente as unknown as { nombre: string; subcomponente: string | null } | null;
  const uoc = llamado.uoc as unknown as { entidad: string; uoc: string; sub_uoc: string | null } | null;
  const objetoGasto = llamado.objeto_gasto as unknown as { codigo: string; descripcion: string } | null;

  const totalLineas = (lineas ?? []).reduce((acc, l) => acc + (l.monto ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/planificacion" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/planificacion" className="text-sm text-blue-600 hover:underline">
          ← Volver al Plan de Adquisiciones
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {formatIdentificadorLlamado(llamado.nro_proceso_interno, llamado.nro_pac)}
              {llamado.nro_step ? ` · STEP ${llamado.nro_step}` : ""}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              {llamado.nombre_llamado || llamado.objeto_llamado}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <EstadoBadge estado={llamado.estado_step} />
            <a
              href={`/api/reportes/pac/${id}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Descargar PAC (XLSX)
            </a>
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
            <Campo label="Modalidad/Método" valor={modalidad?.nombre} />
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
            <Campo label="Requisitos de Calificación" valor={llamado.requisitos_calificacion} />
            <Campo label="Plurianual" valor={llamado.plurianualidad ? "Sí" : "No"} />
            <Campo label="Ad referéndum" valor={llamado.ad_referendum ? "Sí" : "No"} />
            <Campo label="Categoría del llamado" valor={llamado.categoria_llamado} />
            <Campo label="Categoría de inversión" valor={llamado.categoria_inversion} />
            <Campo
              label="Objeto del gasto (catálogo)"
              valor={objetoGasto ? `${objetoGasto.codigo} · ${objetoGasto.descripcion}` : undefined}
            />
            <Campo label="Tipo de cambio" valor={llamado.tipo_cambio ? String(llamado.tipo_cambio) : undefined} />
          </dl>
          {llamado.categoria_llamado === "Bienes y Obras" && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Campos específicos — Bienes y Obras
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Campo
                  label="Precalificación"
                  valor={
                    llamado.precalificacion === true ? "Sí" : llamado.precalificacion === false ? "No" : undefined
                  }
                />
                <Campo label="Proceso de contratación" valor={llamado.proceso_contratacion} />
                <Campo label="Opciones de evaluación" valor={llamado.opciones_evaluacion} />
                <Campo label="Riesgo ESAS" valor={llamado.riesgo_esas} />
                <Campo label="Tipo de documento de contratación" valor={llamado.tipo_documento_contratacion} />
              </dl>
            </div>
          )}
        </section>

        {/* Encabezado PAC (Anexo B-02-02) */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Encabezado PAC (Anexo B-02-02) — datos de la entidad
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo label="Nivel de entidad" valor={llamado.nivel_entidad} />
            <Campo label="Entidad" valor={llamado.entidad} />
            <Campo label="UOC/UEP" valor={llamado.uoc_uep} />
            <Campo label="Sub UOC" valor={llamado.sub_uoc} />
            <Campo label="Unidad jerárquica" valor={llamado.unidad_jerarquica} />
            <Campo label="Código SICP" valor={llamado.codigo_sicp} />
          </dl>
        </section>

        {/* Proceso de adquisiciones STEP */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Proceso de adquisiciones STEP (Banco Mundial)
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo label="N° de referencia STEP" valor={llamado.nro_referencia_step} />
            <Campo label="Componente STEP" valor={llamado.componente_step} />
            <Campo label="Categoría de adquisiciones STEP" valor={llamado.categoria_step} />
            <Campo label="Método de adquisición STEP" valor={llamado.metodo_adquisicion_step} />
            <Campo label="Número de etapas" valor={llamado.numero_etapas} />
            <Campo label="Número de sobres" valor={llamado.numero_sobres} />
            <Campo
              label="Descripción STEP"
              valor={
                llamado.descripcion_step
                  ? `${llamado.descripcion_step}${llamado.descripcion_step_sincronizada ? " (sincronizada)" : ""}`
                  : undefined
              }
            />
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
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Clase</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Programa</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Subprograma</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Proyecto/Actividad</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">
                      SGOG (Clasificador Presupuestario)
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Fuente financ.</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Departamento</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Cuenta</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-500">Monto</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineas.map((l) => {
                    const eliminarConIds = eliminarLineaPresupuestaria.bind(null, l.id, id);
                    const objetoGastoLinea = l.objeto_gasto as unknown as { codigo: string; descripcion: string } | null;
                    return (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{l.ejercicio_fiscal ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{l.clase ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{l.programa ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{l.subprograma ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{l.proyecto_actividad ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {objetoGastoLinea
                            ? `${objetoGastoLinea.codigo} · ${objetoGastoLinea.descripcion}`
                            : l.sgog ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{l.fuente_financiamiento ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{l.departamento ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{l.cuenta ?? "—"}</td>
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
                <label className={labelClass}>Clase</label>
                <input
                  name="clase"
                  defaultValue="1"
                  readOnly
                  className={`${inputClass} bg-slate-50 text-slate-500`}
                  title="Valor fijo del proyecto"
                />
              </div>
              <div>
                <label className={labelClass}>Programa</label>
                <input
                  name="programa"
                  defaultValue="001"
                  readOnly
                  className={`${inputClass} bg-slate-50 text-slate-500`}
                  title="Valor fijo del proyecto"
                />
              </div>
              <div>
                <label className={labelClass}>Subprograma</label>
                <input name="subprograma" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Proyecto/Actividad</label>
                <input
                  name="proyecto_actividad"
                  defaultValue="57"
                  readOnly
                  className={`${inputClass} bg-slate-50 text-slate-500`}
                  title="Valor fijo del proyecto"
                />
              </div>
              <div>
                <label className={labelClass}>SGOG (Clasificador Presupuestario) *</label>
                <select name="objeto_gasto_id" className={inputClass} defaultValue="" required>
                  <option value="">— Seleccionar —</option>
                  {objetosGasto?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.codigo} · {o.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fuente de financiamiento (F.F.)</label>
                <input
                  name="fuente_financiamiento"
                  defaultValue="20"
                  readOnly
                  className={`${inputClass} bg-slate-50 text-slate-500`}
                  title="Valor fijo del proyecto"
                />
              </div>
              <div>
                <label className={labelClass}>Organismo financiador (O.F.)</label>
                <input
                  name="organismo_financiador"
                  defaultValue="402"
                  readOnly
                  className={`${inputClass} bg-slate-50 text-slate-500`}
                  title="Valor fijo del proyecto"
                />
              </div>
              <div>
                <label className={labelClass}>Departamento</label>
                <select name="departamento" className={inputClass} defaultValue="">
                  <option value="">— Sin definir —</option>
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d.codigo} value={valorDepartamento(d)}>
                      {valorDepartamento(d)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Cuenta</label>
                <input name="cuenta" className={inputClass} />
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

        {/* Montos por ejercicio fiscal (Tabla 2 del PAC) */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Montos por ejercicio fiscal (PAC)
            </h2>
            <span className="text-sm text-slate-500">
              Total {formatMonto(totalMontosEjercicio, llamado.moneda)}
              {llamado.monto_total ? ` / Monto total ${formatMonto(llamado.monto_total, llamado.moneda)}` : ""}
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-400">
            Distribución del Monto total entre hasta 6 ejercicios fiscales (llamados plurianuales) — alimenta la
            Tabla 2 del reporte PAC. Si no se carga nada acá, el reporte sigue derivando el dato de las líneas
            presupuestarias, como antes.
          </p>
          {totalMontosEjercicio > 0 && llamado.monto_total && totalMontosEjercicio !== llamado.monto_total && (
            <p className="mb-3 text-xs font-medium text-amber-700">
              ⚠ La suma de los montos por ejercicio ({formatMonto(totalMontosEjercicio, llamado.moneda)}) no coincide
              con el Monto total ({formatMonto(llamado.monto_total, llamado.moneda)}).
            </p>
          )}
          {!montosEjercicio || montosEjercicio.length === 0 ? (
            <p className="text-sm text-slate-500">Este llamado no tiene montos por ejercicio cargados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Ejercicio fiscal</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-500">Monto</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {montosEjercicio.map((m) => {
                    const eliminarConIds = eliminarMontoEjercicio.bind(null, m.id, id);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{m.ejercicio_fiscal}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {formatMonto(m.monto, llamado.moneda)}
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
              + Agregar monto por ejercicio
            </summary>
            <form
              action={crearMontoEjercicioConId}
              className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 sm:grid-cols-3"
            >
              <div>
                <label className={labelClass}>Ejercicio fiscal *</label>
                <input name="ejercicio_fiscal" type="number" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Monto *</label>
                <input name="monto" type="number" step="0.01" required className={inputClass} />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Agregar monto
                </button>
              </div>
            </form>
          </details>
        </section>

        {/* Códigos de catálogo (Tabla 4 del PAC) */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Códigos de catálogo (PAC — Tabla 4)
            </h2>
            <span className="text-sm text-slate-500">
              {codigoCatalogoDetalle?.length ?? 0} código
              {(codigoCatalogoDetalle?.length ?? 0) === 1 ? "" : "s"} · Total{" "}
              {formatMonto(totalCodigoCatalogo, llamado.moneda)}
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-400">
            Filas repetibles de &quot;Código catálogo / Descripción del bien, servicio, consultoría y/u obra pública
            / Monto&quot;. Mientras haya una sola fila, se sincroniza automáticamente con los campos manuales de
            &quot;Datos para el PAC&quot; en Editar; con más de una fila, el reporte PAC usa este detalle completo.
          </p>
          {!codigoCatalogoDetalle || codigoCatalogoDetalle.length === 0 ? (
            <p className="text-sm text-slate-500">Este llamado no tiene códigos de catálogo cargados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Orden</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Código catálogo</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Descripción</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-500">Monto</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {codigoCatalogoDetalle.map((c) => {
                    const eliminarConIds = eliminarCodigoCatalogoDetalle.bind(null, c.id, id);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{c.orden}</td>
                        <td className="px-3 py-2 text-slate-700">{c.codigo}</td>
                        <td className="px-3 py-2 text-slate-600">{c.descripcion ?? "—"}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {formatMonto(c.monto, llamado.moneda)}
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
              + Agregar código de catálogo
            </summary>
            <form
              action={crearCodigoCatalogoConId}
              className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 sm:grid-cols-4"
            >
              <div>
                <label className={labelClass}>Código catálogo *</label>
                <input name="codigo" required className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Descripción del bien/servicio/consultoría/obra</label>
                <input name="descripcion" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Orden</label>
                <input name="orden" type="number" defaultValue={0} className={inputClass} />
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
                  Agregar código
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
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Etapa</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Fase</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Orden</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">F. original</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">F. revisada</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">F. real</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Responsable</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">N° memo</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">N° nota</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Detalle</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Estado</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cronograma.map((e) => {
                    const estado = cronogramaEstado(e);
                    const formId = `etapa-${e.id}`;
                    const actualizarConIds = actualizarEtapaCronograma.bind(null, e.id, id);
                    const eliminarConIds = eliminarEtapaCronograma.bind(null, e.id, id);
                    const responsable = e.responsable as unknown as { id: string; nombre: string } | null;
                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-2 py-2">
                          <form id={formId} action={actualizarConIds} />
                          <input
                            form={formId}
                            name="etapa_nombre"
                            required
                            defaultValue={e.etapa_nombre ?? ""}
                            className={`${inputClass} w-36`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input form={formId} name="fase" defaultValue={e.fase ?? ""} className={`${inputClass} w-24`} />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            form={formId}
                            name="orden"
                            type="number"
                            defaultValue={e.orden ?? ""}
                            className={`${inputClass} w-16`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            form={formId}
                            name="fecha_original"
                            type="date"
                            defaultValue={toDateInputValue(e.fecha_original)}
                            className={`${inputClass} w-36`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            form={formId}
                            name="fecha_revisada"
                            type="date"
                            defaultValue={toDateInputValue(e.fecha_revisada)}
                            className={`${inputClass} w-36`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            form={formId}
                            name="fecha_real"
                            type="date"
                            defaultValue={toDateInputValue(e.fecha_real)}
                            className={`${inputClass} w-36`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            form={formId}
                            name="responsable"
                            defaultValue={responsable?.id ?? ""}
                            className={`${inputClass} w-32`}
                          >
                            <option value="">— Sin definir —</option>
                            {usuarios?.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input form={formId} name="nro_memo" defaultValue={e.nro_memo ?? ""} className={`${inputClass} w-24`} />
                        </td>
                        <td className="px-2 py-2">
                          <input form={formId} name="nro_nota" defaultValue={e.nro_nota ?? ""} className={`${inputClass} w-24`} />
                        </td>
                        <td className="px-2 py-2">
                          <input form={formId} name="detalle" defaultValue={e.detalle ?? ""} className={`${inputClass} w-36`} />
                        </td>
                        <td className="px-2 py-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${estado.color}`}>
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <button form={formId} type="submit" className="mr-2 text-xs text-blue-600 hover:underline">
                            Guardar
                          </button>
                          <form action={eliminarConIds} className="inline">
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
            <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-blue-600">+ Agregar etapa</summary>
            <form action={crearEtapaConId} className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Etapa *</label>
                <input name="etapa_nombre" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Fase</label>
                <input name="fase" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Orden</label>
                <input name="orden" type="number" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Fecha original</label>
                <input name="fecha_original" type="date" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Fecha revisada</label>
                <input name="fecha_revisada" type="date" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Fecha real</label>
                <input name="fecha_real" type="date" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Responsable</label>
                <select name="responsable" className={inputClass} defaultValue="">
                  <option value="">— Sin definir —</option>
                  {usuarios?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>N° memo</label>
                <input name="nro_memo" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>N° nota</label>
                <input name="nro_nota" className={inputClass} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>Detalle</label>
                <input name="detalle" className={inputClass} />
              </div>
              <div className="flex items-end sm:col-span-3">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Agregar etapa
                </button>
              </div>
            </form>
          </details>
        </section>

        {/* Hitos STEP */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Cronograma STEP
          </h2>
          {!catalogoHitos ? (
            <p className="text-sm text-slate-500">
              Definí la Categoría del llamado (Bienes y Obras, Consultor Individual o Firmas Consultoras) en
              &quot;Datos generales&quot; para habilitar los hitos STEP correspondientes.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Hito</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Planificada</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-500">Real</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catalogoHitos.map((hito) => {
                    const existente = hitosPorTipo.get(hito.label);

                    if (existente) {
                      const formId = `hito-${existente.id}`;
                      const actualizarConIds = actualizarHito.bind(null, existente.id, id);
                      const eliminarConIds = eliminarHito.bind(null, existente.id, id);
                      return (
                        <tr key={hito.label} className="hover:bg-slate-50">
                          <td className="px-2 py-2 text-slate-800">{hito.label}</td>
                          <td className="px-2 py-2">
                            <form id={formId} action={actualizarConIds} />
                            {hito.soloReal ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <input
                                form={formId}
                                name="fecha_planificada"
                                type="date"
                                defaultValue={toDateInputValue(existente.fecha_planificada)}
                                className={`${inputClass} w-36`}
                              />
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              form={formId}
                              name="fecha_real"
                              type="date"
                              defaultValue={toDateInputValue(existente.fecha_real)}
                              className={`${inputClass} w-36`}
                            />
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <button form={formId} type="submit" className="mr-2 text-xs text-blue-600 hover:underline">
                              Guardar
                            </button>
                            <form action={eliminarConIds} className="inline">
                              <button type="submit" className="text-xs text-red-600 hover:underline">
                                Eliminar
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    }

                    const crearConIds = crearHito.bind(null, id, hito.label);
                    const formId = `hito-nuevo-${hito.label}`;
                    return (
                      <tr key={hito.label} className="hover:bg-slate-50">
                        <td className="px-2 py-2 text-slate-500">{hito.label}</td>
                        <td className="px-2 py-2">
                          <form id={formId} action={crearConIds} />
                          {hito.soloReal ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <input form={formId} name="fecha_planificada" type="date" className={`${inputClass} w-36`} />
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <input form={formId} name="fecha_real" type="date" className={`${inputClass} w-36`} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <button form={formId} type="submit" className="text-xs text-blue-600 hover:underline">
                            Agregar
                          </button>
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
