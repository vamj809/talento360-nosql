import crypto from "node:crypto";
import { ObjectId, type Filter } from "mongodb";
import {
  assignmentsCollection,
  cyclesCollection,
  employeesCollection,
  evaluationsCollection,
} from "./collections";
import { findScoreExtremes, roundScore } from "./formatters";
import { getDb } from "./mongodb";
import { getRedisStatus, redisDelete, redisGet, redisSetJson } from "./redis";
import type {
  ActiveCycleView,
  AssignmentStatus,
  AssignmentSummaryRow,
  CompetencyKey,
  DemoTokenRow,
  EmployeeDocument,
  EmployeeReportView,
  EmployeeRow,
  EvaluationAssignmentDocument,
  EvaluationCycleDocument,
  EvaluationFormView,
  HrDashboardData,
  HrDashboardView,
  RelationScoreSummary,
  RelationType,
  ScoreMap,
  ScoreSummary,
  SystemCounts,
} from "./types";
import { competencyKeys } from "./types";

const HR_DASHBOARD_CACHE_KEY = "talento360:hr-dashboard";
const HR_DASHBOARD_CACHE_TTL_SECONDS = 300;

type AggregatedScores = Partial<Record<CompetencyKey, number>> & {
  total: number;
};

type RelationAggregatedScores = AggregatedScores & {
  _id: RelationType;
};

type DepartmentAggregatedScores = Partial<Record<CompetencyKey, number>> & {
  _id: string;
  totalEvaluations: number;
};

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}

function dateToIso(date: Date | string) {
  return (date instanceof Date ? date : new Date(date)).toISOString();
}

function scoreMapFromRow(row: Partial<Record<CompetencyKey, number>>): ScoreMap {
  return {
    liderazgo: roundScore(row.liderazgo),
    comunicacion: roundScore(row.comunicacion),
    trabajo_equipo: roundScore(row.trabajo_equipo),
    resultados: roundScore(row.resultados),
    innovacion: roundScore(row.innovacion),
  };
}

function toEmployeeRow(
  employee: EmployeeDocument & { managerName?: string | null },
): EmployeeRow {
  return {
    id: employee._id?.toHexString() ?? "",
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    department: employee.department,
    position: employee.position,
    level: employee.level,
    managerName: employee.managerName ?? null,
    active: employee.active,
  };
}

function toActiveCycleView(cycle: EvaluationCycleDocument): ActiveCycleView {
  return {
    id: cycle._id?.toHexString() ?? "",
    name: cycle.name,
    year: cycle.year,
    status: cycle.status,
    startDate: dateToIso(cycle.startDate),
    endDate: dateToIso(cycle.endDate),
    competencies: cycle.competencies,
  };
}

export async function getSystemCounts(): Promise<SystemCounts> {
  const db = await getDb();

  const [employees, cycles, assignments, evaluations] = await Promise.all([
    employeesCollection(db).countDocuments({}),
    cyclesCollection(db).countDocuments({}),
    assignmentsCollection(db).countDocuments({}),
    evaluationsCollection(db).countDocuments({}),
  ]);

  return { employees, cycles, assignments, evaluations };
}

export async function getHealthSummary() {
  const [counts, redis] = await Promise.all([
    getSystemCounts(),
    getRedisStatus(),
  ]);

  return {
    status: "ok" as const,
    mongo: "connected" as const,
    redis,
    counts,
  };
}

export async function getActiveCycle(): Promise<ActiveCycleView | null> {
  const db = await getDb();
  const cycle = await cyclesCollection(db).findOne(
    { status: "active" },
    { sort: { year: -1, createdAt: -1 } },
  );

  return cycle ? toActiveCycleView(cycle) : null;
}

export async function getDepartments() {
  const db = await getDb();
  const departments = await employeesCollection(db).distinct("department", {
    active: true,
  });

  return departments.sort((left, right) => left.localeCompare(right, "es"));
}

