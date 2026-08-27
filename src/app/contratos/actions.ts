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

// La tabla `contrato` no tiene constraint de unicidad sobre llamado_id, pero el
// flujo de esta pantalla trata "un llamado → un contrato" como la única
// combinación válida (dato único): si ya existe una fila para el llamado se
// actualiza esa, si no existe se crea.
export async function guardarContrato(llamadoId: string, adjudicacionId: string | null, formData: FormData) {
  const supabase = await createClient();

  const payload = {
    llamado_id: llamadoId,
    adjudicacion_id: adjudicacionId,
    administrador_contrato: str(formData, "administrador_contrato"),
    fecha_firma: str(formData, "fecha_firma"),
    fecha_orden_inicio: str(formData, "fecha_orden_inicio"),
    estado: str(formData, "estado") ?? "Vigente",
    nro_contrato_step: str(formData, "nro_contrato_step"),
    nro_contrato_mopc: str(formData, "nro_contrato_mopc"),
    codigo_contratacion_dncp: str(formData, "codigo_contratacion_dncp"),
    plazo: str(formData, "plazo"),
    fecha_vencimiento: str(formData, "fecha_vencimiento"),
  };

  const { data: existente } = await supabase
    .from("contrato")
    .select("id")
    .eq("llamado_id", llamadoId)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase.from("contrato").update(payload).eq("id", existente.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("contrato").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/contratos/${llamadoId}`);
  revalidatePath("/contratos");
  redirect(`/contratos/${llamadoId}`);
}

export async function crearHitoContrato(contratoId: string, llamadoId: string, formData: FormData) {
  const supabase = await createClient();

  const nombre = str(formData, "nombre");
  if (!nombre) throw new Error("Debe indicar el nombre del hito.");

  const payload = {
    contrato_id: contratoId,
    nombre,
    fecha_planificada: str(formData, "fecha_planificada"),
    fecha_real: str(formData, "fecha_real"),
    estado: str(formData, "estado") ?? "Pendiente",
  };

  const { error } = await supabase.from("contrato_hito").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath(`/contratos/${llamadoId}`);
  redirect(`/contratos/${llamadoId}`);
}

export async function eliminarHitoContrato(hitoId: string, llamadoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contrato_hito").delete().eq("id", hitoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/contratos/${llamadoId}`);
  redirect(`/contratos/${llamadoId}`);
}

export async function crearModificacionContrato(contratoId: string, llamadoId: string, formData: FormData) {
  const supabase = await createClient();

  const tipo = str(formData, "tipo");
  const fecha = str(formData, "fecha");
  if (!tipo || !fecha) throw new Error("Debe indicar tipo y fecha de la modificación.");

  const payload = {
    contrato_id: contratoId,
    tipo,
    fecha,
    detalle: str(formData, "detalle"),
  };

  const { error } = await supabase.from("contrato_modificacion").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath(`/contratos/${llamadoId}`);
  redirect(`/contratos/${llamadoId}`);
}

export async function eliminarModificacionContrato(modificacionId: string, llamadoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contrato_modificacion").delete().eq("id", modificacionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/contratos/${llamadoId}`);
  redirect(`/contratos/${llamadoId}`);
}

export async function crearCertificacionPago(contratoId: string, llamadoId: string, formData: FormData) {
  const supabase = await createClient();

  const tipo = str(formData, "tipo");
  const fecha = str(formData, "fecha");
  if (!tipo || !fecha) throw new Error("Debe indicar tipo y fecha de la certificación.");

  const payload = {
    contrato_id: contratoId,
    tipo,
    fecha,
    monto_devengado: num(formData, "monto_devengado"),
    monto_pagado: num(formData, "monto_pagado"),
  };

  const { error } = await supabase.from("contrato_certificacion_pago").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath(`/contratos/${llamadoId}`);
  redirect(`/contratos/${llamadoId}`);
}

export async function eliminarCertificacionPago(certificacionId: string, llamadoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contrato_certificacion_pago").delete().eq("id", certificacionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/contratos/${llamadoId}`);
  redirect(`/contratos/${llamadoId}`);
}
