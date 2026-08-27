import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { actualizarLlamado } from "../../actions";
import CategoriaLlamadoCampos from "../../CategoriaLlamadoCampos";
import AppNav from "@/components/AppNav";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-slate-500";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarLlamadoPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: llamado, error }, { data: uocs }, { data: modalidades }, { data: componentes }, { data: objetosGasto }] =
    await Promise.all([
      supabase.from("llamado").select("*").eq("id", id).single(),
      supabase.from("entidad_uoc").select("id, entidad, uoc, sub_uoc").order("uoc"),
      supabase.from("modalidad").select("id, nombre").order("nombre"),
      supabase.from("componente_proyecto").select("id, nombre").order("nombre"),
      supabase.from("objeto_gasto").select("id, codigo, descripcion").order("codigo"),
    ]);

  if (error || !llamado) {
    notFound();
  }

  const actualizarConId = actualizarLlamado.bind(null, id);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/planificacion" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href={`/planificacion/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Volver al detalle del llamado
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">
          Editar llamado — N° PAC {llamado.nro_pac}
        </h1>
      </header>

      <main className="p-6">
        <form action={actualizarConId} className="max-w-3xl space-y-6 rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>N° PAC *</label>
              <input name="nro_pac" required defaultValue={llamado.nro_pac ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>N° STEP</label>
              <input name="nro_step" defaultValue={llamado.nro_step ?? ""} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Objeto del llamado *</label>
            <input
              name="objeto_llamado"
              required
              defaultValue={llamado.objeto_llamado ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Nombre del llamado *</label>
            <input
              name="nombre_llamado"
              required
              defaultValue={llamado.nombre_llamado ?? ""}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>UOC *</label>
              <select name="uoc_id" required className={inputClass} defaultValue={llamado.uoc_id ?? ""}>
                <option value="" disabled>
                  — Seleccionar —
                </option>
                {uocs?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.entidad} / {u.uoc}
                    {u.sub_uoc ? ` / ${u.sub_uoc}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Modalidad</label>
              <select name="modalidad_id" className={inputClass} defaultValue={llamado.modalidad_id ?? ""}>
                <option value="">— Sin definir —</option>
                {modalidades?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Componente</label>
              <select name="componente_id" className={inputClass} defaultValue={llamado.componente_id ?? ""}>
                <option value="">— Sin definir —</option>
                {componentes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Monto total (Gs.) *</label>
              <input
                name="monto_total"
                type="number"
                step="0.01"
                required
                defaultValue={llamado.monto_total ?? 0}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Moneda</label>
              <select name="moneda" className={inputClass} defaultValue={llamado.moneda ?? "PYG"}>
                <option value="PYG">PYG</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <CategoriaLlamadoCampos
            categoriaInicial={llamado.categoria_llamado}
            categoriaInversionInicial={llamado.categoria_inversion}
            objetosGasto={objetosGasto ?? []}
            objetoGastoInicial={llamado.objeto_gasto_id}
            pacCodigoCatalogoInicial={llamado.pac_codigo_catalogo}
            pacDescripcionBienInicial={llamado.pac_descripcion_bien}
            tipoCambioInicial={llamado.tipo_cambio}
            montoEstimadoUsdActual={llamado.monto_estimado_usd}
            precalificacionInicial={llamado.precalificacion}
            procesoContratacionInicial={llamado.proceso_contratacion}
            opcionesEvaluacionInicial={llamado.opciones_evaluacion}
            riesgoEsasInicial={llamado.riesgo_esas}
            tipoDocumentoContratacionInicial={llamado.tipo_documento_contratacion}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Fecha estimada del llamado</label>
              <input
                name="fecha_estimada_llamado"
                type="date"
                defaultValue={llamado.fecha_estimada_llamado ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tipo de revisión</label>
              <select name="tipo_revision" className={inputClass} defaultValue={llamado.tipo_revision ?? ""}>
                <option value="">— Sin definir —</option>
                <option value="Previa">Previa</option>
                <option value="Posterior">Posterior</option>
                <option value="No incluido">No incluido</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Estado general</label>
              <select name="estado_general" className={inputClass} defaultValue={llamado.estado_general ?? "Activo"}>
                <option value="Activo">Activo</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Estado STEP</label>
              <select name="estado_step" className={inputClass} defaultValue={llamado.estado_step ?? ""}>
                <option value="">— Sin definir —</option>
                <option value="Bajo Revisión">Bajo Revisión</option>
                <option value="Ejecución Pendiente">Ejecución Pendiente</option>
                <option value="Pendiente de Implementación">Pendiente de Implementación</option>
                <option value="En Ejecución">En Ejecución</option>
                <option value="Firmado">Firmado</option>
                <option value="Cancelado">Cancelado</option>
                <option value="No incluido">No incluido</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Estado actividad STEP</label>
              <input
                name="estado_actividad_step"
                defaultValue={llamado.estado_actividad_step ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ámbito de mercado</label>
              <input name="ambito_mercado" defaultValue={llamado.ambito_mercado ?? ""} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Apertura de mercado</label>
            <input name="apertura_mercado" defaultValue={llamado.apertura_mercado ?? ""} className={inputClass} />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                name="plurianualidad"
                type="checkbox"
                defaultChecked={!!llamado.plurianualidad}
                className="rounded border-slate-300"
              />
              Plurianual
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                name="ad_referendum"
                type="checkbox"
                defaultChecked={!!llamado.ad_referendum}
                className="rounded border-slate-300"
              />
              Ad referéndum
            </label>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Seguimiento interno
            </h2>
            <p className="mb-4 text-xs text-slate-400">
              Bitácora manual del equipo — no alimenta el motor de alertas del Cronograma de Etapas.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Situación actual</label>
                <input
                  name="situacion_actual"
                  defaultValue={llamado.situacion_actual ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Etapa interna actual</label>
                <input
                  name="etapa_interna_actual"
                  defaultValue={llamado.etapa_interna_actual ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Último seguimiento</label>
                <input
                  name="ultimo_seguimiento"
                  type="date"
                  defaultValue={llamado.ultimo_seguimiento ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Próxima acción</label>
                <input name="proxima_accion" defaultValue={llamado.proxima_accion ?? ""} className={inputClass} />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Observaciones</label>
              <textarea
                name="observaciones"
                rows={3}
                defaultValue={llamado.observaciones ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Link
              href={`/planificacion/${id}`}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
