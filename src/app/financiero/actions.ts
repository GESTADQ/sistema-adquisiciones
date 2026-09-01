"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// `movimiento_financiero` es un libro mayor (ledger): cada llamado puede tener
// muchos movimientos a lo largo de su ciclo de vida (Estimado en Planificación,
// Comprometido en Adjudicación, Devengado/Pagado en Gestión Contractual). No
// aplica el patrón de "dato único" de una sola fila por llamado — cada carga es
// un registro nuevo e independiente, igual que hitos/certificaciones de contrato.
export async function crearMovimiento(llamadoId: string, formData: FormData) {
  const supabase = await createClient();

  const etapa = str(formData, "etapa");
  const monto = num(formData, "monto");
  const fecha = str(formData, "fecha");
  if (!etapa || monto === null || !fecha) {
    throw new Error("Debe indicar etapa, monto y fecha del movimiento.");
  }

  const payload = {
    llamado_id: llamadoId,
    objeto_gasto_id: str(formData, "objeto_gasto_id"),
    componente_id: str(formData, "componente_id"),
    etapa,
    monto,
    fecha,
    referencia: str(formData, "referencia"),
  };

  const { error } = await supabase.from("movimiento_financiero").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath(`/financiero/${llamadoId}`);
  revalidatePath("/financiero");
  redirect(`/financiero/${llamadoId}`);
}

// `movimiento_financiero` es un registro principal (un movimiento financiero
// real, no un detalle interno de otro formulario) — su baja es irreversible y
// queda un snapshot en `auditoria` antes de borrarlo.
export async function eliminarMovimiento(movimientoId: string, llamadoId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: fila } = await supabase
    .from("movimiento_financiero")
    .select("*")
    .eq("id", movimientoId)
    .maybeSingle();

  const { error } = await supabase.from("movimiento_financiero").delete().eq("id", movimientoId);
  if (error) throw new Error(error.message);

  if (fila) {
    const { error: errorAuditoria } = await supabase.from("auditoria").insert({
      tabla_afectada: "movimiento_financiero",
      registro_id: movimientoId,
      accion: "eliminar",
      usuario_id: user?.id ?? null,
      snapshot: fila,
    });
    if (errorAuditoria) {
      // No frenamos la baja por esto (ya se ejecutó), pero no queremos que
      // quede en silencio si el registro de auditoría falla.
      console.error("No se pudo registrar auditoría de eliminarMovimiento:", errorAuditoria.message);
    }
  }

  revalidatePath(`/financiero/${llamadoId}`);
  revalidatePath("/financiero");
  redirect(`/financiero/${llamadoId}`);
}
