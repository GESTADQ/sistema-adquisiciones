"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const BUCKET = "documentos";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

// El bucket "documentos" es privado (no público) — se sube vía Storage y se
// guarda en `documento.archivo_url` la RUTA dentro del bucket, no una URL
// pública. Para mostrar/descargar un documento se genera una signed URL al
// momento de renderizar la pantalla de detalle (ver [llamadoId]/page.tsx).
export async function subirDocumento(llamadoId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    throw new Error("Debe seleccionar un archivo.");
  }

  const categoria = str(formData, "categoria");
  if (!categoria) throw new Error("Debe indicar la categoría del documento.");

  const subcategoria = str(formData, "subcategoria");

  const rutaArchivo = `${llamadoId}/${crypto.randomUUID()}-${archivo.name}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(rutaArchivo, archivo);
  if (uploadError) throw new Error(`No se pudo subir el archivo: ${uploadError.message}`);

  const { error: insertError } = await supabase.from("documento").insert({
    llamado_id: llamadoId,
    categoria,
    subcategoria,
    archivo_url: rutaArchivo,
    usuario_id: user?.id ?? null,
  });

  if (insertError) {
    // si falla el insert en la tabla, no dejar el archivo huérfano en Storage
    await supabase.storage.from(BUCKET).remove([rutaArchivo]);
    throw new Error(insertError.message);
  }

  revalidatePath(`/documentos/${llamadoId}`);
  revalidatePath("/documentos");
  redirect(`/documentos/${llamadoId}`);
}

// `documento` es un registro principal (un archivo/expediente concreto, no un
// detalle interno de otro formulario) — su baja es irreversible (se borra el
// objeto del bucket) y por eso queda un snapshot en `auditoria` antes de
// borrarlo, a diferencia de las bajas de ítems/hitos/líneas secundarias que
// quedan fuera del alcance de Auditoría (ver ficha técnica).
export async function eliminarDocumento(documentoId: string, rutaArchivo: string, llamadoId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: fila } = await supabase
    .from("documento")
    .select("*")
    .eq("id", documentoId)
    .maybeSingle();

  await supabase.storage.from(BUCKET).remove([rutaArchivo]);

  const { error } = await supabase.from("documento").delete().eq("id", documentoId);
  if (error) throw new Error(error.message);

  if (fila) {
    await supabase.from("auditoria").insert({
      tabla_afectada: "documento",
      registro_id: documentoId,
      accion: "Eliminar",
      usuario_id: user?.id ?? null,
      snapshot: fila,
    });
  }

  revalidatePath(`/documentos/${llamadoId}`);
  revalidatePath("/documentos");
  redirect(`/documentos/${llamadoId}`);
}
