import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default async function ProveedoresPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: proveedores, error } = await supabase
    .from("proveedor")
    .select("id, razon_social, ruc, inhabilitado, motivo_inhabilitacion")
    .order("razon_social");

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/proveedores" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Proveedores</h1>
            <p className="text-sm text-slate-500">{proveedores?.length ?? 0} proveedores registrados</p>
          </div>
          <Link
            href="/proveedores/nuevo"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nuevo proveedor
          </Link>
        </div>
      </header>

      <main className="p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No se pudo cargar el listado de proveedores: {error.message}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Razón social</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">RUC</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Estado</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proveedores?.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">
                    <Link href={`/proveedores/${p.id}/editar`} className="text-blue-600 hover:underline">
                      {p.razon_social}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{p.ruc ?? "—"}</td>
                  <td className="px-4 py-2">
                    {p.inhabilitado ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        Inhabilitado{p.motivo_inhabilitacion ? ` — ${p.motivo_inhabilitacion}` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        Habilitado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/proveedores/${p.id}/editar`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {proveedores?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Todavía no hay proveedores cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
