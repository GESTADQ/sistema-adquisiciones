"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Recuperación de contraseña por olvido (pedido de Martin, 2/10/2026) —
// envía el link de reseteo de Supabase Auth al email ingresado. El mensaje
// de éxito es siempre el mismo exista o no esa cuenta, para no revelar qué
// emails están registrados en el sistema.
export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-contrasena`,
    });

    setLoading(false);

    if (error) {
      setError("No se pudo enviar el email de recuperación. Intentá de nuevo en unos minutos.");
      return;
    }

    setEnviado(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ingresá tu email y te mandamos un link para restablecer tu contraseña.
        </p>

        {enviado ? (
          <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Si ese email tiene una cuenta en el sistema, te enviamos un link para restablecer la contraseña. Revisá
            tu bandeja de entrada (y la carpeta de spam).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar link de recuperación"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← Volver a Ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
