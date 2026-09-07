// Modalidad/Método de contratación — depende del "Objeto del llamado".
// Pedido de Martin (7/9/2026): antes era una lista libre desde la tabla
// catálogo `modalidad`; ahora se restringe según dos grupos.
//
// La tabla `modalidad` sigue siendo la fuente de datos (FK modalidad_id en
// llamado, sin cambios) — se le agregó una columna `categoria` para poder
// filtrar el <select> según el "Objeto del llamado" elegido. Los 5 valores
// históricos ya cargados (usados por 47 de los 49 llamados con modalidad)
// quedaron taggeados con su categoría real y siguen apareciendo como
// opciones normales — no se ocultan ni se borran.
export const MODALIDAD_CATEGORIA_BIENES_OBRAS = "bienes_obras_no_consultoria" as const;
export const MODALIDAD_CATEGORIA_CONSULTORIA = "consultoria" as const;

export type ModalidadCategoria =
  | typeof MODALIDAD_CATEGORIA_BIENES_OBRAS
  | typeof MODALIDAD_CATEGORIA_CONSULTORIA;

// Determina el grupo de modalidades válido a partir del "Objeto del llamado".
// Funciona tanto con los 5 valores del catálogo nuevo (OBJETO_LLAMADO_OPCIONES)
// como con los valores libres históricos (ej. "SERVICIO DE CONSULTORIA",
// "CONSULTORIA INDIVIDUAL") — por eso la detección es por contenido de texto
// y no por igualdad exacta contra la lista de 5 opciones.
export function grupoModalidadPorObjeto(
  objetoLlamado: string | null | undefined
): ModalidadCategoria | null {
  if (!objetoLlamado) return null;
  const v = objetoLlamado.toLowerCase();
  if (v.includes("no consultor")) return MODALIDAD_CATEGORIA_BIENES_OBRAS;
  if (v.includes("consultor")) return MODALIDAD_CATEGORIA_CONSULTORIA;
  return MODALIDAD_CATEGORIA_BIENES_OBRAS;
}

export const MODALIDAD_CATEGORIA_LABEL: Record<ModalidadCategoria, string> = {
  [MODALIDAD_CATEGORIA_BIENES_OBRAS]: "Bienes, Obras y Servicios de No Consultoría",
  [MODALIDAD_CATEGORIA_CONSULTORIA]: "Servicios de Consultoría",
};
