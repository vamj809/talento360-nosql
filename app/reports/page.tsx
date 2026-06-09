import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { levelLabels } from "@/lib/formatters";
import { getEmployees } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const employees = await getEmployees({ limit: 120 });

  return (
    <main className="page">
      <section className="page-header">
        <h1>Reportes individuales</h1>
        <p>
          Seleccione un empleado para consultar promedios por competencia,
          promedios por tipo de relación y comentarios anónimos.
        </p>
      </section>

      {employees.length === 0 ? (
        <EmptyState
          message="Ejecute npm run seed para crear empleados y evaluaciones."
          title="No hay empleados"
        />
      ) : (
        <DataTable
          headers={[
            "Código",
            "Empleado",
            "Departamento",
            "Puesto",
            "Nivel",
            "Reporte",
          ]}
        >
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.employeeCode}</td>
              <td>{employee.fullName}</td>
              <td>{employee.department}</td>
              <td>{employee.position}</td>
              <td>{levelLabels[employee.level]}</td>
              <td>
                <Link href={`/reports/${employee.id}`}>Abrir reporte</Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </main>
  );
}
