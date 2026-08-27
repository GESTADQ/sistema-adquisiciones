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

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

// La tabla `adjudicacion` no tiene un constraint de unicidad sobre llamado_id,
// pero el flujo de esta pantalla trata "un llamado → una adjudicación" como
// la única combinación válida (dato único): si ya existe una fila para el
// llamado se actualiza esa, si no existe se crea.
export async function guardarAdjudicacion(llamadoId: string, formData: FormData) {
  const supabase = await createClient();

  const payload = {
    llamado_id: llamadoId,
    nro_resolucion: str(formData, "nro_resolucion"),
    monto_adjudicado: num(formData, "monto_adjudicado"),
    fecha_resolucion: str(formData, "fecha_resolucion"),
    fecha_notificacion: str(formData, "fecha_notificacion"),
    hubo_impugnacion: bool(formData, "hubo_impugnacion"),
  };

  const { data: existente } = await supabase
    .from("adjudicacion")
    .select("id")
    .eq("llamado_id", llamadoId)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase.from("adjudicacion").update(payload).eq("id", existente.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("adjudicacion").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/adjudicacion/${llamadoId}`);
  revalidatePath("/adjudicacion");
  redirect(`/adjudicacion/${llamadoId}`);
}

export async function crearItemAdjudicacion(adjudicacionId: string, llamadoId: string, formData: FormData) {
  const supabase = await createClient();

  const proveedorId = str(formData, "proveedor_id");
  if (!proveedorId) {
    throw new Error("Debe seleccionar un proveedor.");
  }

  const payload = {
    adjudicacion_id: adjudicacionId,
    item_lote: str(formData, "item_lote"),
    proveedor_id: proveedorId,
    monto_adjudicado: num(formData, "monto_adjudicado"),
  };

  const { error } = await supabase.from("adjudicacion_item").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath(`/adjudicacion/${llamadoId}`);
  redirect(`/adjudicacion/${llamadoId}`);
}

export async function eliminarItemAdjudicacion(itemId: string, llamadoId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("adjudicacion_item").delete().eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/adjudicacion/${llamadoId}`);
  redirect(`/adjudicacion/${llamadoId}`);
}
