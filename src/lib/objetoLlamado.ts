// Catálogo fijo del campo "Objeto del llamado" (Datos generales de Planificación).
// Pedido de Martin (7/9/2026): antes era texto libre; ahora se restringe a estas
// 5 opciones. No se agregó un CHECK constraint en la base porque los 53
// llamados cargados desde el tracker inicial tienen valores libres que no
// coinciden textualmente con este catálogo (ej. "CONSULTORIA INDIVIDUAL" en
// mayúsculas) — la restricción es solo a nivel de aplicación, para no romper
// esos registros históricos. Al editar un llamado cuyo valor actual no está en
// el catálogo, el <select> agrega ese valor como una opción extra ("valor
// actual, fuera de catálogo") para no perderlo ni forzar un cambio.
export const OBJETO_LLAMADO_OPCIONES = [
  "Bienes",
  "Obras",
  "Consultoría Firmas",
  "Consultoría Individual",
  "Servicios de No Consultoría",
] as const;