export async function getEmployees(options?: {
  department?: string;
  limit?: number;
}): Promise<EmployeeRow[]> {
  const db = await getDb();
  const match: Filter<EmployeeDocument> = { active: true };

  if (options?.department) {
    match.department = options.department;
  }

  const rows = await employeesCollection(db)
    .aggregate<EmployeeDocument & { managerName?: string | null }>([
      { $match: match },
      { $sort: { department: 1, level: 1, fullName: 1 } },
      { $limit: options?.limit ?? 50 },
      {
        $lookup: {
          as: "manager",
          foreignField: "_id",
          from: "employees",
          localField: "managerId",
        },
      },
      { $unwind: { path: "$manager", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          active: 1,
          department: 1,
          employeeCode: 1,
          fullName: 1,
          level: 1,
          managerId: 1,
          managerName: "$manager.fullName",
          position: 1,
        },
      },
    ])
    .toArray();

  return rows.map(toEmployeeRow);
}

export async function getAssignmentsSummary(
  limit = 50,
): Promise<AssignmentSummaryRow[]> {
  const db = await getDb();

  const rows = await assignmentsCollection(db)
    .aggregate<{
      completed: number;
      department: string;
      employeeCode: string;
      employeeName: string;
      evaluatedId: ObjectId;
      pending: number;
      sampleStatus: AssignmentStatus;
      sampleToken: string;
      total: number;
    }>([
      { $sort: { status: -1, createdAt: 1 } },
      {
        $group: {
          _id: "$evaluatedId",
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          sampleStatus: { $first: "$status" },
          sampleToken: { $first: "$token" },
          total: { $sum: 1 },
        },
      },
      {
        $lookup: {
          as: "employee",
          foreignField: "_id",
          from: "employees",
          localField: "_id",
        },
      },
      { $unwind: "$employee" },
      { $sort: { "employee.department": 1, "employee.fullName": 1 } },
      { $limit: limit },
      {
        $project: {
          completed: 1,
          department: "$employee.department",
          employeeCode: "$employee.employeeCode",
          employeeName: "$employee.fullName",
          evaluatedId: "$_id",
          pending: 1,
          sampleStatus: 1,
          sampleToken: 1,
          total: 1,
        },
      },
    ])
    .toArray();

  return rows.map((row) => ({
    completed: row.completed,
    completionRate: row.total > 0 ? (row.completed / row.total) * 100 : 0,
    department: row.department,
    employeeCode: row.employeeCode,
    employeeName: row.employeeName,
    evaluatedId: row.evaluatedId.toHexString(),
    pending: row.pending,
    sampleStatus: row.sampleStatus,
    sampleToken: row.sampleToken,
    total: row.total,
  }));
}

export async function getDemoTokens(limit = 30): Promise<DemoTokenRow[]> {
  const db = await getDb();

  const rows = await assignmentsCollection(db)
    .aggregate<{
      department: string;
      evaluatedId: ObjectId;
      evaluatedName: string;
      relationType: RelationType;
      status: AssignmentStatus;
      token: string;
    }>([
      { $sort: { status: -1, createdAt: 1 } },
      { $limit: limit },
      {
        $lookup: {
          as: "evaluated",
          foreignField: "_id",
          from: "employees",
          localField: "evaluatedId",
        },
      },
      { $unwind: "$evaluated" },
      {
        $project: {
          department: "$evaluated.department",
          evaluatedId: 1,
          evaluatedName: "$evaluated.fullName",
          relationType: 1,
          status: 1,
          token: 1,
        },
      },
    ])
    .toArray();

  return rows.map((row) => ({
    department: row.department,
    evaluatedId: row.evaluatedId.toHexString(),
    evaluatedName: row.evaluatedName,
    relationType: row.relationType,
    status: row.status,
    token: row.token,
  }));
}

export async function getEvaluationFormByToken(
  token: string,
): Promise<EvaluationFormView | null> {
  const db = await getDb();
  const assignment = await assignmentsCollection(db).findOne({
    tokenHash: hashToken(token),
  });

  if (!assignment) {
    return null;
  }

  const [evaluated, cycle] = await Promise.all([
    employeesCollection(db).findOne({ _id: assignment.evaluatedId }),
    cyclesCollection(db).findOne({ _id: assignment.cycleId }),
  ]);

  if (!evaluated || !cycle) {
    return null;
  }

  return {
    cycle: toActiveCycleView(cycle),
    evaluated: {
      department: evaluated.department,
      fullName: evaluated.fullName,
      id: evaluated._id?.toHexString() ?? "",
      position: evaluated.position,
    },
    relationType: assignment.relationType,
    status: assignment.status,
    token,
  };
}

