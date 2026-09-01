// Catálogo fijo de roles — debe coincidir exactamente con el CHECK constraint
// `usuario_rol_check` en la base (ver migración 005). Cualquier cambio acá
// tiene que reflejarse también en la base, y viceversa.
export const ROLES_USUARIO = [
  "UOC",
  "DOP",
  "Comite_Evaluacion",
  "Administrador",
  "Financiero",
  "Consulta",
] as const;

export type RolUsuario = (typeof ROLES_USUARIO)[number];

export const DESCRIPCION_ROL: Record<RolUsuario, string> = {
  UOC: "UOC — Unidad Operativa de Contrataciones",
  DOP: "DOP — Dirección de Obras y Proyectos",
  Comite_Evaluacion: "Comité de Evaluación",
  Administrador: "Administrador — acceso completo, gestión de usuarios",
  Financiero: "Financiero — solo módulo Financiero",
  Consulta: "Consulta — solo lectura de todo el sistema",
};
