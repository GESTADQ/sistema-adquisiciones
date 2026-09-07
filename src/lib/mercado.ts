// "Acceso al mercado" — Martin pidió un campo con 4 opciones (Nacional,
// Internacional, Competencia Abierta, Competencia Limitada). La base YA
// tenía dos columnas separadas para esto en `llamado`, cada una con su
// propio CHECK constraint, pero los formularios todavía las mostraban como
// texto libre (bug ya detectado en una sesión anterior):
//   - ambito_mercado    CHECK: 'Nacional' | 'Internacional'
//   - apertura_mercado  CHECK: 'Abierto' | 'Limitado'
// Martin confirmó reutilizar esas dos columnas como dos <select> separados
// en vez de crear una columna nueva "acceso_al_mercado" — es la opción que
// respeta el principio de dato único (no duplica un concepto que ya existe).
export const AMBITO_MERCADO_OPCIONES = ["Nacional", "Internacional"] as const;
export const APERTURA_MERCADO_OPCIONES = ["Abierto", "Limitado"] as const;