export async function submitEvaluationForToken(
  token: string,
  submittedScores: Partial<Record<CompetencyKey, number>>,
  anonymousComment: string,
) {
  const db = await getDb();
  const tokenHash = hashToken(token);
  const assignment = await assignmentsCollection(db).findOne({ tokenHash });

  if (!assignment) {
    return { status: "invalid-token" as const };
  }

  if (assignment.status === "completed") {
    return { status: "already-completed" as const };
  }

  const scores = {} as ScoreMap;
  for (const key of competencyKeys) {
    const score = submittedScores[key];
    if (
      typeof score !== "number" ||
      !Number.isInteger(score) ||
      score < 1 ||
      score > 5
    ) {
      return { status: "invalid-scores" as const };
    }
    scores[key] = score;
  }

  const completedAt = new Date();
  const updateResult = await assignmentsCollection(db).updateOne(
    { status: "pending", tokenHash },
    { $set: { completedAt, status: "completed" } },
  );

  if (updateResult.modifiedCount === 0) {
    return { status: "already-completed" as const };
  }

  await evaluationsCollection(db).insertOne({
    anonymousComment: anonymousComment.trim(),
    cycleId: assignment.cycleId,
    evaluatedId: assignment.evaluatedId,
    relationType: assignment.relationType,
    scores,
    submittedAt: completedAt,
    tokenHash,
  });

  await redisDelete(HR_DASHBOARD_CACHE_KEY);

  return { status: "submitted" as const };
}

