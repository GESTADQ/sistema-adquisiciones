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

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function crearProveedor(formData: FormData) {
  const supabase = await createClient();

  const razonSocial = str(formData, "razon_social");
  if (!razonSocial) {
    throw new Error("Debe indicar la razón social del proveedor.");
  }

  const payload = {
    razon_social: razonSocial,
    ruc: str(formData, "ruc"),
    inhabilitado: bool(formData, "inhabilitado"),
    motivo_inhabilitacion: str(formData, "motivo_inhabilitacion"),
  };

  const { data, error } = await supabase.from("proveedor").insert(payload).select("id").single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el proveedor");
  }

  revalidatePath("/proveedores");
  redirect(`/proveedores/${data.id}/editar`);
}

export async function actualizarProveedor(id: string, formData: FormData) {
  const supabase = await createClient();

  const razonSocial = str(formData, "razon_social");
  if (!razonSocial) {
    throw new Error("Debe indicar la razón social del proveedor.");
  }

  const payload = {
    razon_social: razonSocial,
    ruc: str(formData, "ruc"),
    inhabilitado: bool(formData, "inhabilitado"),
    motivo_inhabilitacion: str(formData, "motivo_inhabilitacion"),
  };

  const { error } = await supabase.from("proveedor").update(payload).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${id}/editar`);
  redirect("/proveedores");
}
