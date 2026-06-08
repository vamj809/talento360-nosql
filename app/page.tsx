export default function Home() {
  return (
    <main style={{ padding: 32, fontFamily: "Arial" }}>
      <h1>Talento360 NoSQL</h1>
      <p>Mini-aplicación para evaluación de desempeño 360° usando MongoDB.</p>

      <ul>
        <li><a href="/cycles">Configuración del ciclo</a></li>
        <li><a href="/assignments">Asignaciones de evaluación</a></li>
        <li><a href="/reports">Reportes individuales</a></li>
        <li><a href="/dashboard/hr">Dashboard RRHH</a></li>
      </ul>
    </main>
  );
}