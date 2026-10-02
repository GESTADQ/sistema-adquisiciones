// Catálogo fijo de "Número de etapas" / "Número de sobres" del proceso de
// adquisiciones STEP (Banco Mundial). Pedido de Martin (2/10/2026).
// Reemplazan en los formularios al campo histórico `requisitos_calificacion`
// ("Una Etapa - Un Sobre" / "Una Etapa - Dos Sobres"), que se mantiene en la
// base de datos sin cambios (dato único: ya no se pide por pantalla, pero no
// se borra ni se pierde el histórico ya cargado).
export const NUMERO_ETAPAS_OPCIONES = ["Una", "Dos"] as const;
export const NUMERO_SOBRES_OPCIONES = ["Uno", "Dos"] as const;
