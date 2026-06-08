import { getDb } from "@/lib/mongodb";

export default async function AssignmentsPage() {
  const db = await getDb();

  const rows = await db.collection("evaluation_assignments").aggregate([
    { $group: { _id: "$evaluatedId", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
    { $limit: 20 }
  ]).toArray();

  return (
    <main style={{ padding: 32, fontFamily: "Arial" }}>
      <h1>Asignaciones de evaluación</h1>
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Empleado evaluado</th>
            <th>Total asignadas</th>
            <th>Completadas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={String(row._id)}>
              <td>{String(row._id)}</td>
              <td>{row.total}</td>
              <td>{row.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><a href="/">Volver</a></p>
    </main>
  );
}