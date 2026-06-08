import { getDb } from "@/lib/mongodb";

export default async function ReportsPage() {
  const db = await getDb();

  const employees = await db.collection("employees").find({}, { projection: { fullName: 1, department: 1, position: 1 } }).limit(20).toArray();

  return (
    <main style={{ padding: 32, fontFamily: "Arial" }}>
      <h1>Reportes individuales</h1>
      <ul>
        {employees.map(employee => (
          <li key={String(employee._id)}>
            <a href={`/reports/${employee._id}`}>{employee.fullName} - {employee.department} - {employee.position}</a>
          </li>
        ))}
      </ul>
      <p><a href="/">Volver</a></p>
    </main>
  );
}