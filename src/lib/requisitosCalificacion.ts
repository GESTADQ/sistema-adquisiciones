// Catálogo fijo del campo nuevo "Requisitos de Calificación" (7/9/2026).
// No existía ningún campo equivalente en el modelo (se revisaron
// precalificacion, proceso_contratacion y opciones_evaluacion — ninguno
// coincide), así que es una columna nueva en `llamado` con CHECK constraint
// (sin riesgo de romper datos históricos: es un campo recién creado, todos
// los registros existentes empiezan en null).
export const REQUISITOS_CALIFICACION_OPCIONES = [
  "Una Etapa - Un Sobre",
  "Una Etapa - Dos Sobres",
] as const;
