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
// Jornal mínimo diario (Gs. 117.077, dato de Martin 2/10/2026) — define el
// umbral en Guaraníes entre "Menor cuantía" y "Licitación Pública Nacional
// (LPN)" para Bienes/Obras/Servicios de No Consultoría: hasta 5.000 jornales
// mínimos corresponde Menor Cuantía, más de 5.000 corresponde LPN (aclarado
// por Martin, 2/10/2026). No tiene relación con la tabla de umbrales BM en
// USD de arriba (esa tabla rige SDC/LPN/LPI; esta otra rige Menor
// Cuantía/LPN) — son dos reglas de umbral distintas que pueden aplicar al
// mismo llamado, por eso avisoUmbralModalidad() acumula ambos avisos en vez
// de devolver uno solo. La modalidad de Contratación Directa no tiene monto
// mínimo ni máximo (aclarado por Martin, 2/10/2026) y no entra en ninguna de
// las dos reglas.
export const JORNAL_MINIMO_DIARIO_GS = 117077;
export const JORNALES_MINIMOS_LPN = 5000;

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

function formatGs(monto: number): string {
  return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(
    monto
  );
}

// Devuelve uno o más avisos (NO bloqueantes — pedido explícito de Martin,
// 2/10/2026), concatenados en un solo texto, si el monto del llamado no
// coincide con el umbral de la Modalidad/Método elegida. Devuelve null si no
// hay nada para avisar — incluye a propósito los casos donde la modalidad
// elegida no tiene un umbral claro en las fuentes (Contratación Directa,
// Solicitud de Ofertas genérica, Licitación Pública genérica sin
// Internacional/Nacional, y los métodos de selección de consultores
// específicos): no se inventan reglas para esos casos.
//
// Combina dos reglas de umbral independientes, que pueden aplicar juntas al
// mismo llamado:
// 1. Umbrales BM en USD (SDC/LPN/LPI, Umbrales_BM.pdf) — montoUsd.
// 2. Umbral en Guaraníes por jornales mínimos (Menor Cuantía/LPN, dato de
//    Martin 2/10/2026) — montoPyg.
export function avisoUmbralModalidad(
  objetoLlamado: string | null,
  modalidadNombre: string | null,
  montoUsd: number | null,
  montoPyg: number | null = null
): string | null {
  if (!objetoLlamado || !modalidadNombre) return null;

  const avisos: string[] = [];

  if (objetoLlamado === "Obras" || objetoLlamado === "Bienes" || objetoLlamado === "Servicios de No Consultoría") {
    const etiquetaCategoria = objetoLlamado === "Obras" ? "Obras" : "Bienes/Servicios de No Consultoría";

    if (montoUsd !== null) {
      const u = objetoLlamado === "Obras" ? UMBRALES_OBRAS_USD : UMBRALES_BIENES_SERVICIOS_NO_CONSULTORIA_USD;

      if (modalidadNombre === "Solicitud de Cotización (SDC)" && montoUsd > u.sdcHasta) {
        avisos.push(
          `El monto estimado (${formatUsd(montoUsd)}) supera el umbral de SDC para ${etiquetaCategoria} (hasta ${formatUsd(
            u.sdcHasta
          )}) — verificá si corresponde Licitación Pública Nacional o Internacional.`
        );
      }
      if (modalidadNombre === "Licitación Pública Nacional (LPN)") {
        if (montoUsd <= u.sdcHasta) {
          avisos.push(
            `El monto estimado (${formatUsd(montoUsd)}) está por debajo del umbral de SDC para ${etiquetaCategoria} (${formatUsd(
              u.sdcHasta
            )}) — verificá si corresponde Solicitud de Cotización (SDC) en lugar de Licitación Pública Nacional.`
          );
        }
        if (montoUsd >= u.internacionalDesde) {
          avisos.push(
            `El monto estimado (${formatUsd(montoUsd)}) alcanza el umbral internacional para ${etiquetaCategoria} (desde ${formatUsd(
              u.internacionalDesde
            )}) — verificá si corresponde Licitación Pública Internacional en lugar de Nacional.`
          );
        }
      }
      if (modalidadNombre === "Licitación Pública Internacional (LPI)" && montoUsd < u.internacionalDesde) {
        avisos.push(
          `El monto estimado (${formatUsd(montoUsd)}) no alcanza el umbral internacional para ${etiquetaCategoria} (desde ${formatUsd(
            u.internacionalDesde
          )}) — verificá si corresponde Licitación Pública Nacional en lugar de Internacional.`
        );
      }
    }

    // Umbral Menor Cuantía / LPN por jornales mínimos (Gs.) — independiente
    // del umbral BM en USD de arriba.
    if (montoPyg !== null) {
      const umbralPyg = JORNAL_MINIMO_DIARIO_GS * JORNALES_MINIMOS_LPN;
      if (modalidadNombre === "Menor cuantía" && montoPyg > umbralPyg) {
        avisos.push(
          `El monto estimado (${formatGs(montoPyg)}) supera los ${JORNALES_MINIMOS_LPN.toLocaleString(
            "es-PY"
          )} jornales mínimos (${formatGs(umbralPyg)}) — verificá si corresponde Licitación Pública Nacional en lugar de Menor Cuantía.`
        );
      }
      if (modalidadNombre === "Licitación Pública Nacional (LPN)" && montoPyg <= umbralPyg) {
        avisos.push(
          `El monto estimado (${formatGs(montoPyg)}) no alcanza los ${JORNALES_MINIMOS_LPN.toLocaleString(
            "es-PY"
          )} jornales mínimos (${formatGs(umbralPyg)}) — verificá si corresponde Menor Cuantía en lugar de Licitación Pública Nacional.`
        );
      }
    }

    return avisos.length > 0 ? avisos.join(" ") : null;
  }

  if (objetoLlamado === "Consultoría Firmas" || objetoLlamado === "Consultoría Individual") {
    if (montoUsd !== null && montoUsd >= UMBRAL_CONSULTORIA_LISTA_NACIONAL_USD) {
      return `El monto estimado (${formatUsd(
        montoUsd
      )}) alcanza o supera ${formatUsd(UMBRAL_CONSULTORIA_LISTA_NACIONAL_USD)} — según los umbrales BM, a partir de ese monto la lista corta no puede restringirse a consultores nacionales.`;
    }
    return null;
  }

  return null;
}
