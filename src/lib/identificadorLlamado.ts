// El N° de PAC recién se asigna cuando el llamado se sube al portal de la
// DNCP — durante toda la etapa de Planificación queda en blanco. El
// identificador de trabajo del día a día es el "N° de proceso interno"
// (asignado por UEP-IE/MOPC). Pedido de Martin (7/9/2026): mostrar los dos
// juntos en todas las pantallas que hoy muestran "N° PAC X" como
// identificador del llamado.
export function formatIdentificadorLlamado(
  nroProcesoInterno: string | null | undefined,
  nroPac: string | null | undefined
) {
  return `Proceso interno ${nroProcesoInterno || "—"} · PAC ${nroPac || "—"}`;
}
