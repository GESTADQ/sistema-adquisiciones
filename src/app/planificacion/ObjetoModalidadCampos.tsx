"use client";

import { useMemo, useState } from "react";
import { OBJETO_LLAMADO_OPCIONES } from "@/lib/objetoLlamado";
import { grupoModalidadPorObjeto } from "@/lib/modalidad";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-slate-500";

type Modalidad = { id: string; nombre: string; categoria: string | null };

export default function ObjetoModalidadCampos({
  modalidades,
  objetoInicial,
  modalidadInicial,
}: {
  modalidades: Modalidad[];
  objetoInicial?: string | null;
  modalidadInicial?: string | null;
}) {
  const [objeto, setObjeto] = useState(objetoInicial ?? "");
  const [modalidadId, setModalidadId] = useState(modalidadInicial ?? "");

  const grupo = grupoModalidadPorObjeto(objeto);

  const opcionesModalidad = useMemo(
    () => modalidades.filter((m) => m.categoria === grupo),
    [modalidades, grupo]
  );

  const objetoFueraDeCatalogo =
    !!objetoInicial && !(OBJETO_LLAMADO_OPCIONES as readonly string[]).includes(objetoInicial);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className={labelClass}>Objeto del llamado *</label>
        <select
          name="objeto_llamado"
          required
          value={objeto}
          onChange={(e) => {
            const nuevoObjeto = e.target.value;
            setObjeto(nuevoObjeto);
            // Al cambiar el Objeto del llamado, la Modalidad/Método seleccionada
            // puede dejar de ser válida para el nuevo grupo — se limpia siempre
            // que cambie el objeto, para no dejar guardar una combinación
            // incompatible (pedido explícito de Martin, 7/9/2026).
            setModalidadId("");
          }}
          className={inputClass}
        >
          <option value="" disabled>
            — Seleccionar —
          </option>
          {OBJETO_LLAMADO_OPCIONES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          {objetoFueraDeCatalogo && (
            <option value={objetoInicial as string}>
              {objetoInicial} (valor actual, fuera de catálogo)
            </option>
          )}
        </select>
      </div>
      <div>
        <label className={labelClass}>Modalidad/Método</label>
        <select
          name="modalidad_id"
          value={modalidadId}
          onChange={(e) => setModalidadId(e.target.value)}
          className={inputClass}
          disabled={!objeto}
        >
          <option value="">— Sin definir —</option>
          {opcionesModalidad.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
        {!objeto && (
          <p className="mt-1 text-xs text-slate-400">Elegí primero el Objeto del llamado.</p>
        )}
      </div>
    </div>
  );
}
