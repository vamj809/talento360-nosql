import type { Collection, Db } from "mongodb";
import type {
  EmployeeDocument,
  EvaluationAssignmentDocument,
  EvaluationCycleDocument,
  EvaluationDocument,
} from "./types";

export const COLLECTIONS = {
  employees: "employees",
  cycles: "evaluation_cycles",
  assignments: "evaluation_assignments",
  evaluations: "evaluations",
} as const;

export function employeesCollection(db: Db): Collection<EmployeeDocument> {
  return db.collection<EmployeeDocument>(COLLECTIONS.employees);
}

export function cyclesCollection(db: Db): Collection<EvaluationCycleDocument> {
  return db.collection<EvaluationCycleDocument>(COLLECTIONS.cycles);
}

export function assignmentsCollection(
  db: Db,
): Collection<EvaluationAssignmentDocument> {
  return db.collection<EvaluationAssignmentDocument>(COLLECTIONS.assignments);
}

export function evaluationsCollection(db: Db): Collection<EvaluationDocument> {
  return db.collection<EvaluationDocument>(COLLECTIONS.evaluations);
}

export async function ensureIndexes(db: Db) {
  await Promise.all([
    employeesCollection(db).createIndex({
      department: 1,
      active: 1,
      fullName: 1,
    }),
    employeesCollection(db).createIndex({ managerId: 1 }),
    cyclesCollection(db).createIndex({ year: 1, status: 1 }),
    assignmentsCollection(db).createIndex({
      cycleId: 1,
      evaluatedId: 1,
      status: 1,
    }),
    assignmentsCollection(db).createIndex({ tokenHash: 1 }, { unique: true }),
    assignmentsCollection(db).createIndex({ evaluatorId: 1, cycleId: 1 }),
    evaluationsCollection(db).createIndex({
      cycleId: 1,
      evaluatedId: 1,
      relationType: 1,
    }),
    evaluationsCollection(db).createIndex({ cycleId: 1, submittedAt: -1 }),
  ]);
}
