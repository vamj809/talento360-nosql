import { getDb } from "@/lib/mongodb";

export default async function HrDashboardPage() {
  const db = await getDb();

  const dashboard = await db.collection("evaluations").aggregate([
    {
      $lookup: {
        from: "employees",
        localField: "evaluatedId",
        foreignField: "_id",
        as: "employee"
      }
    },
    { $unwind: "$employee" },
    {
      $group: {
        _id: "$employee.department",
        liderazgo: { $avg: "$scores.liderazgo" },
        comunicacion: { $avg: "$scores.comunicacion" },
        trabajo_equipo: { $avg: "$scores.trabajo_equipo" },
        resultados: { $avg: "$scores.resultados" },
        innovacion: { $avg: "$scores.innovacion" },
        totalEvaluaciones: { $sum: 1 }
      }
    },
    { $sort: { totalEvaluaciones: -1 } }
  ]).toArray();

  return (
    <main style={{ padding: 32, fontFamily: "Arial" }}>
      <h1>Dashboard agregado RRHH</h1>
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Departamento</th>
            <th>Liderazgo</th>
            <th>Comunicación</th>
            <th>Trabajo equipo</th>
            <th>Resultados</th>
            <th>Innovación</th>
            <th>Total evaluaciones</th>
          </tr>
        </thead>
        <tbody>
          {dashboard.map(row => (
            <tr key={row._id}>
              <td>{row._id}</td>
              <td>{row.liderazgo.toFixed(2)}</td>
              <td>{row.comunicacion.toFixed(2)}</td>
              <td>{row.trabajo_equipo.toFixed(2)}</td>
              <td>{row.resultados.toFixed(2)}</td>
              <td>{row.innovacion.toFixed(2)}</td>
              <td>{row.totalEvaluaciones}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><a href="/">Volver</a></p>
    </main>
  );
}