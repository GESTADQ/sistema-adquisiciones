import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { crearLlamado } from "../actions";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-slate-500";

export default async function NuevoLlamadoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: uocs }, { data: modalidades }, { data: componentes }] = await Promise.all([
    supabase.from("entidad_uoc").select("id, entidad, uoc, sub_uoc").order("uoc"),
    supabase.from("modalidad").select("id, nombre").order("nombre"),
    supabase.from("componente_proyecto").select("id, nombre").order("nombre"),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/planificacion" className="text-sm text-blue-600 hover:underline">
          ← Volver al Plan de Adquisiciones
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">Nuevo llamado</h1>
      </header>

      <main className="p-6">
        <form action={crearLlamado} className="max-w-3xl space-y-6 rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>N° PAC *</label>
              <input name="nro_pac" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>N° STEP</label>
              <input name="nro_step" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Objeto del llamado *</label>
            <input name="objeto_llamado" required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Nombre del llamado *</label>
            <input name="nombre_llamado" required className={inputClass} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>UOC</label>
              <select name="uoc_id" className={inputClass} defaultValue="">
                <option value="">— Sin definir —</option>
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
              <select name="modalidad_id" className={inputClass} defaultValue="">
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
              <select name="componente_id" className={inputClass} defaultValue="">
                <option value="">— Sin definir —</option>
                {componentes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Monto total *</label>
              <input name="monto_total" type="number" step="0.01" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Moneda</label>
              <select name="moneda" className={inputClass} defaultValue="PYG">
                <option value="PYG">PYG</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Monto estimado (USD)</label>
              <input name="monto_estimado_usd" type="number" step="0.01" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Fecha estimada del llamado</label>
              <input name="fecha_estimada_llamado" type="date" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tipo de revisión</label>
              <select name="tipo_revision" className={inputClass} defaultValue="">
                <option value="">— Sin definir —</option>
                <option value="Previa">Previa</option>
                <option value="Posterior">Posterior</option>
                <option value="No incluido">No incluido</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Estado STEP</label>
              <select name="estado_step" className={inputClass} defaultValue="">
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
            <div>
              <label className={labelClass}>Estado actividad STEP</label>
              <input name="estado_actividad_step" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Ámbito de mercado</label>
              <input name="ambito_mercado" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Apertura de mercado</label>
              <input name="apertura_mercado" className={inputClass} />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input name="plurianualidad" type="checkbox" className="rounded border-slate-300" />
              Plurianual
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input name="ad_referendum" type="checkbox" className="rounded border-slate-300" />
              Ad referéndum
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Link
              href="/planificacion"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Crear llamado
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
