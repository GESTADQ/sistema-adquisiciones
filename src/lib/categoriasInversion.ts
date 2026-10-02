// Catálogo fijo de "Categoría de inversión" — sale del Cuadro de Costos del proyecto
// (columna "Componente del Proyecto TAPE" del archivo CUADRO_DE_COSTOS.xlsx, hoja "BM NUEVO").
// Se restringe a los rubros de costeo más granulares (nivel hoja) que tienen monto
// financiado por BIRF MOPC (columna "BIRF MOPC SNIP 1075") mayor a 0 — este sistema
// es de UEP-IE/MOPC, no incluye los rubros que financia exclusivamente el MEC.
// No confundir con `categoria_llamado` (Bienes y Obras / Consultor Individual / Firmas
// Consultoras), que es una clasificación totalmente distinta.
//
// `montoTopeUsd` es el tope de costeo de ese rubro (columna "BIRF MOPC SNIP 1075" del
// Cuadro de Costos, en USD) — pedido de Martin (2/10/2026), archivo CUADRO_DE_COSTOS.xlsx
// recibido ese día. Se usa en /planificacion para comparar lo comprometido en llamados
// contra el tope de cada rubro (dato único: el tope vive acá, junto al código/descripción
// del mismo rubro, no se duplica en otro archivo).

export type CategoriaInversion = {
  codigo: string;
  descripcion: string;
  montoTopeUsd: number;
};

export const CATEGORIAS_INVERSION: CategoriaInversion[] = [
  { codigo: "1.1.1.1", descripcion: "Construcción y reparación de obras en 300 LEAP y 16 CAI", montoTopeUsd: 85980000 },
  { codigo: "1.1.1.2", descripcion: "Viáticos supervisión de proyecto/entrega de sitio (LEAP/CAI)", montoTopeUsd: 204725 },
  { codigo: "1.1.1.3", descripcion: "Supervisión de proyectos (LEAP/CAI)", montoTopeUsd: 529112 },
  { codigo: "1.1.1.4", descripcion: "Combustible para supervisión de obras (LEAP/CAI)", montoTopeUsd: 304219 },
  { codigo: "1.1.1.5", descripcion: "Fiscalización 300 LEAP y 16 CAI", montoTopeUsd: 5600000 },
  { codigo: "1.2.1.1", descripcion: "Construcción y reparación 6 CEFED", montoTopeUsd: 6000000 },
  { codigo: "1.2.1.2", descripcion: "Viáticos supervisión de proyecto/entrega de sitio (CEFED)", montoTopeUsd: 25275 },
  { codigo: "1.2.1.3", descripcion: "Supervisión de proyectos (CEFED)", montoTopeUsd: 70888 },
  { codigo: "1.2.1.4", descripcion: "Combustible para supervisión de obras (CEFED)", montoTopeUsd: 25781 },
  { codigo: "1.2.1.5", descripcion: "Fiscalización 6 CEFED", montoTopeUsd: 300000 },
  { codigo: "4.1.1", descripcion: "Contratación de personal", montoTopeUsd: 3250000 },
  { codigo: "4.1.2", descripcion: "Adquisición de equipos", montoTopeUsd: 260000 },
  { codigo: "4.1.3", descripcion: "Adquisición de vehículos", montoTopeUsd: 100000 },
  { codigo: "4.1.4", descripcion: "Auditoría externa", montoTopeUsd: 400000 },
  { codigo: "4.1.5", descripcion: "Comunicación", montoTopeUsd: 200000 },
  { codigo: "4.1.6", descripcion: "Gastos operativos", montoTopeUsd: 940000 },
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

// Busca el rubro del Cuadro de Costos a partir del valor guardado en
// `llamado.categoria_inversion` ("código · descripción"), para poder leer su
// montoTopeUsd en el seguimiento de topes por rubro (/planificacion).
export function categoriaInversionPorValor(valor: string | null | undefined): CategoriaInversion | null {
  if (!valor) return null;
  return CATEGORIAS_INVERSION.find((c) => valorCategoriaInversion(c) === valor) ?? null;
}
