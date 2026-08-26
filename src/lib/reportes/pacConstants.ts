// Datos fijos del encabezado del reporte PAC (Anexo B-02-02) — son los mismos para
// todos los llamados de este proyecto (PROYECTO TAPE / UEP-IE, MOPC), confirmados
// por Martin. No dependen del llamado ni deben editarse por pantalla.

export const PAC_ENCABEZADO_FIJO = {
  nivelEntidad: "12 PODER EJECUTIVO",
  entidad: "13 MINISTERIO DE OBRA PÚBLICAS Y COMUNICACIONES",
  uocUep: "UEP IE 9517",
  subUoc: "DIRECCION DE OBRAS PÚBLICAS",
  unidadJerarquica: "1000000",
  codigoSicp: "2020 – PROYECTO TEJIENDO APOYOS A LA EXCELENCIA EDUCATIVA (TAPE)",
} as const;
