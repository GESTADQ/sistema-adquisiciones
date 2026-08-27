import path from "path";
import fs from "fs/promises";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { PAC_ENCABEZADO_FIJO } from "./pacConstants";

// Reporte PAC — Anexo B-02-02 "Programa Anual de Contrataciones" (Ley N° 7.021/2022,
// Art. 27). A diferencia del PREPAC (que exporta TODOS los llamados en un solo listado),
// este reporte es un FORMULARIO OFICIAL de un único llamado por archivo, y se genera
// rellenando el template real bajado del Drive de Martin (carpeta PAC_STEP/2026/
// PRE_PAC+ANEXOS/Anexo B-02-02 Programa Anual de Contrataciones.xlsm), preservando su
// diseño, merges, bordes y texto instructivo tal cual los exige la DNCP — no se
// reconstruye la planilla desde cero con ExcelJS para evitar diferencias con el formato
// oficial.
//
// Direcciones de celda relevadas manualmente sobre la hoja "Anexo B-02-02 PAC" del
// template (fila header / fila dato, todas como primera celda de su merge si corresponde):
//   N13            → "EJERCICIO FISCAL <año>"
//   E14..E19       → valores del bloque fijo de entidad (PAC_ENCABEZADO_FIJO)
//   C23..P23       → Nro. PAC, Modalidad, Fecha estimada, Objeto del llamado, Moneda,
//                     Plurianualidad, Ad referendum, Monto total (fila 22 son los headers)
//   D28,F28,I28,L28,N28,P28 → montos por ejercicio fiscal (hasta 6 columnas: años en
//                     D27,F27,I27,L27,N27,P27)
//   M31:Q31        → Descripción del PAC (se reutiliza el mismo objeto/nombre del
//                     llamado — dato único, no se inventa un texto distinto)
//   C34,E34,M34    → Tabla 4: código catálogo / descripción / monto del único
//                     objeto_gasto del llamado (el esquema no admite más de uno por
//                     llamado, así que solo se completa la primera de las 7 filas)
//   Q41            → Total tabla 4
//   C44..Q44 (hasta C50..Q50) → desglose presupuestario por línea (Clase/Programa/
//                     Proyecto-Actividad/SGOG/F.F./O.F./Dpto./Monto) — una fila por
//                     línea presupuestaria, sin Subprograma ni Cuenta porque el
//                     formulario oficial no los pide
//   Q51            → Total del desglose presupuestario
//
// Campos del template SIN dato de origen en el sistema (se dejan en blanco para
// completar a mano, no se inventan): C31/D31:L31 "Categoría del bien..." (catálogo de
// 16 rubros de Hoja3 que no corresponde a ningún campo de `llamado`) y el renglón 52
// "Ley que rige el convenio".

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "src/lib/reportes/templates/anexo-b-02-02-pac.xlsm"
);

const HOJA_PAC = "Anexo B-02-02 PAC";
const COLUMNAS_ANIO = [4, 6, 9, 12, 14, 16]; // D, F, I, L, N, P — hasta 6 ejercicios fiscales
const MAX_FILAS_TABLA5 = 7; // filas 44 a 50

type LineaPac = {
  clase: string | null;
  programa: string | null;
  proyecto_actividad: string | null;
  sgog: string | null;
  fuente_financiamiento: string | null;
  organismo_financiador: string | null;
  departamento: string | null;
  monto: number | null;
  ejercicio_fiscal: number | null;
};

type LlamadoPac = {
  id: string;
  nro_pac: string | null;
  objeto_llamado: string | null;
  nombre_llamado: string | null;
  fecha_estimada_llamado: string | null;
  moneda: string;
  plurianualidad: boolean | null;
  ad_referendum: boolean | null;
  monto_total: number;
  modalidad: { nombre: string } | null;
  objeto_gasto: { codigo: string; descripcion: string } | null;
};

function monedaLabel(moneda: string | null): string {
  if (moneda === "USD") return "DÓLARES";
  if (moneda === "PYG") return "GUARANÍES";
  return "OTROS";
}

function siNo(valor: boolean | null): string {
  return valor ? "SI" : "NO";
}

