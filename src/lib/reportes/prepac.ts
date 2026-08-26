import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

// Reporte PREPAC — un renglón por línea presupuestaria de cada llamado activo.
// Formato acordado con Martin: Orden N°, Descripción, Tipo de procedimiento,
// Fecha estimada, desglose presupuestario (Clase/Programa/Subprograma/
// Proyecto-Actividad/SGOG/F.F./O.F./Dpto/Cuenta), Plurianual (SI/NO), montos
// por ejercicio fiscal (columnas dinámicas según los ejercicios presentes en
// los datos) y Total.

type LineaPrepac = {
  monto: number | null;
  ejercicio_fiscal: number | null;
  clase: string | null;
  programa: string | null;
  subprograma: string | null;
  proyecto_actividad: string | null;
  sgog: string | null;
  fuente_financiamiento: string | null;
  organismo_financiador: string | null;
  departamento: string | null;
  cuenta: string | null;
};

type LlamadoPrepac = {
  id: string;
  nro_pac: string | null;
  objeto_llamado: string | null;
  nombre_llamado: string | null;
  fecha_estimada_llamado: string | null;
  plurianualidad: boolean | null;
  monto_total: number;
  moneda: string;
  modalidad: { nombre: string } | null;
  llamado_linea_presupuestaria: LineaPrepac[];
};

const HEADER_FIJO = [
  "Orden N°",
  "Descripción",
  "Tipo de procedimiento",
  "Fecha estimada",
  "Clase",
  "Programa",
  "Subprograma",
  "Proyecto/Actividad",
  "SGOG",
  "F.F.",
  "O.F.",
  "Dpto",
  "Cuenta",
  "Plurianual",
];

function formatFecha(fecha: string | null): string {
  if (!fecha) return "";
  const d = new Date(fecha + "T00:00:00");
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-PY");
}

export async function generarPrepacWorkbook(): Promise<ExcelJS.Workbook> {
  const supabase = await createClient();

  const { data: llamados, error } = await supabase
    .from("llamado")
    .select(
      `id, nro_pac, objeto_llamado, nombre_llamado, fecha_estimada_llamado, plurianualidad,
       monto_total, moneda,
       modalidad:modalidad_id(nombre),
       llamado_linea_presupuestaria(monto, ejercicio_fiscal, clase, programa, subprograma,
         proyecto_actividad, sgog, fuente_financiamiento, organismo_financiador, departamento, cuenta)`
    )
    .eq("estado_general", "Activo")
    .order("nro_pac");

  if (error) {
    throw new Error(`No se pudo generar el PREPAC: ${error.message}`);
  }

  const filas = (llamados ?? []) as unknown as LlamadoPrepac[];

  // Ejercicios fiscales presentes en los datos, ordenados, para las columnas dinámicas de monto.
  const ejerciciosSet = new Set<number>();
  for (const l of filas) {
    for (const linea of l.llamado_linea_presupuestaria ?? []) {
      if (linea.ejercicio_fiscal != null) ejerciciosSet.add(linea.ejercicio_fiscal);
    }
  }
  const ejercicios = Array.from(ejerciciosSet).sort((a, b) => a - b);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Gestión de Adquisiciones — UEP-IE/MOPC";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("PREPAC", {
    views: [{ state: "frozen", ySplit: 1, xSplit: 2 }],
  });

  const header = [...HEADER_FIJO, ...ejercicios.map((e) => `Monto ${e}`), "Total"];
  sheet.addRow(header);
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A5F" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.height = 30;

  for (const l of filas) {
    const lineas = l.llamado_linea_presupuestaria ?? [];
    if (lineas.length === 0) {
      // Llamado sin líneas presupuestarias cargadas: igual aparece, una fila con los datos
      // generales y los montos por ejercicio en blanco.
      sheet.addRow([
        l.nro_pac ?? "",
        l.nombre_llamado || l.objeto_llamado || "",
        l.modalidad?.nombre ?? "",
        formatFecha(l.fecha_estimada_llamado),
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        l.plurianualidad ? "SI" : "NO",
        ...ejercicios.map(() => ""),
        l.monto_total,
      ]);
      continue;
    }

    for (const linea of lineas) {
      const montosPorEjercicio = ejercicios.map((e) =>
        linea.ejercicio_fiscal === e ? (linea.monto ?? 0) : ""
      );
      sheet.addRow([
        l.nro_pac ?? "",
        l.nombre_llamado || l.objeto_llamado || "",
        l.modalidad?.nombre ?? "",
        formatFecha(l.fecha_estimada_llamado),
        linea.clase ?? "",
        linea.programa ?? "",
        linea.subprograma ?? "",
        linea.proyecto_actividad ?? "",
        linea.sgog ?? "",
        linea.fuente_financiamiento ?? "",
        linea.organismo_financiador ?? "",
        linea.departamento ?? "",
        linea.cuenta ?? "",
        l.plurianualidad ? "SI" : "NO",
        ...montosPorEjercicio,
        l.monto_total,
      ]);
    }
  }

  // Formato numérico para las columnas de monto (dinámicas + Total).
  const primeraColumnaMonto = HEADER_FIJO.length + 1;
  const ultimaColumnaMonto = header.length;
  for (let col = primeraColumnaMonto; col <= ultimaColumnaMonto; col++) {
    sheet.getColumn(col).numFmt = "#,##0";
    sheet.getColumn(col).alignment = { horizontal: "right" };
  }

  sheet.columns.forEach((col, idx) => {
    if (idx < HEADER_FIJO.length) {
      col.width = idx === 1 ? 45 : 16;
    } else {
      col.width = 16;
    }
  });

  return workbook;
}
