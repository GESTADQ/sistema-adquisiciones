import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

function formatMonto(monto: number, moneda: string) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "PYG",
    maximumFractionDigits: moneda === "USD" ? 2 : 0,
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
      "id, nro_pac, nro_step, nombre_llamado, objeto_llamado, monto_total, moneda, estado_step, estado_general, modalidad:modalidad_id(nombre), componente:componente_id(nombre)"
    )
    .eq("estado_general", "Activo")
    .order("nro_pac");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Planificación — Plan de Adquisiciones</h1>
            <p className="text-sm text-slate-500">
              {llamados?.length ?? 0} llamados activos · Proyecto TAPE (BIRF 9517-PY)
            </p>
          </div>
          <Link
            href="/planificacion/nuevo"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nuevo llamado
          </Link>
        </div>
      </header>

      <main className="p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No se pudo cargar el Plan de Adquisiciones: {error.message}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">N° PAC</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">N° STEP</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Objeto</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Modalidad</th>
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
                      {l.nro_pac}
                    </Link>
                  </td>
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
