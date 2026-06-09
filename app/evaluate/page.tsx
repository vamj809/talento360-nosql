import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { relationTypeLabels } from "@/lib/formatters";
import { assignmentStatusLabel, getDemoTokens } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EvaluatePage() {
  const tokens = await getDemoTokens();

  return (
    <main className="page">
      <section className="page-header">
        <h1>Evaluación anónima</h1>
        <p>
          Seleccione un token de demostración. El formulario muestra a quién se
          evalúa, pero no muestra la identidad del evaluador.
        </p>
      </section>

      {tokens.length === 0 ? (
        <EmptyState
          message="Ejecute npm run seed para crear tokens de evaluación."
          title="No hay tokens disponibles"
        />
      ) : (
        <DataTable
          headers={[
            "Token",
            "Estado",
            "Empleado evaluado",
            "Departamento",
            "Relación",
          ]}
        >
          {tokens.map((token) => (
            <tr key={token.token}>
              <td>
                <Link href={`/evaluate/${token.token}`}>
                  <span className="mono">{token.token}</span>
                </Link>
              </td>
              <td>
                <span
                  className={`badge ${
                    token.status === "completed"
                      ? "badge-success"
                      : "badge-warning"
                  }`}
                >
                  {assignmentStatusLabel(token.status)}
                </span>
              </td>
              <td>{token.evaluatedName}</td>
              <td>{token.department}</td>
              <td>{relationTypeLabels[token.relationType]}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </main>
  );
}
