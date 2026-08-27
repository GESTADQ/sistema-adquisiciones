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

export async function eliminarMovimiento(movimientoId: string, llamadoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("movimiento_financiero").delete().eq("id", movimientoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/financiero/${llamadoId}`);
  revalidatePath("/financiero");
  redirect(`/financiero/${llamadoId}`);
}
