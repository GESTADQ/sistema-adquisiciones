"use client";

import { useState } from "react";
import { CATEGORIAS_LLAMADO } from "@/lib/hitosStep";
import { CATEGORIAS_INVERSION, valorCategoriaInversion } from "@/lib/categoriasInversion";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-slate-500";

type ObjetoGasto = { id: string; codigo: string; descripcion: string };

type Props = {
  categoriaInicial?: string | null;
  categoriaInversionInicial?: string | null;
  tipoCambioInicial?: number | null;
  montoEstimadoUsdActual?: number | null;
  precalificacionInicial?: boolean | null;
  procesoContratacionInicial?: string | null;
  opcionesEvaluacionInicial?: string | null;
  riesgoEsasInicial?: string | null;
  tipoDocumentoContratacionInicial?: string | null;
  objetosGasto?: ObjetoGasto[];
  objetoGastoInicial?: string | null;
};

export default function CategoriaLlamadoCampos({
  categoriaInicial,
  categoriaInversionInicial,
  tipoCambioInicial,
  montoEstimadoUsdActual,
  precalificacionInicial,
  procesoContratacionInicial,
  opcionesEvaluacionInicial,
  riesgoEsasInicial,
  tipoDocumentoContratacionInicial,
  objetosGasto,
  objetoGastoInicial,
}: Props) {
  const [categoria, setCategoria] = useState(categoriaInicial ?? "");
  const esBienesObras = categoria === "Bienes y Obras";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Categoría del llamado</label>
          <select
            name="categoria_llamado"
            className={inputClass}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">— Sin definir —</option>
            {CATEGORIAS_LLAMADO.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Determina qué hitos STEP corresponden a este llamado (Cronograma STEP más abajo).
          </p>
        </div>
        <div>
          <label className={labelClass}>Categoría de inversión</label>
          <select
            name="categoria_inversion"
            className={inputClass}
            defaultValue={categoriaInversionInicial ?? ""}
          >
            <option value="">— Sin definir —</option>
            {CATEGORIAS_INVERSION.map((c) => {
              const valor = valorCategoriaInversion(c);
              return (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              );
            })}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Rubro del Cuadro de Costos del proyecto (solo los financiados por BIRF MOPC) — no confundir con la
            categoría del llamado.
          </p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Objeto del gasto (catálogo)</label>
        <select name="objeto_gasto_id" className={inputClass} defaultValue={objetoGastoInicial ?? ""}>
          <option value="">— Sin definir —</option>
          {objetosGasto?.map((o) => (
            <option key={o.id} value={o.id}>
              {o.codigo} · {o.descripcion}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">
          Clasificación del catálogo de bienes/servicios del llamado — se usa para el reporte PAC (Anexo
          B-02-02), no para la estructura presupuestaria (eso va por SGOG en cada línea presupuestaria).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Tipo de cambio (Gs. por USD)</label>
          <input
            name="tipo_cambio"
            type="number"
            step="0.01"
            defaultValue={tipoCambioInicial ?? ""}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400">
            El monto estimado en USD se calcula automáticamente (Monto total en Gs. ÷ Tipo de cambio) al guardar.
          </p>
        </div>
        {montoEstimadoUsdActual !== undefined && (
          <div>
            <label className={labelClass}>Monto estimado (USD) — calculado</label>
            <input
              disabled
              value={
                montoEstimadoUsdActual !== null
                  ? new Intl.NumberFormat("es-PY", { style: "currency", currency: "USD" }).format(
                      montoEstimadoUsdActual
                    )
                  : "— Cargá el tipo de cambio y guardá —"
              }
              className={`${inputClass} bg-slate-100 text-slate-500`}
            />
          </div>
        )}
      </div>

      {esBienesObras && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Campos específicos — Bienes y Obras
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Precalificación</label>
              <select
                name="precalificacion"
                className={inputClass}
                defaultValue={
                  precalificacionInicial === true ? "true" : precalificacionInicial === false ? "false" : ""
                }
              >
                <option value="">— Sin definir —</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Proceso de contratación</label>
              <input
                name="proceso_contratacion"
                defaultValue={procesoContratacionInicial ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Opciones de evaluación</label>
              <input
                name="opciones_evaluacion"
                defaultValue={opcionesEvaluacionInicial ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Riesgo ESAS (ambiental/social)</label>
              <input name="riesgo_esas" defaultValue={riesgoEsasInicial ?? ""} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Tipo de documento de contratación</label>
              <input
                name="tipo_documento_contratacion"
                defaultValue={tipoDocumentoContratacionInicial ?? ""}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
