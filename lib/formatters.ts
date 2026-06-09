import type {
  CompetencyKey,
  CycleStatus,
  EmployeeLevel,
  RelationType,
  ScoreMap,
} from "./types";

export const appLocale = process.env.APP_LOCALE || "es-DO";
export const appTimeZone = process.env.APP_TIME_ZONE || "America/La_Paz";

export const competencyLabels: Record<CompetencyKey, string> = {
  liderazgo: "Liderazgo",
  comunicacion: "Comunicación",
  trabajo_equipo: "Trabajo en equipo",
  resultados: "Orientación a resultados",
  innovacion: "Innovación",
};

export const relationTypeLabels: Record<RelationType, string> = {
  manager: "Jefe directo",
  peer: "Par",
  subordinate: "Subordinado",
  self: "Autoevaluación",
};

export const levelLabels: Record<EmployeeLevel, string> = {
  director: "Director",
  manager: "Gerente",
  supervisor: "Supervisor",
  staff: "Colaborador",
};

export const cycleStatusLabels: Record<CycleStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  closed: "Cerrado",
};

export function formatDate(date: string | Date) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(appLocale, {
    day: "2-digit",
    month: "short",
    timeZone: appTimeZone,
    year: "numeric",
  }).format(value);
}

export function formatDateTime(date: string | Date) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(appLocale, {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: appTimeZone,
    timeZoneName: "shortOffset",
    year: "numeric",
  }).format(value);
}

export function formatScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0.00";
  }

  return value.toFixed(2);
}

export function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

export function roundScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

export function findScoreExtremes(scores: ScoreMap) {
  const entries = Object.entries(scores) as [CompetencyKey, number][];
  const ordered = [...entries].sort((left, right) => right[1] - left[1]);

  return {
    highest: ordered[0]?.[0] ?? "liderazgo",
    lowest: ordered[ordered.length - 1]?.[0] ?? "liderazgo",
  };
}
