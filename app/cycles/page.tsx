import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { cycleStatusLabels, formatDate } from "@/lib/formatters";
import { getCycleCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CyclesPage() {
  const { activeCycle, counts } = await getCycleCounts();

  return (
    <main className="page">
      <section className="page-header">
        <h1>Configuración del ciclo</h1>
        <p>
          Ciclo activo, rango de fechas, competencias evaluadas y conteos
          principales del sistema.
        </p>
      </section>

      <section className="grid grid-4">
        <StatCard label="Empleados" value={counts.employees} />
        <StatCard label="Ciclos" value={counts.cycles} />
        <StatCard label="Asignaciones" value={counts.assignments} />
        <StatCard label="Evaluaciones" value={counts.evaluations} />
      </section>

      {!activeCycle ? (
        <section className="section">
          <EmptyState
            message="Ejecute npm run seed para crear el ciclo activo."
            title="No hay ciclo activo"
          />
        </section>
      ) : (
        <>
          <section className="section info-panel">
            <p>
              <strong>Nombre:</strong> {activeCycle.name}
            </p>
            <p>
              <strong>Año:</strong> {activeCycle.year}
            </p>
            <p>
              <strong>Estado:</strong> {cycleStatusLabels[activeCycle.status]}
            </p>
            <p>
              <strong>Fechas:</strong> {formatDate(activeCycle.startDate)} -{" "}
              {formatDate(activeCycle.endDate)}
            </p>
          </section>

          <section className="section">
            <h2>Competencias</h2>
            <div className="grid grid-3">
              {activeCycle.competencies.map((competency) => (
                <article className="info-panel" key={competency.key}>
                  <p>
                    <strong>{competency.label}</strong>
                  </p>
                  <p className="muted">{competency.description}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
