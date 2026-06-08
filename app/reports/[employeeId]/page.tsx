import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function EmployeeReportPage({ params }: { params: { employeeId: string } }) {
  const db = await getDb();
  const employeeId = new ObjectId(params.employeeId);

  const employee = await db.collection("employees").findOne({ _id: employeeId });

  const report = await db.collection("evaluations").aggregate([
    { $match: { evaluatedId: employeeId } },
    {
      $group: {
        _id: "$relationType",
        liderazgo: { $avg: "$scores.liderazgo" },
        comunicacion: { $avg: "$scores.comunicacion" },
        trabajo_equipo: { $avg: "$scores.trabajo_equipo" },
        resultados: { $avg: "$scores.resultados" },
        innovacion: { $avg: "$scores.innovacion" },
        total: { $sum: 1 }
      }
    }
  ]).toArray();

  return (
    <main style={{ padding: 32, fontFamily: "Arial" }}>
      <h1>Reporte individual 360°</h1>
      <p><b>Empleado:</b> {employee?.fullName}</p>
      <p><b>Departamento:</b> {employee?.department}</p>

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Tipo evaluador</th>
            <th>Liderazgo</th>
            <th>Comunicación</th>
            <th>Trabajo equipo</th>
            <th>Resultados</th>
            <th>Innovación</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {report.map(row => (
            <tr key={row._id}>
              <td>{row._id}</td>
              <td>{row.liderazgo.toFixed(2)}</td>
              <td>{row.comunicacion.toFixed(2)}</td>
              <td>{row.trabajo_equipo.toFixed(2)}</td>
              <td>{row.resultados.toFixed(2)}</td>
              <td>{row.innovacion.toFixed(2)}</td>
              <td>{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>Nota: el reporte no muestra la identidad de los evaluadores.</p>
      <p><a href="/reports">Volver</a></p>
    </main>
  );
}