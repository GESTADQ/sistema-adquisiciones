import Link from "next/link";

// Nav transversal a todos los módulos. Se agrega un link acá recién cuando el
// módulo correspondiente ya tiene al menos una pantalla construida — evitar
// links muertos a secciones todavía no implementadas.
const MODULOS = [
  { href: "/planificacion", label: "Planificación" },
  { href: "/proveedores", label: "Proveedores" },
];

export default function AppNav({ activo }: { activo: string }) {
  return (
    <nav className="flex gap-1 overflow-x-auto bg-slate-900 px-6 py-2 text-sm">
      {MODULOS.map((m) => {
        const esActivo = activo === m.href;
        return (
          <Link
            key={m.href}
            href={m.href}
            className={`whitespace-nowrap rounded px-3 py-1.5 font-medium ${
              esActivo
                ? "bg-white text-slate-900"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
