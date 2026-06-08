import { getDb } from "@/lib/mongodb";

export default async function CyclesPage() {
  const db = await getDb();
  const cycle = await db.collection("evaluation_cycles").findOne({});

  return (
    <main style={{ padding: 32, fontFamily: "Arial" }}>
      <h1>Configuración del ciclo</h1>
      <p><b>Nombre:</b> {cycle?.name}</p>
      <p><b>Año:</b> {cycle?.year}</p>
      <p><b>Estado:</b> {cycle?.status}</p>
      <h2>Competencias</h2>
      <ul>{cycle?.competencies?.map((item: string) => <li key={item}>{item}</li>)}</ul>
      <p><a href="/">Volver</a></p>
    </main>
  );
}