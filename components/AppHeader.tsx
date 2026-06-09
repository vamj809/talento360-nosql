import Link from "next/link";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/cycles", label: "Ciclos" },
  { href: "/employees", label: "Empleados" },
  { href: "/assignments", label: "Asignaciones" },
  { href: "/evaluate", label: "Evaluar" },
  { href: "/reports", label: "Reportes" },
  { href: "/dashboard/hr", label: "Dashboard RRHH" },
  { href: "/api/health", label: "Health" },
];

export function AppHeader() {
  return (
    <header className="app-header">
      <Link className="brand" href="/">
        Talento360°
      </Link>
      <nav aria-label="Navegación principal" className="main-nav">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
