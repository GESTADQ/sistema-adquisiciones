import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { crearProveedor } from "../actions";

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-slate-500";

export default async function NuevoProveedorPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav activo="/proveedores" />
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/proveedores" className="text-sm text-blue-600 hover:underline">
          ← Volver a Proveedores
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">Nuevo proveedor</h1>
      </header>

      <main className="p-6">
        <form action={crearProveedor} className="max-w-xl space-y-6 rounded-lg border border-slate-200 bg-white p-6">
          <div>
            <label className={labelClass}>Razón social *</label>
            <input name="razon_social" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>RUC</label>
            <input name="ruc" className={inputClass} />
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input name="inhabilitado" type="checkbox" className="rounded border-slate-300" />
              Inhabilitado
            </label>
            <div className="mt-3">
              <label className={labelClass}>Motivo de inhabilitación</label>
              <input name="motivo_inhabilitacion" className={inputClass} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Link
              href="/proveedores"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Crear proveedor
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
