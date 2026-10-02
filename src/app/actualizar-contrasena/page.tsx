"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Paso 2 de la recuperación de contraseña (pedido de Martin, 2/10/2026) —
// esta página la abre el link que llega por email desde
// /recuperar-contrasena. Supabase entrega una sesión de recuperación por el
// fragmento (#) de la URL, que el cliente de Supabase (createBrowserClient,
// detectSessionInUrl) procesa solo del lado del browser — por eso esta
// ruta tiene que ser pública en el middleware (ver src/lib/supabase/middleware.ts),
// si no el server redirige a /login antes de que el browser llegue a leer
// esa sesión.
export default function ActualizarContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listo, setListo] = useState(false);
  const [sesionValida, setSesionValida] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesionValida(!!session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError("No se pudo actualizar la contraseña. El link puede haber expirado — solicitá uno nuevo.");
      return;
    }

    setListo(true);
    setTimeout(() => {
      router.push("/planificacion");
      router.refresh();
    }, 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Actualizar contraseña</h1>

        {sesionValida === false && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            El link de recuperación no es válido o ya expiró. Solicitá uno nuevo desde{" "}
            <a href="/recuperar-contrasena" className="font-medium text-blue-700 hover:underline">
              Recuperar contraseña
            </a>
            .
          </p>
        )}

        {listo && (
          <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Contraseña actualizada. Te estamos redirigiendo...
          </p>
        )}

        {!listo && sesionValida !== false && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nueva contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Repetir contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || sesionValida === null}
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
