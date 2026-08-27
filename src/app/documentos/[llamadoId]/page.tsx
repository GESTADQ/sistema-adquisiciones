import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { subirDocumento, eliminarDocumento } from "../actions";
import { CATEGORIAS_DOCUMENTO } from "@/lib/categoriasDocumento";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

const BUCKET = "documentos";
const SIGNED_URL_TTL_SEG = 60 * 10; // 10 minutos, suficiente para ver/descargar desde la pantalla

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PY", { dateStyle: "short", timeStyle: "short" });
}

export default async function DocumentosDetallePage({
  params,
}: {
  params: Promise<{ llamadoId: string }>;
}) {
  const { llamadoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: llamado } = await supabase
    .from("llamado")
    .select("id, nro_pac, nombre_llamado, objeto_llamado")
    .eq("id", llamadoId)
    .maybeSingle();

  if (!llamado) {
    notFound();
  }

  const { data: documentos, error } = await supabase
    .from("documento")
    .select("id, categoria, subcategoria, version, archivo_url, fecha_carga, usuario:usuario_id(nombre)")
    .eq("llamado_id", llamadoId)
    .order("fecha_carga", { ascending: false });

  const documentosConUrl = await Promise.all(
    (documentos ?? []).map(async (d) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(d.archivo_url, SIGNED_URL_TTL_SEG);
      return { ...d, urlFirmada: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/documentos" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/documentos" className="text-sm text-blue-600 hover:underline">
          ← Volver a Documentos / Expediente
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          {llamado.nro_pac} — {llamado.nombre_llamado || llamado.objeto_llamado}
        </h1>
      </header>

      <main className="space-y-6 p-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No se pudo cargar el expediente: {error.message}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Documentos del expediente</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Categoría</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Subcategoría</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Archivo</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Cargado por</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Fecha</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documentosConUrl.map((d) => {
                  const nombreArchivo = d.archivo_url.split("/").slice(1).join("/").replace(/^[0-9a-f-]{36}-/, "");
                  const usuario = d.usuario as unknown as { nombre: string } | null;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {d.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-600">{d.subcategoria ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {d.urlFirmada ? (
                          <a
                            href={d.urlFirmada}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {nombreArchivo}
                          </a>
                        ) : (
                          <span className="text-red-600">No se pudo generar el enlace</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{usuario?.nombre ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{formatFecha(d.fecha_carga)}</td>
                      <td className="px-4 py-2 text-right">
                        <form action={eliminarDocumento.bind(null, d.id, d.archivo_url, llamadoId)}>
                          <button type="submit" className="text-sm text-red-600 hover:underline">
                            Eliminar
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {documentosConUrl.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      Todavía no hay documentos cargados para este llamado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form
            action={subirDocumento.bind(null, llamadoId)}
            encType="multipart/form-data"
            className="grid grid-cols-1 gap-4 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <label className={labelClass}>Categoría</label>
              <select name="categoria" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Seleccionar…
                </option>
                {CATEGORIAS_DOCUMENTO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Subcategoría</label>
              <input type="text" name="subcategoria" className={inputClass} placeholder="Opcional" />
            </div>
            <div>
              <label className={labelClass}>Archivo</label>
              <input type="file" name="archivo" required className={inputClass} />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Subir documento
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
