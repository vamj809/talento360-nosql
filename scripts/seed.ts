import crypto from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { ensureIndexes } from "../lib/collections";
import type {
  CompetencyDefinition,
  EmployeeDocument,
  EmployeeLevel,
  EvaluationAssignmentDocument,
  EvaluationDocument,
  RelationType,
  ScoreMap,
} from "../lib/types";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/talento360";

const departments = [
  "Tecnología",
  "Finanzas",
  "Operaciones",
  "Recursos Humanos",
  "Ventas",
];

const firstNames = [
  "Ana",
  "Carlos",
  "María",
  "José",
  "Laura",
  "Miguel",
  "Sofía",
  "Daniel",
  "Patricia",
  "Javier",
  "Gabriela",
  "Andrés",
  "Elena",
  "Ricardo",
  "Valeria",
  "Fernando",
  "Natalia",
  "Luis",
  "Camila",
  "Rafael",
];

const lastNames = [
  "García",
  "Rodríguez",
  "Martínez",
  "Hernández",
  "López",
  "Sánchez",
  "Pérez",
  "Gómez",
  "Díaz",
  "Torres",
  "Vargas",
  "Castillo",
  "Ramírez",
  "Mendoza",
  "Reyes",
  "Morales",
  "Ortiz",
  "Cruz",
  "Jiménez",
  "Núñez",
];

const competencies: CompetencyDefinition[] = [
  {
    description: "Capacidad para guiar, priorizar y sostener al equipo.",
    key: "liderazgo",
    label: "Liderazgo",
  },
  {
    description: "Claridad, escucha activa y calidad de la comunicación.",
    key: "comunicacion",
    label: "Comunicación",
  },
  {
    description: "Colaboración efectiva con pares, jefes y subordinados.",
    key: "trabajo_equipo",
    label: "Trabajo en equipo",
  },
  {
    description: "Cumplimiento de objetivos y orientación a indicadores.",
    key: "resultados",
    label: "Orientación a resultados",
  },
  {
    description: "Mejora continua, creatividad y adaptación al cambio.",
    key: "innovacion",
    label: "Innovación",
  },
];

const comments = [
  "Mantiene buena disposición para colaborar y resolver obstáculos.",
  "Puede mejorar la comunicación temprana de riesgos y dependencias.",
  "Demuestra compromiso con los objetivos del área.",
  "Aporta ideas útiles para simplificar procesos internos.",
  "Su seguimiento a los acuerdos ayuda a mantener el ritmo del equipo.",
  "Necesita reforzar la documentación de decisiones importantes.",
  "Gestiona bien las prioridades cuando hay presión operativa.",
  "Escucha retroalimentación y ajusta su forma de trabajo.",
];

type SeedEmployee = EmployeeDocument & {
  _id: ObjectId;
  managerKey: string | null;
  tempKey: string;
};

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const random = createRandom(20260608);

function pick<T>(items: T[]) {
  return items[Math.floor(random() * items.length)];
}

function employeeName(index: number) {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[(index * 7) % lastNames.length];
  const secondLastName = lastNames[(index * 11 + 3) % lastNames.length];
  return `${firstName} ${lastName} ${secondLastName}`;
}

function positionFor(level: EmployeeLevel, department: string) {
  const area = department === "Recursos Humanos" ? "RRHH" : department;
  const positions: Record<EmployeeLevel, string> = {
    director: `Director de ${area}`,
    manager: `Gerente de ${area}`,
    staff: `Analista de ${area}`,
    supervisor: `Supervisor de ${area}`,
  };

  return positions[level];
}

function scoreValue(relationType: RelationType) {
  const relationBias: Record<RelationType, number> = {
    manager: 0.1,
    peer: 0,
    self: 0.2,
    subordinate: -0.05,
  };
  const raw = 3 + relationBias[relationType] + random() * 2;
  return Math.max(1, Math.min(5, Math.round(raw)));
}

function buildScores(relationType: RelationType): ScoreMap {
  return {
    comunicacion: scoreValue(relationType),
    innovacion: scoreValue(relationType),
    liderazgo: scoreValue(relationType),
    resultados: scoreValue(relationType),
    trabajo_equipo: scoreValue(relationType),
  };
}

