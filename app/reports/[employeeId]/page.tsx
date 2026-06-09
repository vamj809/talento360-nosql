import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import {
  competencyLabels,
  formatDateTime,
  formatScore,
  levelLabels,
  relationTypeLabels,
} from "@/lib/formatters";
import { getEmployeeReport } from "@/lib/queries";
import { competencyKeys } from "@/lib/types";

export const dynamic = "force-dynamic";

type EmployeeReportPageProps = {
  params: Promise<{
    employeeId: string;
  }>;
};

export default async function EmployeeReportPage({
  params,
}: EmployeeReportPageProps) {
  const { employeeId } = await params;
  const report = await getEmployeeReport(employeeId);

  if (!report) {
    return (
      <main className="page">
        <section className="page-header">
          <h1>Reporte no encontrado</h1>
          <p>El identificador recibido no corresponde a un empleado válido.</p>
        </section>
        <EmptyState
          message="Vuelva a la lista de reportes y seleccione un empleado."
          title="Empleado no encontrado"
        />
      </main>
    );
  }

  return (
    <main className="page">
      <section className="page-header">
        <h1>Reporte individual 360</h1>
        <p>
          La identidad de los evaluadores no se muestra en este reporte.
        </p>
      </section>

      <section className="section info-panel">
        <p>
          <strong>Empleado:</strong> {report.employee.fullName}
        </p>
        <p>
          <strong>Código:</strong> {report.employee.employeeCode}
        </p>
        <p>
          <strong>Departamento:</strong> {report.employee.department}
        </p>
        <p>
          <strong>Puesto:</strong> {report.employee.position}
        </p>
        <p>
          <strong>Nivel:</strong> {levelLabels[report.employee.level]}
        </p>
        <p>
          <strong>Jefe:</strong> {report.employee.managerName ?? "Sin jefe"}
        </p>
      </section>

      {!report.overall ? (
        <section className="section">
          <EmptyState
            message="Este empleado todavía no tiene evaluaciones completadas."
            title="Sin evaluaciones"
          />
        </section>
      ) : (
        <>
          <section className="section">
            <h2>Promedio general por competencia</h2>
            <DataTable headers={["Competencia", "Promedio", "Total recibido"]}>
              {competencyKeys.map((key) => (
                <tr key={key}>
                  <td>{competencyLabels[key]}</td>
                  <td>{formatScore(report.overall?.scores[key])}</td>
                  <td>{report.totalEvaluations}</td>
                </tr>
              ))}
            </DataTable>
          </section>

          <section className="section">
            <h2>Promedio por tipo de relación</h2>
            <DataTable
              headers={[
                "Relación",
                "Liderazgo",
                "Comunicación",
                "Trabajo equipo",
                "Resultados",
                "Innovación",
                "Total",
              ]}
            >
              {report.byRelation.map((row) => (
                <tr key={row.relationType}>
                  <td>{relationTypeLabels[row.relationType]}</td>
                  <td>{formatScore(row.scores.liderazgo)}</td>
                  <td>{formatScore(row.scores.comunicacion)}</td>
                  <td>{formatScore(row.scores.trabajo_equipo)}</td>
                  <td>{formatScore(row.scores.resultados)}</td>
                  <td>{formatScore(row.scores.innovacion)}</td>
                  <td>{row.total}</td>
                </tr>
              ))}
            </DataTable>
          </section>

          <section className="section">
            <h2>Comentarios anónimos</h2>
            {report.comments.length === 0 ? (
              <EmptyState
                message="No hay comentarios registrados para este empleado."
                title="Sin comentarios"
              />
            ) : (
              <div className="comments">
                {report.comments.map((comment) => (
                  <article
                    className="comment-item"
                    key={`${comment.submittedAt}-${comment.relationType}`}
                  >
                    <strong>{relationTypeLabels[comment.relationType]}</strong>
                    <p>{comment.anonymousComment}</p>
                    <span className="muted">
                      {formatDateTime(comment.submittedAt)}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section className="section">
        <Link className="button" href="/reports">
          Volver a reportes
        </Link>
      </section>
    </main>
  );
}
