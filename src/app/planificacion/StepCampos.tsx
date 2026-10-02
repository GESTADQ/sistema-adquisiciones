"use client";

import { useState } from "react";
import { NUMERO_ETAPAS_OPCIONES, NUMERO_SOBRES_OPCIONES } from "@/lib/stepProceso";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-slate-500";

type Props = {
  nroReferenciaStepInicial?: string | null;
  categoriaStepInicial?: string | null;
  metodoAdquisicionStepInicial?: string | null;
  componenteStepInicial?: string | null;
  numeroEtapasInicial?: string | null;
  numeroSobresInicial?: string | null;
  descripcionStepInicial?: string | null;
  descripcionStepSincronizadaInicial?: boolean | null;
};

// Campos del proceso de adquisiciones STEP (Banco Mundial) — pedido de
// Martin (2/10/2026). Son conceptos propios de STEP, distintos de sus
// equivalentes locales ya existentes en `llamado` (ver comentarios de la
// migración migrations_modulo1_pac_step.sql): no se reutiliza ningún campo
// DNCP para representar esto. `categoria_step`, `metodo_adquisicion_step` y
// `componente_step` quedan como texto libre (no se inventó un catálogo
// cerrado sin que Martin confirme los valores oficiales de STEP).
export default function StepCampos({
  nroReferenciaStepInicial,
  categoriaStepInicial,
  metodoAdquisicionStepInicial,
  componenteStepInicial,
  numeroEtapasInicial,
  numeroSobresInicial,
  descripcionStepInicial,
  descripcionStepSincronizadaInicial,
}: Props) {
  const [sincronizada, setSincronizada] = useState(descripcionStepSincronizadaInicial ?? true);

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Proceso de adquisiciones STEP (Banco Mundial)
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>N° de referencia STEP</label>
          <input
            name="nro_referencia_step"
            defaultValue={nroReferenciaStepInicial ?? ""}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400">
            Distinto de &quot;N° STEP&quot; de arriba — es el número que asigna el sistema STEP del Banco al cargar
            la actividad.
          </p>
        </div>
        <div>
          <label className={labelClass}>Componente STEP</label>
          <input
            name="componente_step"
            defaultValue={componenteStepInicial ?? ""}
            placeholder="Ej.: 1 - Mejorar los entornos de aprendizaje"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Categoría de adquisiciones STEP</label>
          <input
            name="categoria_step"
            defaultValue={categoriaStepInicial ?? ""}
            placeholder="Ej.: Bienes / Obras / Servicios de Consultoría"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Método de adquisición STEP</label>
          <input
            name="metodo_adquisicion_step"
            defaultValue={metodoAdquisicionStepInicial ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Número de etapas</label>
          <select name="numero_etapas" defaultValue={numeroEtapasInicial ?? ""} className={inputClass}>
            <option value="">— Sin definir —</option>
            {NUMERO_ETAPAS_OPCIONES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Número de sobres</label>
          <select name="numero_sobres" defaultValue={numeroSobresInicial ?? ""} className={inputClass}>
            <option value="">— Sin definir —</option>
            {NUMERO_SOBRES_OPCIONES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <input
            type="checkbox"
            name="descripcion_step_sincronizada"
            checked={sincronizada}
            onChange={(e) => setSincronizada(e.target.checked)}
            className="rounded border-slate-300"
          />
          Mantener &quot;Descripción STEP&quot; sincronizada con el Nombre del llamado
        </label>
        <input
          name="descripcion_step"
          defaultValue={descripcionStepInicial ?? ""}
          disabled={sincronizada}
          className={`${inputClass} ${sincronizada ? "bg-slate-100 text-slate-500" : ""}`}
          placeholder={sincronizada ? "Se completa automáticamente con el Nombre del llamado al guardar" : ""}
        />
      </div>
    </div>
  );
}
