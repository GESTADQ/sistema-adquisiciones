import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { CATEGORIAS_INVERSION, categoriaInversionPorValor } from "@/lib/categoriasInversion";

function formatMonto(monto: number, moneda: string) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "PYG",
    maximumFractionDigits: moneda === "USD" ? 2 : 0,
  }).format(monto);
}

function formatUsd(monto: number) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(monto);
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

export default async function PlanificacionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: llamados, error } = await supabase
    .from("llamado")
    .select(
      "id, nro_pac, nro_proceso_interno, nro_step, nombre_llamado, objeto_llamado, monto_total, monto_estimado_usd, moneda, categoria_inversion, estado_step, estado_general, modalidad:modalidad_id(nombre), componente:componente_id(nombre)"
    )
    .eq("estado_general", "Activo")
    .order("nro_proceso_interno", { nullsFirst: false })
    .order("nro_pac");

  // Cuadro de Costos — comprometido por rubro vs. tope BIRF MOPC (pedido de
  // Martin, 2/10/2026, archivo CUADRO_DE_COSTOS.xlsx). El monto de cada
  // llamado se toma en USD: directo si moneda=USD, o monto_estimado_usd
  // (ya calculado al cargar el tipo de cambio) si moneda=PYG. Los llamados
  // en PYG sin tipo de cambio cargado no se pueden convertir y se cuentan
  // aparte, para no subestimar en silencio lo comprometido.
  const comprometidoPorRubro = new Map<string, number>();
  let llamadosSinConvertir = 0;
  for (const l of llamados ?? []) {
    const rubro = categoriaInversionPorValor(l.categoria_inversion);
    if (!rubro) continue;
    const montoUsd = l.moneda === "USD" ? l.monto_total : l.monto_estimado_usd;
    if (montoUsd === null || montoUsd === undefined) {
      llamadosSinConvertir += 1;
      continue;
    }
    comprometidoPorRubro.set(rubro.codigo, (comprometidoPorRubro.get(rubro.codigo) ?? 0) + montoUsd);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/planificacion" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Planificación — Plan de Adquisiciones</h1>
            <p className="text-sm text-slate-500">
              {llamados?.length ?? 0} llamados activos · Proyecto TAPE (BIRF 9517-PY)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/reportes/prepac"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Descargar PREPAC (XLSX)
            </a>
            <Link
              href="/planificacion/nuevo"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Nuevo llamado
            </Link>
          </div>
        </div>
      </header>

      <main className="p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No se pudo cargar el Plan de Adquisiciones: {error.message}
          </div>
        )}

        {/* Cuadro de Costos — seguimiento por rubro */}
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Cuadro de Costos — seguimiento por rubro (BIRF MOPC)
          </h2>
          <p className="mb-3 text-xs text-slate-400">
            Comprometido = suma de llamados activos con esa Categoría de inversión, en USD. Tope = columna &quot;BIRF
            MOPC SNIP 1075&quot; del Cuadro de Costos (CUADRO_DE_COSTOS.xlsx, hoja BM NUEVO).
          </p>
          {llamadosSinConvertir > 0 && (
            <p className="mb-3 text-xs font-medium text-amber-700">
              ⚠ {llamadosSinConvertir} llamado{llamadosSinConvertir === 1 ? "" : "s"} en Gs. con rubro asignado pero
              sin tipo de cambio cargado — no se pudo convertir a USD, no está incluido en el comprometido de abajo.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">Código</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">Rubro</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-500">Tope (USD)</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-500">Comprometido (USD)</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-500">Saldo (USD)</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-500">% usado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CATEGORIAS_INVERSION.map((rubro) => {
                  const comprometido = comprometidoPorRubro.get(rubro.codigo) ?? 0;
                  const saldo = rubro.montoTopeUsd - comprometido;
                  const porcentaje = rubro.montoTopeUsd > 0 ? (comprometido / rubro.montoTopeUsd) * 100 : 0;
                  const excedido = comprometido > rubro.montoTopeUsd;
                  return (
                    <tr key={rubro.codigo} className={excedido ? "bg-red-50" : "hover:bg-slate-50"}>
                      <td className="px-3 py-2 text-slate-700">{rubro.codigo}</td>
                      <td className="px-3 py-2 text-slate-700">{rubro.descripcion}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{formatUsd(rubro.montoTopeUsd)}</td>
                      <td className="px-3 py-2 text-right text-slate-800">{formatUsd(comprometido)}</td>
                      <td className={`px-3 py-2 text-right font-medium ${saldo < 0 ? "text-red-700" : "text-slate-800"}`}>
                        {formatUsd(saldo)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            excedido
                              ? "bg-red-100 text-red-800"
                              : porcentaje >= 90
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {porcentaje.toFixed(1)}%{excedido ? " — tope excedido" : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Proceso interno</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">N° PAC</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">N° STEP</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Objeto</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Modalidad/Método</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Componente</th>
                <th className="px-4 py-2 text-right font-medium text-slate-500">Monto</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Estado STEP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {llamados?.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">
                    <Link href={`/planificacion/${l.id}`} className="text-blue-600 hover:underline">
                      {l.nro_proceso_interno ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{l.nro_pac ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{l.nro_step ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-700">
                    <Link href={`/planificacion/${l.id}`} className="hover:underline">
                      {l.nombre_llamado || l.objeto_llamado}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {(l.modalidad as unknown as { nombre: string } | null)?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {(l.componente as unknown as { nombre: string } | null)?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-700">
                    {formatMonto(l.monto_total, l.moneda)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        ESTADO_COLOR[l.estado_step ?? ""] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {l.estado_step ?? "Sin definir"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
