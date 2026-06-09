import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { levelLabels } from "@/lib/formatters";
import { getDepartments, getEmployees } from "@/lib/queries";

export const dynamic = "force-dynamic";

type EmployeesPageProps = {
  searchParams: Promise<{
    department?: string;
  }>;
};

export default async function EmployeesPage({
  searchParams,
}: EmployeesPageProps) {
  const params = await searchParams;
  const department = params.department;
  const [departments, employees] = await Promise.all([
    getDepartments(),
    getEmployees({ department, limit: 50 }),
  ]);

  return (
    <main className="page">
      <section className="page-header">
        <h1>Empleados</h1>
        <p>
          Vista limitada a 50 empleados activos con referencias jerárquicas por
          managerId y enlace directo al reporte individual.
        </p>
      </section>

      <nav aria-label="Filtro por departamento" className="filters">
        <Link className={`filter-link ${!department ? "active" : ""}`} href="/employees">
          Todos
        </Link>
        {departments.map((item) => (
          <Link
            className={`filter-link ${department === item ? "active" : ""}`}
            href={`/employees?department=${encodeURIComponent(item)}`}
            key={item}
          >
            {item}
          </Link>
        ))}
      </nav>

      {employees.length === 0 ? (
        <EmptyState
          message="No hay empleados para el filtro seleccionado."
          title="Sin empleados"
        />
      ) : (
        <DataTable
          headers={[
            "Código",
            "Nombre",
            "Departamento",
            "Puesto",
            "Nivel",
            "Jefe",
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
              <td>{employee.managerName ?? "Sin jefe"}</td>
              <td>
                <Link href={`/reports/${employee.id}`}>Ver reporte</Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </main>
  );
}
