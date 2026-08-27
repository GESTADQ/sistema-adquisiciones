// Catálogo fijo a nivel de aplicación para la categoría de un documento del
// expediente. No hay CHECK constraint en la base para `documento.categoria`
// (columna text libre), pero se restringe acá para mantener consistencia y
// facilitar filtros/reportes futuros — es una convención de la app, no una
// regla de la base de datos.
export const CATEGORIAS_DOCUMENTO = [
  "SPD",
  "Resolución de Adjudicación",
  "Contrato",
  "Garantía",
  "Informe de Evaluación",
  "Comunicación Oficial",
  "Otro",
] as const;

export type CategoriaDocumento = (typeof CATEGORIAS_DOCUMENTO)[number];