function buildEmployees() {
  const employees: SeedEmployee[] = [];
  let codeNumber = 1;

  for (const department of departments) {
    const departmentKey = department.toLowerCase().replace(/\s+/g, "-");
    const directorKey = `${departmentKey}-director`;

    employees.push({
      _id: new ObjectId(),
      active: true,
      createdAt: new Date(),
      department,
      employeeCode: `EMP${String(codeNumber++).padStart(3, "0")}`,
      fullName: employeeName(codeNumber),
      level: "director",
      managerId: null,
      managerKey: null,
      position: positionFor("director", department),
      tempKey: directorKey,
    });

    const managerKeys: string[] = [];
    for (let managerIndex = 1; managerIndex <= 3; managerIndex += 1) {
      const managerKey = `${departmentKey}-manager-${managerIndex}`;
      managerKeys.push(managerKey);
      employees.push({
        _id: new ObjectId(),
        active: true,
        createdAt: new Date(),
        department,
        employeeCode: `EMP${String(codeNumber++).padStart(3, "0")}`,
        fullName: employeeName(codeNumber),
        level: "manager",
        managerId: null,
        managerKey: directorKey,
        position: positionFor("manager", department),
        tempKey: managerKey,
      });
    }

    const supervisorKeys: string[] = [];
    for (let supervisorIndex = 1; supervisorIndex <= 6; supervisorIndex += 1) {
      const supervisorKey = `${departmentKey}-supervisor-${supervisorIndex}`;
      supervisorKeys.push(supervisorKey);
      employees.push({
        _id: new ObjectId(),
        active: true,
        createdAt: new Date(),
        department,
        employeeCode: `EMP${String(codeNumber++).padStart(3, "0")}`,
        fullName: employeeName(codeNumber),
        level: "supervisor",
        managerId: null,
        managerKey: managerKeys[(supervisorIndex - 1) % managerKeys.length],
        position: positionFor("supervisor", department),
        tempKey: supervisorKey,
      });
    }

    for (let staffIndex = 1; staffIndex <= 14; staffIndex += 1) {
      employees.push({
        _id: new ObjectId(),
        active: true,
        createdAt: new Date(),
        department,
        employeeCode: `EMP${String(codeNumber++).padStart(3, "0")}`,
        fullName: employeeName(codeNumber),
        level: "staff",
        managerId: null,
        managerKey: supervisorKeys[(staffIndex - 1) % supervisorKeys.length],
        position: positionFor("staff", department),
        tempKey: `${departmentKey}-staff-${staffIndex}`,
      });
    }
  }

  const idByKey = new Map(
    employees.map((employee) => [employee.tempKey, employee._id]),
  );

  for (const employee of employees) {
    if (!employee.managerKey) {
      employee.managerId = null;
      continue;
    }

    const managerId = idByKey.get(employee.managerKey);
    if (!managerId) {
      throw new Error(`No se encontró manager para ${employee.employeeCode}`);
    }

    employee.managerId = managerId;
  }

  return employees;
}

function createAssignment(
  cycleId: ObjectId,
  evaluatorId: ObjectId,
  evaluatedId: ObjectId,
  relationType: RelationType,
): EvaluationAssignmentDocument {
  const token = crypto.randomBytes(12).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return {
    completedAt: null,
    createdAt: new Date(),
    cycleId,
    evaluatedId,
    evaluatorId,
    relationType,
    status: "pending",
    token,
    tokenHash,
  };
}

