export const ORCHESTRATION_CYCLE_STATUSES = [
  "pausado",
  "pronto",
  "em execução",
  "aguardando revisão",
  "concluído",
  "com falha",
] as const;

export const IMPROVEMENT_PROPOSAL_STATUSES = [
  "pendente",
  "aprovada",
  "rejeitada",
] as const;

export const ORCHESTRA_INBOX_STATUSES = [
  "recebido",
  "duplicado",
  "rejeitado",
  "processado",
] as const;

export const MEMORY_SOURCE_TYPES = [
  "referência",
  "evento",
  "ciclo",
  "manual",
] as const;

export type OrchestrationCycleStatus = (typeof ORCHESTRATION_CYCLE_STATUSES)[number];
export type ImprovementProposalStatus = (typeof IMPROVEMENT_PROPOSAL_STATUSES)[number];
export type OrchestraInboxStatus = (typeof ORCHESTRA_INBOX_STATUSES)[number];
export type MemorySourceType = (typeof MEMORY_SOURCE_TYPES)[number];

export const ORCHESTRATION_LIMITS = {
  maxInboundPayloadBytes: 256 * 1024,
  maxEventAgeMs: 5 * 60 * 1000,
  minCycleIntervalMinutes: 15,
  maxEvidencePerCycle: 12,
  maxMemoriesPerRetrieval: 12,
  maxLlmOutputTokens: 600,
  maxCycleDurationMs: 45_000,
} as const;

export const PROPOSAL_ONLY_ACTIONS = [
  "alterar código",
  "configurar credencial",
  "ativar conector",
  "publicar versão",
  "executar chamada externa",
] as const;

export function canStartCycle(input: {
  status: OrchestrationCycleStatus;
  lastStartedAt?: Date | null;
  now?: Date;
  minIntervalMinutes?: number;
}) {
  if (
    input.status === "pausado" ||
    input.status === "em execução" ||
    input.status === "aguardando revisão"
  ) return false;
  if (!input.lastStartedAt) return true;

  const now = input.now ?? new Date();
  const intervalMinutes = input.minIntervalMinutes ?? ORCHESTRATION_LIMITS.minCycleIntervalMinutes;
  return now.getTime() - input.lastStartedAt.getTime() >= intervalMinutes * 60_000;
}

export function redactSensitiveKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitiveKeys);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
      const isSensitive = /(api[-_]?key|token|secret|password|authorization|cookie)/i.test(key);
      return [key, isSensitive ? "[redigido]" : redactSensitiveKeys(nestedValue)];
    })
  );
}
