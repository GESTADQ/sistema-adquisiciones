// Catálogo fijo de "Departamento" para la línea presupuestaria del PAC.
// Pedido de Martin (2/10/2026): selector 01-17 + 99, en vez de texto libre.
// Códigos y nombres oficiales de los departamentos de la República del
// Paraguay (DGEEC); el código 99 se usa por convención para Asunción,
// Distrito Capital, que no es un departamento.
export type Departamento = {
  codigo: string;
  nombre: string;
};

export const DEPARTAMENTOS: Departamento[] = [
  { codigo: "01", nombre: "Concepción" },
  { codigo: "02", nombre: "San Pedro" },
  { codigo: "03", nombre: "Cordillera" },
  { codigo: "04", nombre: "Guairá" },
  { codigo: "05", nombre: "Caaguazú" },
  { codigo: "06", nombre: "Caazapá" },
  { codigo: "07", nombre: "Itapúa" },
  { codigo: "08", nombre: "Misiones" },
  { codigo: "09", nombre: "Paraguarí" },
  { codigo: "10", nombre: "Alto Paraná" },
  { codigo: "11", nombre: "Central" },
  { codigo: "12", nombre: "Ñeembucú" },
  { codigo: "13", nombre: "Amambay" },
  { codigo: "14", nombre: "Canindeyú" },
  { codigo: "15", nombre: "Presidente Hayes" },
  { codigo: "16", nombre: "Alto Paraguay" },
  { codigo: "17", nombre: "Boquerón" },
  { codigo: "99", nombre: "Asunción (Distrito Capital)" },
];

export function valorDepartamento(d: Departamento): string {
  return `${d.codigo} · ${d.nombre}`;
}