export async function getEmployeeReport(
  employeeId: string,
): Promise<EmployeeReportView | null> {
  const db = await getDb();
  const objectId = parseObjectId(employeeId);

  if (!objectId) {
    return null;
  }

  const employeeRows = await employeesCollection(db)
    .aggregate<EmployeeDocument & { managerName?: string | null }>([
      { $match: { _id: objectId } },
      {
        $lookup: {
          as: "manager",
          foreignField: "_id",
          from: "employees",
          localField: "managerId",
        },
      },
      { $unwind: { path: "$manager", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          active: 1,
          department: 1,
          employeeCode: 1,
          fullName: 1,
          level: 1,
          managerId: 1,
          managerName: "$manager.fullName",
          position: 1,
        },
      },
    ])
    .toArray();

  const employee = employeeRows[0];
  if (!employee) {
    return null;
  }

  const [report] = await evaluationsCollection(db)
    .aggregate<{
      byRelation: RelationAggregatedScores[];
      comments: {
        anonymousComment: string;
        relationType: RelationType;
        submittedAt: Date;
      }[];
      overall: AggregatedScores[];
    }>([
      { $match: { evaluatedId: objectId } },
      {
        $facet: {
          byRelation: [
            {
              $group: {
                _id: "$relationType",
                comunicacion: { $avg: "$scores.comunicacion" },
                innovacion: { $avg: "$scores.innovacion" },
                liderazgo: { $avg: "$scores.liderazgo" },
                resultados: { $avg: "$scores.resultados" },
                total: { $sum: 1 },
                trabajo_equipo: { $avg: "$scores.trabajo_equipo" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          comments: [
            { $match: { anonymousComment: { $ne: "" } } },
            { $sort: { submittedAt: -1 } },
            { $limit: 20 },
            {
              $project: {
                _id: 0,
                anonymousComment: 1,
                relationType: 1,
                submittedAt: 1,
              },
            },
          ],
          overall: [
            {
              $group: {
                _id: null,
                comunicacion: { $avg: "$scores.comunicacion" },
                innovacion: { $avg: "$scores.innovacion" },
                liderazgo: { $avg: "$scores.liderazgo" },
                resultados: { $avg: "$scores.resultados" },
                total: { $sum: 1 },
                trabajo_equipo: { $avg: "$scores.trabajo_equipo" },
              },
            },
          ],
        },
      },
    ])
    .toArray();

  const overallRow = report?.overall[0] ?? null;
  const overall: ScoreSummary | null = overallRow
    ? { scores: scoreMapFromRow(overallRow), total: overallRow.total }
    : null;

  const byRelation: RelationScoreSummary[] =
    report?.byRelation.map((row) => ({
      relationType: row._id,
      scores: scoreMapFromRow(row),
      total: row.total,
    })) ?? [];

  return {
    byRelation,
    comments:
      report?.comments.map((comment) => ({
        anonymousComment: comment.anonymousComment,
        relationType: comment.relationType,
        submittedAt: dateToIso(comment.submittedAt),
      })) ?? [],
    employee: toEmployeeRow(employee),
    overall,
    totalEvaluations: overall?.total ?? 0,
  };
}

async function calculateHrDashboard(): Promise<HrDashboardData> {
  const db = await getDb();
  const departmentRows = await evaluationsCollection(db)
    .aggregate<DepartmentAggregatedScores>([
      {
        $lookup: {
          as: "employee",
          foreignField: "_id",
          from: "employees",
          localField: "evaluatedId",
        },
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: "$employee.department",
          comunicacion: { $avg: "$scores.comunicacion" },
          innovacion: { $avg: "$scores.innovacion" },
          liderazgo: { $avg: "$scores.liderazgo" },
          resultados: { $avg: "$scores.resultados" },
          totalEvaluations: { $sum: 1 },
          trabajo_equipo: { $avg: "$scores.trabajo_equipo" },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  const [counts, totalAssignments, completedAssignments, globalRows] =
    await Promise.all([
      getSystemCounts(),
      assignmentsCollection(db).countDocuments({}),
      assignmentsCollection(db).countDocuments({ status: "completed" }),
      evaluationsCollection(db)
        .aggregate<AggregatedScores>([
          {
            $group: {
              _id: null,
              comunicacion: { $avg: "$scores.comunicacion" },
              innovacion: { $avg: "$scores.innovacion" },
              liderazgo: { $avg: "$scores.liderazgo" },
              resultados: { $avg: "$scores.resultados" },
              total: { $sum: 1 },
              trabajo_equipo: { $avg: "$scores.trabajo_equipo" },
            },
          },
        ])
        .toArray(),
    ]);

  const globalScores = scoreMapFromRow(globalRows[0] ?? {});
  const globalExtremes = findScoreExtremes(globalScores);

  return {
    completedAssignments,
    departments: departmentRows.map((row) => {
      const scores = scoreMapFromRow(row);
      const extremes = findScoreExtremes(scores);

      return {
        department: row._id,
        highestCompetency: extremes.highest,
        lowestCompetency: extremes.lowest,
        scores,
        totalEvaluations: row.totalEvaluations,
      };
    }),
    generatedAt: new Date().toISOString(),
    globalScores,
    highestCompetency: globalExtremes.highest,
    lowestCompetency: globalExtremes.lowest,
    progressPercentage:
      totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
    totalAssignments,
    totalEmployees: counts.employees,
    totalEvaluations: counts.evaluations,
  };
}

export async function getHrDashboard(): Promise<HrDashboardView> {
  const cached = await redisGet(HR_DASHBOARD_CACHE_KEY);

  if (cached) {
    try {
      return {
        cacheStatus: "hit",
        data: JSON.parse(cached) as HrDashboardData,
        source: "redis-cache",
      };
    } catch {
      await redisDelete(HR_DASHBOARD_CACHE_KEY);
    }
  }

  const data = await calculateHrDashboard();
  const storedInRedis = await redisSetJson(
    HR_DASHBOARD_CACHE_KEY,
    data,
    HR_DASHBOARD_CACHE_TTL_SECONDS,
  );

  return {
    cacheStatus: storedInRedis ? "miss-stored" : "unavailable",
    data,
    source: "mongodb",
  };
}

export async function getCycleCounts() {
  const [counts, activeCycle] = await Promise.all([
    getSystemCounts(),
    getActiveCycle(),
  ]);

  return {
    activeCycle,
    counts,
  };
}

export function buildScoresFromFormData(formData: FormData) {
  const scores: Partial<Record<CompetencyKey, number>> = {};

  for (const key of competencyKeys) {
    const rawValue = formData.get(key);
    scores[key] =
      typeof rawValue === "string" ? Number.parseInt(rawValue, 10) : NaN;
  }

  return scores;
}

export type EvaluationSubmitStatus = Awaited<
  ReturnType<typeof submitEvaluationForToken>
>["status"];

export function assignmentStatusLabel(status: EvaluationAssignmentDocument["status"]) {
  return status === "completed" ? "Completada" : "Pendiente";
}
