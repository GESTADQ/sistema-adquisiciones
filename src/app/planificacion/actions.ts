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

export async function crearLlamado(formData: FormData) {
  const supabase = await createClient();

  const uocId = str(formData, "uoc_id");
  if (!uocId) {
    throw new Error("Debe seleccionar una UOC.");
  }

  const payload = {
    nro_pac: str(formData, "nro_pac"),
    nro_step: str(formData, "nro_step"),
    uoc_id: uocId,
    modalidad_id: str(formData, "modalidad_id"),
    componente_id: str(formData, "componente_id"),
    objeto_llamado: str(formData, "objeto_llamado"),
    nombre_llamado: str(formData, "nombre_llamado"),
    moneda: str(formData, "moneda") ?? "PYG",
    monto_total: num(formData, "monto_total") ?? 0,
    monto_estimado_usd: num(formData, "monto_estimado_usd"),
    fecha_estimada_llamado: str(formData, "fecha_estimada_llamado"),
    estado_step: str(formData, "estado_step"),
    estado_actividad_step: str(formData, "estado_actividad_step"),
    tipo_revision: str(formData, "tipo_revision"),
    apertura_mercado: str(formData, "apertura_mercado"),
    ambito_mercado: str(formData, "ambito_mercado"),
    plurianualidad: bool(formData, "plurianualidad"),
    ad_referendum: bool(formData, "ad_referendum"),
  };

  const { data, error } = await supabase
    .from("llamado")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el llamado");
  }

  revalidatePath("/planificacion");
  redirect(`/planificacion/${data.id}`);
}

export async function actualizarLlamado(id: string, formData: FormData) {
  const supabase = await createClient();

  const uocId = str(formData, "uoc_id");
  if (!uocId) {
    throw new Error("Debe seleccionar una UOC.");
  }

  const payload = {
    nro_pac: str(formData, "nro_pac"),
    nro_step: str(formData, "nro_step"),
    uoc_id: uocId,
    modalidad_id: str(formData, "modalidad_id"),
    componente_id: str(formData, "componente_id"),
    objeto_llamado: str(formData, "objeto_llamado"),
    nombre_llamado: str(formData, "nombre_llamado"),
    moneda: str(formData, "moneda") ?? "PYG",
    monto_total: num(formData, "monto_total") ?? 0,
    monto_estimado_usd: num(formData, "monto_estimado_usd"),
    fecha_estimada_llamado: str(formData, "fecha_estimada_llamado"),
    estado_general: str(formData, "estado_general") ?? "Activo",
    estado_step: str(formData, "estado_step"),
    estado_actividad_step: str(formData, "estado_actividad_step"),
    tipo_revision: str(formData, "tipo_revision"),
    apertura_mercado: str(formData, "apertura_mercado"),
    ambito_mercado: str(formData, "ambito_mercado"),
    plurianualidad: bool(formData, "plurianualidad"),
    ad_referendum: bool(formData, "ad_referendum"),
    situacion_actual: str(formData, "situacion_actual"),
    etapa_interna_actual: str(formData, "etapa_interna_actual"),
    ultimo_seguimiento: str(formData, "ultimo_seguimiento"),
    proxima_accion: str(formData, "proxima_accion"),
    observaciones: str(formData, "observaciones"),
    actualizado_en: new Date().toISOString(),
  };

  const { error } = await supabase.from("llamado").update(payload).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/planificacion/${id}`);
  revalidatePath("/planificacion");
  redirect(`/planificacion/${id}`);
}

export async function crearLineaPresupuestaria(llamadoId: string, formData: FormData) {
  const supabase = await createClient();

  const payload = {
    llamado_id: llamadoId,
    programa: str(formData, "programa"),
    proyecto_actividad: str(formData, "proyecto_actividad"),
    sgog: str(formData, "sgog"),
    fuente_financiamiento: str(formData, "fuente_financiamiento"),
    organismo_financiador: str(formData, "organismo_financiador"),
    departamento: str(formData, "departamento"),
    monto: num(formData, "monto") ?? 0,
    ejercicio_fiscal: num(formData, "ejercicio_fiscal"),
    estructura_presupuestaria: str(formData, "estructura_presupuestaria"),
    objeto_gasto_id: str(formData, "objeto_gasto_id"),
  };

  const { error } = await supabase.from("llamado_linea_presupuestaria").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/planificacion/${llamadoId}`);
  redirect(`/planificacion/${llamadoId}`);
}

export async function eliminarLineaPresupuestaria(id: string, llamadoId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("llamado_linea_presupuestaria").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/planificacion/${llamadoId}`);
  redirect(`/planificacion/${llamadoId}`);
}

export async function crearEtapaCronograma(llamadoId: string, formData: FormData) {
  const supabase = await createClient();

  const etapaNombre = str(formData, "etapa_nombre");
  if (!etapaNombre) {
    throw new Error("Debe indicar el nombre de la etapa.");
  }

  const payload = {
    llamado_id: llamadoId,
    etapa_nombre: etapaNombre,
    fase: str(formData, "fase"),
    orden: num(formData, "orden"),
    fecha_original: str(formData, "fecha_original"),
    fecha_revisada: str(formData, "fecha_revisada"),
    fecha_real: str(formData, "fecha_real"),
    responsable: str(formData, "responsable"),
    nro_memo: str(formData, "nro_memo"),
    nro_nota: str(formData, "nro_nota"),
    detalle: str(formData, "detalle"),
  };

  const { error } = await supabase.from("cronograma_etapa").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/planificacion/${llamadoId}`);
  redirect(`/planificacion/${llamadoId}`);
}

export async function actualizarEtapaCronograma(id: string, llamadoId: string, formData: FormData) {
  const supabase = await createClient();

  const etapaNombre = str(formData, "etapa_nombre");
  if (!etapaNombre) {
    throw new Error("Debe indicar el nombre de la etapa.");
  }

  const payload = {
    etapa_nombre: etapaNombre,
    fase: str(formData, "fase"),
    orden: num(formData, "orden"),
    fecha_original: str(formData, "fecha_original"),
    fecha_revisada: str(formData, "fecha_revisada"),
    fecha_real: str(formData, "fecha_real"),
    responsable: str(formData, "responsable"),
    nro_memo: str(formData, "nro_memo"),
    nro_nota: str(formData, "nro_nota"),
    detalle: str(formData, "detalle"),
  };

  const { error } = await supabase.from("cronograma_etapa").update(payload).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/planificacion/${llamadoId}`);
  redirect(`/planificacion/${llamadoId}`);
}

export async function eliminarEtapaCronograma(id: string, llamadoId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("cronograma_etapa").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/planificacion/${llamadoId}`);
  redirect(`/planificacion/${llamadoId}`);
}
