// Catálogo fijo de hitos STEP (Banco Mundial) por categoría del llamado.
// No es configurable por el usuario — son los hitos formales de cada tipo de proceso.
// `soloReal` marca los hitos que en STEP solo tienen columna "Actual" (sin "Planned").

export type HitoDef = {
  label: string;
  soloReal?: boolean;
};

export const CATEGORIAS_LLAMADO = ["Bienes y Obras", "Consultor Individual", "Firmas Consultoras"] as const;

export type CategoriaLlamado = (typeof CATEGORIAS_LLAMADO)[number];

const HITOS_CONSULTOR_INDIVIDUAL: HitoDef[] = [
  { label: "Términos de Referencia" },
  { label: "Expresión de Interés" },
  { label: "Evaluación de Expresión de Interés y Lista Corta de Consultores" },
  { label: "Justificación de Selección Directa" },
  { label: "Invitación al Consultor Identificado/Seleccionado" },
  { label: "Borrador de Contrato Negociado" },
  { label: "Notificación de Intención de Adjudicación" },
  { label: "Contrato Firmado" },
  { label: "Enmiendas al Contrato", soloReal: true },
  { label: "Finalización del Contrato" },
  { label: "Terminación del Contrato", soloReal: true },
];

const HITOS_FIRMAS_CONSULTORAS: HitoDef[] = [
  { label: "Términos de Referencia" },
  { label: "Expresión de Interés" },
  { label: "Evaluación de Expresión de Interés y Lista Corta de Consultores" },
  { label: "Lista Corta y Borrador de Solicitud de Propuestas" },
  { label: "Solicitud de Propuestas Emitida" },
  { label: "Enmiendas a la Solicitud de Propuestas" },
  { label: "Apertura de Propuestas Técnicas / Acta" },
  { label: "Evaluación de Propuestas Técnicas" },
  { label: "Apertura de Propuestas Financieras / Acta" },
  { label: "Informe de Evaluación Combinada y Borrador de Contrato Negociado" },
  { label: "Notificación de Intención de Adjudicación" },
  { label: "Contrato Firmado" },
  { label: "Enmiendas al Contrato", soloReal: true },
  { label: "Finalización del Contrato" },
  { label: "Terminación del Contrato", soloReal: true },
];

const HITOS_BIENES_Y_OBRAS: HitoDef[] = [
  { label: "Borrador de Documentos de Precalificación" },
  { label: "Aviso Específico de Adquisición (Precalificación)" },
  { label: "Enmiendas a Documentos de Precalificación", soloReal: true },
  { label: "Apertura / Acta de Precalificación" },
  { label: "Informe de Evaluación de Precalificación" },
  { label: "Borrador de Documentos de Licitación" },
  { label: "Aviso Específico de Adquisición (Licitación)" },
  { label: "Invitación a Proveedores" },
  { label: "Enmiendas a Documentos de Licitación", soloReal: true },
  { label: "Presentación/Apertura de Ofertas / Acta" },
  { label: "Informe de Evaluación de Ofertas y Recomendación de Adjudicación" },
  { label: "Notificación de Intención de Adjudicación" },
  { label: "Contrato Firmado" },
  { label: "Enmiendas al Contrato", soloReal: true },
  { label: "Finalización del Contrato" },
  { label: "Terminación del Contrato", soloReal: true },
];

export const HITOS_POR_CATEGORIA: Record<CategoriaLlamado, HitoDef[]> = {
  "Bienes y Obras": HITOS_BIENES_Y_OBRAS,
  "Consultor Individual": HITOS_CONSULTOR_INDIVIDUAL,
  "Firmas Consultoras": HITOS_FIRMAS_CONSULTORAS,
};

export function esCategoriaLlamadoValida(valor: string | null | undefined): valor is CategoriaLlamado {
  return !!valor && (CATEGORIAS_LLAMADO as readonly string[]).includes(valor);
}
