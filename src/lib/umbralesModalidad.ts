// Umbrales para Enfoques de Mercado y Métodos del Banco Mundial para Paraguay
// (Región LAC), en USD. Fuente: "Umbrales para Enfoques de Mercado y Métodos
// (US$ miles)" — Junio 2023 (archivo Umbrales_BM.pdf recibido de Martin el
// 2/10/2026). La tabla original está en miles de USD; acá ya están
// convertidos a USD enteros para comparar directo contra
// monto_total/monto_estimado_usd del llamado.
//
// La tabla distingue 3 categorías según el Objeto del llamado (catálogo
// OBJETO_LLAMADO_OPCIONES):
// - Obras
// - Bienes, IT y Servicios de no consultoría → acá "Bienes" y "Servicios de
//   No Consultoría"
// - Lista Corta de Consultores Nacionales → acá "Consultoría Firmas" y
//   "Consultoría Individual"
//
// Jornal mínimo diario (Gs. 117.077, dato de Martin 2/10/2026): NO forma
// parte de esta tabla de umbrales de métodos — Martin aclaró que la
// modalidad de Contratación Directa no tiene monto mínimo ni máximo. Por
// ahora este valor no se usa en los cálculos de abajo; queda documentado acá
// para no perderlo si en el futuro se define su uso exacto (dato único: si
// se usa en algo más, el valor vive en esta misma constante).
export const JORNAL_MINIMO_DIARIO_GS = 117077;

export const UMBRALES_OBRAS_USD = {
  sdcHasta: 250_000,
  internacionalDesde: 15_000_000,
};

export const UMBRALES_BIENES_SERVICIOS_NO_CONSULTORIA_USD = {
  sdcHasta: 50_000,
  internacionalDesde: 3_000_000,
};

export const UMBRAL_CONSULTORIA_LISTA_NACIONAL_USD = 200_000;

function formatUsd(monto: number): string {
  return new Intl.NumberFormat("es-PY", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    monto
  );
}

// Devuelve un aviso (NO bloqueante — pedido explícito de Martin, 2/10/2026)
// si el monto estimado en USD del llamado no coincide con el umbral de la
// Modalidad/Método elegida, según el Objeto del llamado. Devuelve null si no
// hay nada para avisar — incluye a propósito los casos donde la modalidad
// elegida no tiene un umbral claro en la tabla fuente (Contratación Directa,
// Menor cuantía, Solicitud de Ofertas genérica, Licitación Pública genérica
// sin Internacional/Nacional, y los métodos de selección de consultores
// específicos): no se inventan reglas para esos casos.
export function avisoUmbralModalidad(
  objetoLlamado: string | null,
  modalidadNombre: string | null,
  montoUsd: number | null
): string | null {
  if (!objetoLlamado || !modalidadNombre || montoUsd === null) return null;

  if (objetoLlamado === "Obras" || objetoLlamado === "Bienes" || objetoLlamado === "Servicios de No Consultoría") {
    const u = objetoLlamado === "Obras" ? UMBRALES_OBRAS_USD : UMBRALES_BIENES_SERVICIOS_NO_CONSULTORIA_USD;
    const etiquetaCategoria = objetoLlamado === "Obras" ? "Obras" : "Bienes/Servicios de No Consultoría";

    if (modalidadNombre === "Solicitud de Cotización (SDC)" && montoUsd > u.sdcHasta) {
      return `El monto estimado (${formatUsd(montoUsd)}) supera el umbral de SDC para ${etiquetaCategoria} (hasta ${formatUsd(
        u.sdcHasta
      )}) — verificá si corresponde Licitación Pública Nacional o Internacional.`;
    }
    if (modalidadNombre === "Licitación Pública Nacional (LPN)") {
      if (montoUsd <= u.sdcHasta) {
        return `El monto estimado (${formatUsd(montoUsd)}) está por debajo del umbral de SDC para ${etiquetaCategoria} (${formatUsd(
          u.sdcHasta
        )}) — verificá si corresponde Solicitud de Cotización (SDC) en lugar de Licitación Pública Nacional.`;
      }
      if (montoUsd >= u.internacionalDesde) {
        return `El monto estimado (${formatUsd(montoUsd)}) alcanza el umbral internacional para ${etiquetaCategoria} (desde ${formatUsd(
          u.internacionalDesde
        )}) — verificá si corresponde Licitación Pública Internacional en lugar de Nacional.`;
      }
    }
    if (modalidadNombre === "Licitación Pública Internacional (LPI)" && montoUsd < u.internacionalDesde) {
      return `El monto estimado (${formatUsd(montoUsd)}) no alcanza el umbral internacional para ${etiquetaCategoria} (desde ${formatUsd(
        u.internacionalDesde
      )}) — verificá si corresponde Licitación Pública Nacional en lugar de Internacional.`;
    }
    return null;
  }

  if (objetoLlamado === "Consultoría Firmas" || objetoLlamado === "Consultoría Individual") {
    if (montoUsd >= UMBRAL_CONSULTORIA_LISTA_NACIONAL_USD) {
      return `El monto estimado (${formatUsd(
        montoUsd
      )}) alcanza o supera ${formatUsd(UMBRAL_CONSULTORIA_LISTA_NACIONAL_USD)} — según los umbrales BM, a partir de ese monto la lista corta no puede restringirse a consultores nacionales.`;
    }
    return null;
  }

  return null;
}
