const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/talento360";

const departments = ["Tecnología", "Finanzas", "Operaciones", "RRHH", "Ventas"];
const positions = ["Analista", "Coordinador", "Supervisor", "Gerente", "Especialista"];
const competencies = ["liderazgo", "comunicacion", "trabajo_equipo", "resultados", "innovacion"];

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomScore() {
  return Math.floor(Math.random() * 5) + 1;
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db();
  await db.collection("employees").deleteMany({});
  await db.collection("evaluation_cycles").deleteMany({});
  await db.collection("evaluation_assignments").deleteMany({});
  await db.collection("evaluations").deleteMany({});

  const employees = [];

  for (let index = 1; index <= 120; index++) {
    employees.push({
      employeeCode: `EMP${String(index).padStart(3, "0")}`,
      fullName: `Empleado ${index}`,
      department: randomFrom(departments),
      position: randomFrom(positions),
      level: index <= 10 ? "manager" : "staff",
      active: true,
      createdAt: new Date()
    });
  }

  const employeeResult = await db.collection("employees").insertMany(employees);
  const employeeIds = Object.values(employeeResult.insertedIds);

  const cycleResult = await db.collection("evaluation_cycles").insertOne({
    name: "Evaluación 360° - 2026",
    year: 2026,
    status: "active",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-30"),
    competencies,
    createdAt: new Date()
  });

  const cycleId = cycleResult.insertedId;
  const assignments = [];
  const evaluations = [];

  for (const evaluatedId of employeeIds) {
    const evaluators = employeeIds.filter(id => String(id) !== String(evaluatedId)).sort(() => 0.5 - Math.random()).slice(0, 4);

    for (let evaluatorIndex = 0; evaluatorIndex < evaluators.length; evaluatorIndex++) {
      const relationType = evaluatorIndex === 0 ? "manager" : evaluatorIndex === 1 ? "peer" : "subordinate";
      const token = crypto.randomBytes(12).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      assignments.push({
        cycleId,
        evaluatorId: evaluators[evaluatorIndex],
        evaluatedId,
        relationType,
        token,
        tokenHash,
        status: "completed",
        createdAt: new Date()
      });

      evaluations.push({
        cycleId,
        evaluatedId,
        relationType,
        tokenHash,
        scores: {
          liderazgo: randomScore(),
          comunicacion: randomScore(),
          trabajo_equipo: randomScore(),
          resultados: randomScore(),
          innovacion: randomScore()
        },
        anonymousComment: "Comentario anónimo de ejemplo para fines académicos.",
        submittedAt: new Date()
      });
    }
  }

  await db.collection("evaluation_assignments").insertMany(assignments);
  await db.collection("evaluations").insertMany(evaluations);

  await db.collection("employees").createIndex({ department: 1, active: 1, fullName: 1 });
  await db.collection("evaluation_assignments").createIndex({ cycleId: 1, evaluatedId: 1, status: 1 });
  await db.collection("evaluation_assignments").createIndex({ tokenHash: 1 }, { unique: true });
  await db.collection("evaluations").createIndex({ cycleId: 1, evaluatedId: 1, relationType: 1 });

  console.log("Seed completado");
  console.log(`Empleados: ${employeeIds.length}`);
  console.log(`Asignaciones: ${assignments.length}`);
  console.log(`Evaluaciones: ${evaluations.length}`);

  await client.close();
}

main().catch(console.error);