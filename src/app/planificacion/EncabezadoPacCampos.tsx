import { PAC_ENCABEZADO_FIJO } from "@/lib/reportes/pacConstants";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-slate-500";

type Props = {
  nivelEntidadInicial?: string | null;
  entidadInicial?: string | null;
  uocUepInicial?: string | null;
  subUocInicial?: string | null;
  unidadJerarquicaInicial?: string | null;
  codigoSicpInicial?: string | null;
};

// Encabezado del reporte PAC (Anexo B-02-02) — Nivel de entidad, Entidad,
// UOC/UEP, Sub UOC, Unidad jerárquica, Código SICP. Pedido de Martin
// (2/10/2026): antes eran constantes fijas sin respaldo en base
// (src/lib/reportes/pacConstants.ts); ahora son columnas editables por
// llamado en `llamado`, precargadas con el mismo valor de siempre.
export default function EncabezadoPacCampos({
  nivelEntidadInicial,
  entidadInicial,
  uocUepInicial,
  subUocInicial,
  unidadJerarquicaInicial,
  codigoSicpInicial,
}: Props) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Encabezado PAC (Anexo B-02-02) — datos de la entidad
      </h3>
      <p className="mb-3 text-xs text-slate-400">
        Mismo valor para todos los llamados de este proyecto — se precargan automáticamente, pero quedan editables
        por si algún llamado necesitara un valor distinto.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nivel de entidad</label>
          <input
            name="nivel_entidad"
            defaultValue={nivelEntidadInicial ?? PAC_ENCABEZADO_FIJO.nivelEntidad}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Entidad</label>
          <input
            name="entidad"
            defaultValue={entidadInicial ?? PAC_ENCABEZADO_FIJO.entidad}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>UOC/UEP</label>
          <input
            name="uoc_uep"
            defaultValue={uocUepInicial ?? PAC_ENCABEZADO_FIJO.uocUep}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Sub UOC</label>
          <input
            name="sub_uoc"
            defaultValue={subUocInicial ?? PAC_ENCABEZADO_FIJO.subUoc}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Unidad jerárquica</label>
          <input
            name="unidad_jerarquica"
            defaultValue={unidadJerarquicaInicial ?? PAC_ENCABEZADO_FIJO.unidadJerarquica}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Código SICP</label>
          <input
            name="codigo_sicp"
            defaultValue={codigoSicpInicial ?? PAC_ENCABEZADO_FIJO.codigoSicp}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