export async function generarPacWorkbook(llamadoId: string): Promise<{
  workbook: ExcelJS.Workbook;
  nroPac: string;
}> {
  const supabase = await createClient();

  const { data: llamadoRaw, error } = await supabase
    .from("llamado")
    .select(
      `id, nro_pac, objeto_llamado, nombre_llamado, fecha_estimada_llamado, moneda,
       plurianualidad, ad_referendum, monto_total,
       modalidad:modalidad_id(nombre),
       objeto_gasto:objeto_gasto_id(codigo, descripcion)`
    )
    .eq("id", llamadoId)
    .single();

  if (error || !llamadoRaw) {
    throw new Error(`No se encontró el llamado para generar el PAC: ${error?.message ?? "sin datos"}`);
  }

  const llamado = llamadoRaw as unknown as LlamadoPac;

  const { data: lineasRaw, error: errorLineas } = await supabase
    .from("llamado_linea_presupuestaria")
    .select(
      "clase, programa, proyecto_actividad, sgog, fuente_financiamiento, organismo_financiador, departamento, monto, ejercicio_fiscal"
    )
    .eq("llamado_id", llamadoId)
    .order("ejercicio_fiscal");

  if (errorLineas) {
    throw new Error(`No se pudieron leer las líneas presupuestarias del llamado: ${errorLineas.message}`);
  }

  const lineas = (lineasRaw ?? []) as LineaPac[];

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
  const sheet = workbook.getWorksheet(HOJA_PAC);
  if (!sheet) {
    throw new Error(`El template del PAC no tiene la hoja "${HOJA_PAC}"`);
  }

  const descripcion = llamado.nombre_llamado || llamado.objeto_llamado || "";

  // Ejercicio fiscal base: el menor año presente en las líneas, o el año de la fecha
  // estimada del llamado si todavía no tiene líneas cargadas.
  const anios = lineas
    .map((l) => l.ejercicio_fiscal)
    .filter((a): a is number => a != null)
    .sort((a, b) => a - b);
  const anioBase =
    anios[0] ?? (llamado.fecha_estimada_llamado ? new Date(llamado.fecha_estimada_llamado).getFullYear() : new Date().getFullYear());

  // --- Encabezado fijo de entidad ---
  sheet.getCell(13, 14).value = `EJERCICIO FISCAL ${anioBase}`;
  sheet.getCell("E14").value = PAC_ENCABEZADO_FIJO.nivelEntidad;
  sheet.getCell("E15").value = PAC_ENCABEZADO_FIJO.entidad;
  sheet.getCell("E16").value = PAC_ENCABEZADO_FIJO.uocUep;
  sheet.getCell("E17").value = PAC_ENCABEZADO_FIJO.subUoc;
  sheet.getCell("E18").value = PAC_ENCABEZADO_FIJO.unidadJerarquica;
  sheet.getCell("E19").value = PAC_ENCABEZADO_FIJO.codigoSicp;

  // --- Tabla 1: datos generales del llamado (fila 23) ---
  sheet.getCell(23, 3).value = llamado.nro_pac ?? "";
  sheet.getCell(23, 4).value = llamado.modalidad?.nombre ?? "";
  const celdaFecha = sheet.getCell(23, 8);
  celdaFecha.value = llamado.fecha_estimada_llamado ? new Date(llamado.fecha_estimada_llamado) : null;
  celdaFecha.numFmt = "dd/mm/yyyy";
  sheet.getCell(23, 9).value = descripcion;
  sheet.getCell(23, 13).value = monedaLabel(llamado.moneda);
  sheet.getCell(23, 14).value = siNo(llamado.plurianualidad);
  sheet.getCell(23, 15).value = siNo(llamado.ad_referendum);
  const celdaMontoTotal = sheet.getCell(23, 16);
  celdaMontoTotal.value = llamado.monto_total ?? 0;
  celdaMontoTotal.numFmt = "#,##0";

  // --- Tabla 2: montos por ejercicio fiscal (filas 27/28, hasta 6 años) ---
  const montoPorAnio = new Map<number, number>();
  for (const l of lineas) {
    if (l.ejercicio_fiscal != null) {
      montoPorAnio.set(l.ejercicio_fiscal, (montoPorAnio.get(l.ejercicio_fiscal) ?? 0) + (l.monto ?? 0));
    }
  }
  COLUMNAS_ANIO.forEach((col, idx) => {
    const anio = anioBase + idx;
    sheet.getCell(27, col).value = anio;
    const celdaMonto = sheet.getCell(28, col);
    const monto = montoPorAnio.get(anio);
    celdaMonto.value = monto ?? "";
    celdaMonto.numFmt = "#,##0";
  });

  // --- Tabla 3: "Descripción del PAC" (se reutiliza el mismo texto que Objeto del
  // llamado — dato único). "Categoría del bien..." (C31/D31:L31) queda en blanco: no
  // hay campo de origen en `llamado` para ese catálogo de 16 rubros.
  sheet.getCell("M31").value = descripcion;

  // --- Tabla 4: catálogo (un solo renglón — el schema solo admite un objeto_gasto
  // por llamado) ---
  if (llamado.objeto_gasto) {
    sheet.getCell(34, 3).value = llamado.objeto_gasto.codigo;
    sheet.getCell(34, 5).value = llamado.objeto_gasto.descripcion;
    const celdaMontoCatalogo = sheet.getCell(34, 13);
    celdaMontoCatalogo.value = llamado.monto_total ?? 0;
    celdaMontoCatalogo.numFmt = "#,##0";
  }
  const celdaTotalTabla4 = sheet.getCell(41, 17);
  celdaTotalTabla4.value = llamado.monto_total ?? 0;
  celdaTotalTabla4.numFmt = "#,##0";

  // --- Tabla 5: desglose presupuestario por línea (filas 44 a 50, hasta 7 líneas) ---
  const lineasParaTabla = lineas.slice(0, MAX_FILAS_TABLA5);
  let totalTabla5 = 0;
  lineasParaTabla.forEach((l, idx) => {
    const fila = 44 + idx;
    sheet.getCell(fila, 3).value = l.clase ?? "";
    sheet.getCell(fila, 4).value = l.programa ?? "";
    sheet.getCell(fila, 5).value = l.proyecto_actividad ?? "";
    sheet.getCell(fila, 9).value = l.sgog ?? "";
    sheet.getCell(fila, 11).value = l.fuente_financiamiento ?? "";
    sheet.getCell(fila, 13).value = l.organismo_financiador ?? "";
    sheet.getCell(fila, 16).value = l.departamento ?? "";
    const celdaMontoLinea = sheet.getCell(fila, 17);
    celdaMontoLinea.value = l.monto ?? 0;
    celdaMontoLinea.numFmt = "#,##0";
    totalTabla5 += l.monto ?? 0;
  });
  const celdaTotalTabla5 = sheet.getCell(51, 17);
  celdaTotalTabla5.value = totalTabla5;
  celdaTotalTabla5.numFmt = "#,##0";

  return { workbook, nroPac: llamado.nro_pac ?? llamadoId };
}

// Se usa solo para validar en desarrollo que el template exista en el bundle desplegado.
export async function existeTemplatePac(): Promise<boolean> {
  try {
    await fs.access(TEMPLATE_PATH);
    return true;
  } catch {
    return false;
  }
}
