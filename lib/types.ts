import type { ObjectId } from "mongodb";

export const competencyKeys = [
  "liderazgo",
  "comunicacion",
  "trabajo_equipo",
  "resultados",
  "innovacion",
] as const;

export type CompetencyKey = (typeof competencyKeys)[number];
export type ScoreMap = Record<CompetencyKey, number>;
export type EmployeeLevel = "director" | "manager" | "supervisor" | "staff";
export type CycleStatus = "draft" | "active" | "closed";
export type RelationType = "manager" | "peer" | "subordinate" | "self";
export type AssignmentStatus = "pending" | "completed";

export interface CompetencyDefinition {
  key: CompetencyKey;
  label: string;
  description: string;
}

export interface EmployeeDocument {
  _id?: ObjectId;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  level: EmployeeLevel;
  managerId: ObjectId | null;
  active: boolean;
  createdAt: Date;
}

export interface EvaluationCycleDocument {
  _id?: ObjectId;
  name: string;
  year: number;
  status: CycleStatus;
  startDate: Date;
  endDate: Date;
  competencies: CompetencyDefinition[];
  createdAt: Date;
}

export interface EvaluationAssignmentDocument {
  _id?: ObjectId;
  cycleId: ObjectId;
  evaluatorId: ObjectId;
  evaluatedId: ObjectId;
  relationType: RelationType;
  token: string;
  tokenHash: string;
  status: AssignmentStatus;
  createdAt: Date;
  completedAt: Date | null;
}

export interface EvaluationDocument {
  _id?: ObjectId;
  cycleId: ObjectId;
  evaluatedId: ObjectId;
  relationType: RelationType;
  tokenHash: string;
  scores: ScoreMap;
  anonymousComment: string;
  submittedAt: Date;
}

export interface SystemCounts {
  employees: number;
  cycles: number;
  assignments: number;
  evaluations: number;
}

export interface EmployeeRow {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  level: EmployeeLevel;
  managerName: string | null;
  active: boolean;
}

export interface ActiveCycleView {
  id: string;
  name: string;
  year: number;
  status: CycleStatus;
  startDate: string;
  endDate: string;
  competencies: CompetencyDefinition[];
}

export interface AssignmentSummaryRow {
  evaluatedId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  sampleToken: string;
  sampleStatus: AssignmentStatus;
}

export interface DemoTokenRow {
  token: string;
  status: AssignmentStatus;
  relationType: RelationType;
  evaluatedId: string;
  evaluatedName: string;
  department: string;
}

export interface EvaluationFormView {
  token: string;
  status: AssignmentStatus;
  relationType: RelationType;
  evaluated: {
    id: string;
    fullName: string;
    department: string;
    position: string;
  };
  cycle: ActiveCycleView;
}

export interface ScoreSummary {
  scores: ScoreMap;
  total: number;
}

export interface RelationScoreSummary extends ScoreSummary {
  relationType: RelationType;
}

export interface AnonymousCommentView {
  relationType: RelationType;
  anonymousComment: string;
  submittedAt: string;
}

export interface EmployeeReportView {
  employee: EmployeeRow;
  totalEvaluations: number;
  overall: ScoreSummary | null;
  byRelation: RelationScoreSummary[];
  comments: AnonymousCommentView[];
}

export interface DepartmentDashboardRow {
  department: string;
  totalEvaluations: number;
  scores: ScoreMap;
  highestCompetency: CompetencyKey;
  lowestCompetency: CompetencyKey;
}

export interface HrDashboardData {
  generatedAt: string;
  totalEmployees: number;
  totalEvaluations: number;
  totalAssignments: number;
  completedAssignments: number;
  progressPercentage: number;
  globalScores: ScoreMap;
  highestCompetency: CompetencyKey;
  lowestCompetency: CompetencyKey;
  departments: DepartmentDashboardRow[];
}

export type HrDashboardSource = "redis-cache" | "mongodb";
export type HrDashboardCacheStatus = "hit" | "miss-stored" | "unavailable";

export interface HrDashboardView {
  source: HrDashboardSource;
  cacheStatus: HrDashboardCacheStatus;
  data: HrDashboardData;
}
