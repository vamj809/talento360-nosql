import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { getHealthSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

const navigationCards = [
  {
    href: "/cycles",
    title: "Ciclos",
    description: "Configuración del ciclo activo y competencias evaluadas.",
  },
  {
    href: "/employees",
    title: "Empleados",
    description: "Jerarquía organizacional con jefes y departamentos.",
  },
  {
    href: "/assignments",
    title: "Asignaciones",
    description: "Resumen de evaluadores asignados y tokens de demo.",
  },
  {
    href: "/evaluate",
    title: "Evaluación anónima",
    description: "Formulario para registrar calificaciones sin evaluatorId.",
  },
  {
    href: "/reports",
    title: "Reportes individuales",
    description: "Promedios por competencia y comentarios anónimos.",
  },
  {
    href: "/dashboard/hr",
    title: "Dashboard RRHH",
    description: "Agregados por departamento con cache Redis opcional.",
  },
];

export default async function Home() {
  let health: Awaited<ReturnType<typeof getHealthSummary>> | null = null;

  try {
    health = await getHealthSummary();
  } catch {
    health = null;
  }

  return (
    <main className="page">
      <section className="page-header">
        <h1>Talento360°</h1>
        <p>
          Plataforma académica full-stack en Next.js para evaluación de
          desempeño 360, usando MongoDB como base principal y Redis como cache
          con fallback para el dashboard de RRHH.
        </p>
      </section>

      <section className="grid grid-4 section" aria-label="Estado del sistema">
        <StatCard
          helper={health ? "MongoDB conectado" : "Revise MongoDB"}
          label="Estado"
          value={health?.status ?? "error"}
        />
        <StatCard
          helper="Colección employees"
          label="Empleados"
          value={health?.counts.employees ?? 0}
        />
        <StatCard
          helper="Asignaciones generadas"
          label="Asignaciones"
          value={health?.counts.assignments ?? 0}
        />
        <StatCard
          helper={`Redis: ${health?.redis ?? "unavailable"}`}
          label="Evaluaciones"
          value={health?.counts.evaluations ?? 0}
        />
      </section>

      <section className="section">
        <h2>Rutas principales</h2>
        <div className="grid grid-3">
          {navigationCards.map((card) => (
            <Link className="nav-card" href={card.href} key={card.href}>
              <strong>{card.title}</strong>
              <span>{card.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