function buildAssignments(cycleId: ObjectId, employees: EmployeeDocument[]) {
  const reportsByManager = new Map<string, EmployeeDocument[]>();

  for (const employee of employees) {
    if (!employee.managerId) {
      continue;
    }

    const managerKey = employee.managerId.toHexString();
    const reports = reportsByManager.get(managerKey) ?? [];
    reports.push(employee);
    reportsByManager.set(managerKey, reports);
  }

  const assignments: EvaluationAssignmentDocument[] = [];

  for (const evaluated of employees) {
    const evaluatedId = evaluated._id;
    if (!evaluatedId) {
      throw new Error("Empleado sin ObjectId");
    }

    const usedEvaluatorIds = new Set<string>();
    const addEvaluator = (evaluatorId: ObjectId, relationType: RelationType) => {
      const key = evaluatorId.toHexString();
      if (usedEvaluatorIds.has(key)) {
        return false;
      }

      assignments.push(
        createAssignment(cycleId, evaluatorId, evaluatedId, relationType),
      );
      usedEvaluatorIds.add(key);
      return true;
    };

    addEvaluator(evaluatedId, "self");

    if (evaluated.managerId) {
      addEvaluator(evaluated.managerId, "manager");
    }

    const sameDepartmentPeers = employees.filter(
      (candidate) =>
        candidate.department === evaluated.department &&
        candidate._id?.toHexString() !== evaluatedId.toHexString() &&
        candidate.level === evaluated.level,
    );

    for (const peer of sameDepartmentPeers) {
      if (assignments.length % 2 === 0 && peer._id) {
        addEvaluator(peer._id, "peer");
      }
      if (usedEvaluatorIds.size >= 3) {
        break;
      }
    }

    const directReports =
      reportsByManager.get(evaluatedId.toHexString())?.filter((report) => report._id) ??
      [];
    if (directReports[0]?._id) {
      addEvaluator(directReports[0]._id, "subordinate");
    }

    const fallbackPeers = employees.filter(
      (candidate) =>
        candidate.department === evaluated.department &&
        candidate._id?.toHexString() !== evaluatedId.toHexString(),
    );

    for (const peer of fallbackPeers) {
      if (usedEvaluatorIds.size >= 4) {
        break;
      }
      if (peer._id) {
        addEvaluator(peer._id, "peer");
      }
    }

    if (usedEvaluatorIds.size !== 4) {
      const evaluatedName = evaluated.fullName;
      throw new Error(`No se pudieron crear 4 asignaciones para ${evaluatedName}`);
    }
  }

  return assignments;
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db();
    const employees = db.collection<EmployeeDocument>("employees");
    const cycles = db.collection("evaluation_cycles");
    const assignments = db.collection<EvaluationAssignmentDocument>(
      "evaluation_assignments",
    );
    const evaluations = db.collection<EvaluationDocument>("evaluations");

    await Promise.all([
      employees.deleteMany({}),
      cycles.deleteMany({}),
      assignments.deleteMany({}),
      evaluations.deleteMany({}),
    ]);

    await ensureIndexes(db);

    const seedEmployees = buildEmployees();
    const employeeDocuments: EmployeeDocument[] = seedEmployees.map((employee) => ({
      _id: employee._id,
      active: employee.active,
      createdAt: employee.createdAt,
      department: employee.department,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      level: employee.level,
      managerId: employee.managerId,
      position: employee.position,
    }));

    await employees.insertMany(employeeDocuments);

    const cycleId = new ObjectId();
    await cycles.insertOne({
      _id: cycleId,
      competencies,
      createdAt: new Date(),
      endDate: new Date("2026-07-15T23:59:59.000Z"),
      name: "Evaluación 360 - Ciclo 2026",
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      status: "active",
      year: 2026,
    });

    const assignmentDocuments = buildAssignments(cycleId, employeeDocuments);
    const completionRanking = assignmentDocuments
      .map((assignment, index) => ({ assignment, index, rank: random() }))
      .sort((left, right) => left.rank - right.rank)
      .slice(0, 360);
    const completedIndexes = new Set(
      completionRanking.map((entry) => entry.index),
    );
    const evaluationDocuments: EvaluationDocument[] = [];

    assignmentDocuments.forEach((assignment, index) => {
      if (!completedIndexes.has(index)) {
        return;
      }

      const submittedAt = new Date();
      assignment.status = "completed";
      assignment.completedAt = submittedAt;
      evaluationDocuments.push({
        anonymousComment: pick(comments),
        cycleId: assignment.cycleId,
        evaluatedId: assignment.evaluatedId,
        relationType: assignment.relationType,
        scores: buildScores(assignment.relationType),
        submittedAt,
        tokenHash: assignment.tokenHash,
      });
    });

    await assignments.insertMany(assignmentDocuments);
    await evaluations.insertMany(evaluationDocuments);

    const [employeeCount, cycleCount, assignmentCount, evaluationCount] =
      await Promise.all([
        employees.countDocuments({}),
        cycles.countDocuments({}),
        assignments.countDocuments({}),
        evaluations.countDocuments({}),
      ]);

    console.log("Seed completado");
    console.log(`Empleados: ${employeeCount}`);
    console.log(`Ciclos: ${cycleCount}`);
    console.log(`Asignaciones: ${assignmentCount}`);
    console.log(`Evaluaciones: ${evaluationCount}`);
    console.log(`Pendientes demo: ${assignmentCount - evaluationCount}`);
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
