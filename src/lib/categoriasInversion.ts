// Catálogo fijo de "Categoría de inversión" — sale del Cuadro de Costos del proyecto
// (columna "Componente del Proyecto TAPE" del archivo CUADRO_DE_COSTOS.xlsx, hoja "BM NUEVO").
// Se restringe a los rubros de costeo más granulares (nivel hoja) que tienen monto
// financiado por BIRF MOPC (columna "BIRF MOPC SNIP 1075") mayor a 0 — este sistema
// es de UEP-IE/MOPC, no incluye los rubros que financia exclusivamente el MEC.
// No confundir con `categoria_llamado` (Bienes y Obras / Consultor Individual / Firmas
// Consultoras), que es una clasificación totalmente distinta.

export type CategoriaInversion = {
  codigo: string;
  descripcion: string;
};

export const CATEGORIAS_INVERSION: CategoriaInversion[] = [
  { codigo: "1.1.1.1", descripcion: "Construcción y reparación de obras en 300 LEAP y 16 CAI" },
  { codigo: "1.1.1.2", descripcion: "Viáticos supervisión de proyecto/entrega de sitio (LEAP/CAI)" },
  { codigo: "1.1.1.3", descripcion: "Supervisión de proyectos (LEAP/CAI)" },
  { codigo: "1.1.1.4", descripcion: "Combustible para supervisión de obras (LEAP/CAI)" },
  { codigo: "1.1.1.5", descripcion: "Fiscalización 300 LEAP y 16 CAI" },
  { codigo: "1.2.1.1", descripcion: "Construcción y reparación 6 CEFED" },
  { codigo: "1.2.1.2", descripcion: "Viáticos supervisión de proyecto/entrega de sitio (CEFED)" },
  { codigo: "1.2.1.3", descripcion: "Supervisión de proyectos (CEFED)" },
  { codigo: "1.2.1.4", descripcion: "Combustible para supervisión de obras (CEFED)" },
  { codigo: "1.2.1.5", descripcion: "Fiscalización 6 CEFED" },
  { codigo: "4.1.1", descripcion: "Contratación de personal" },
  { codigo: "4.1.2", descripcion: "Adquisición de equipos" },
  { codigo: "4.1.3", descripcion: "Adquisición de vehículos" },
  { codigo: "4.1.4", descripcion: "Auditoría externa" },
  { codigo: "4.1.5", descripcion: "Comunicación" },
  { codigo: "4.1.6", descripcion: "Gastos operativos" },
];

// Valor que se guarda en `llamado.categoria_inversion` — código + descripción, para
// distinguir rubros con el mismo texto pero distinto código (ej. "Supervisión de
// proyectos" existe tanto para LEAP/CAI como para CEFED).
export function valorCategoriaInversion(c: CategoriaInversion): string {
  return `${c.codigo} · ${c.descripcion}`;
}

export const VALORES_CATEGORIA_INVERSION = CATEGORIAS_INVERSION.map(valorCategoriaInversion);

export function esCategoriaInversionValida(valor: string | null | undefined): boolean {
  return !!valor && VALORES_CATEGORIA_INVERSION.includes(valor);
}
