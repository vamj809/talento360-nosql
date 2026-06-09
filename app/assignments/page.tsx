import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { assignmentStatusLabel, getAssignmentsSummary } from "@/lib/queries";
import { formatPercent } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const rows = await getAssignmentsSummary();

  return (
    <main className="page">
      <section className="page-header">
        <h1>Asignaciones de evaluación</h1>
        <p>
          Resumen por empleado evaluado. Para fines de demostración académica se
          muestran tokens que permiten entrar al formulario anónimo.
        </p>
      </section>

      {rows.length === 0 ? (
        <EmptyState
          message="Ejecute npm run seed para generar asignaciones."
          title="Sin asignaciones"
        />
      ) : (
        <DataTable
          headers={[
            "Empleado evaluado",
            "Departamento",
            "Total",
            "Completadas",
            "Pendientes",
            "Avance",
            "Token demo",
          ]}
        >
          {rows.map((row) => (
            <tr key={row.evaluatedId}>
              <td>
                <strong>{row.employeeName}</strong>
                <br />
                <span className="muted">{row.employeeCode}</span>
              </td>
              <td>{row.department}</td>
              <td>{row.total}</td>
              <td>{row.completed}</td>
              <td>{row.pending}</td>
              <td>{formatPercent(row.completionRate)}</td>
              <td>
                <Link href={`/evaluate/${row.sampleToken}`}>
                  <span className="mono">{row.sampleToken}</span>
                </Link>
                <br />
                <span
                  className={`badge ${
                    row.sampleStatus === "completed"
                      ? "badge-success"
                      : "badge-warning"
                  }`}
                >
                  {assignmentStatusLabel(row.sampleStatus)}
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </main>
  );
}
