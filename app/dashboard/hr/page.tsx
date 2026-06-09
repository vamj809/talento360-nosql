import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import {
  competencyLabels,
  formatDateTime,
  formatPercent,
  formatScore,
} from "@/lib/formatters";
import { getHrDashboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

const cacheStatusLabels = {
  hit: "Disponible: leído desde Redis",
  "miss-stored": "Disponible: calculado en MongoDB y guardado en Redis",
  unavailable: "No disponible: usando MongoDB como fallback",
};

export default async function HrDashboardPage() {
  const dashboard = await getHrDashboard();
  const { data } = dashboard;

  return (
    <main className="page">
      <section className="page-header">
        <h1>Dashboard agregado RRHH</h1>
        <p>
          Promedios por departamento calculados con MongoDB Aggregation. Fuente
          de esta respuesta:{" "}
          <span className="badge badge-neutral">
            {dashboard.source === "redis-cache" ? "Redis cache" : "MongoDB"}
          </span>
        </p>
      </section>

      <section className="grid grid-4">
        <StatCard label="Empleados" value={data.totalEmployees} />
        <StatCard label="Evaluaciones" value={data.totalEvaluations} />
        <StatCard
          helper={`${data.completedAssignments} de ${data.totalAssignments}`}
          label="Avance"
          value={formatPercent(data.progressPercentage)}
        />
        <StatCard
          helper={`Menor: ${competencyLabels[data.lowestCompetency]}`}
          label="Competencia mayor"
          value={competencyLabels[data.highestCompetency]}
        />
      </section>

      <section className="section info-panel">
        <p>
          <strong>Generado:</strong> {formatDateTime(data.generatedAt)}
        </p>
        <p>
          <strong>Cache Redis:</strong>{" "}
          {cacheStatusLabels[dashboard.cacheStatus]}. TTL de 300 segundos con
          fallback a MongoDB.
        </p>
      </section>

      <section className="section">
        <h2>Promedios por departamento</h2>
        <DataTable
          headers={[
            "Departamento",
            "Liderazgo",
            "Comunicación",
            "Trabajo equipo",
            "Resultados",
            "Innovación",
            "Total evaluaciones",
            "Mayor",
            "Menor",
          ]}
        >
          {data.departments.map((row) => (
            <tr key={row.department}>
              <td>{row.department}</td>
              <td>{formatScore(row.scores.liderazgo)}</td>
              <td>{formatScore(row.scores.comunicacion)}</td>
              <td>{formatScore(row.scores.trabajo_equipo)}</td>
              <td>{formatScore(row.scores.resultados)}</td>
              <td>{formatScore(row.scores.innovacion)}</td>
              <td>{row.totalEvaluations}</td>
              <td>{competencyLabels[row.highestCompetency]}</td>
              <td>{competencyLabels[row.lowestCompetency]}</td>
            </tr>
          ))}
        </DataTable>
      </section>
    </main>
  );
}
