export const ORCHESTRATION_CYCLE_STATUSES = ["pausado", "pronto", "em execução", "aguardando revisão", "concluído", "com falha"] as const;
export const IMPROVEMENT_PROPOSAL_STATUSES = ["pendente", "aprovada", "rejeitada"] as const;
export const ORCHESTRA_INBOX_STATUSES = ["recebido", "duplicado", "rejeitado", "processado"] as const;
export const MEMORY_SOURCE_TYPES = ["referência", "evento", "ciclo", "manual"] as const;
export const OPERATIONAL_MATURITY_LEVELS = ["observação", "orientação", "proposta", "revisão"] as const;
export const GOVERNANCE_CATALOG_KINDS = ["memória", "roteamento", "ferramenta"] as const;
export const GOVERNANCE_CATALOG_STATUSES = ["catálogo", "aguardando aprovação", "ativado", "bloqueado"] as const;
export const TOOL_INVOCATION_STATUSES = ["proposta", "aprovada", "rejeitada", "bloqueada", "concluída", "com falha"] as const;

export const GOVERNED_CORE_ROLES = [
  { id: "planner", name: "Planner", description: "Recupera contexto e estrutura propostas a partir de evidências.", boundary: "Não executa efeitos externos." },
  { id: "executor", name: "Executor", description: "Registra solicitações aprovadas como intenção auditável.", boundary: "Permanece em proposta até aprovação e integração oficial." },
  { id: "monitor", name: "Monitor", description: "Observa estados, limites, erros e idempotência dos ciclos.", boundary: "Não altera política ou credenciais." },
  { id: "optimizer", name: "Optimizer", description: "Sugere melhorias graduais a partir de memória curada.", boundary: "Nunca modifica código ou configuração automaticamente." },
] as const;
export const CORE_ROLE_AUDIT_STATUSES = ["aguardando evidências", "pronto", "observando", "aguardando revisão", "bloqueado", "atenção"] as const;

export type OrchestrationCycleStatus = (typeof ORCHESTRATION_CYCLE_STATUSES)[number];
export type ImprovementProposalStatus = (typeof IMPROVEMENT_PROPOSAL_STATUSES)[number];
export type OrchestraInboxStatus = (typeof ORCHESTRA_INBOX_STATUSES)[number];
export type MemorySourceType = (typeof MEMORY_SOURCE_TYPES)[number];
export type OperationalMaturityLevel = (typeof OPERATIONAL_MATURITY_LEVELS)[number];
export type GovernanceCatalogKind = (typeof GOVERNANCE_CATALOG_KINDS)[number];
export type GovernanceCatalogStatus = (typeof GOVERNANCE_CATALOG_STATUSES)[number];
export type ToolInvocationStatus = (typeof TOOL_INVOCATION_STATUSES)[number];
export type GovernedCoreRoleId = (typeof GOVERNED_CORE_ROLES)[number]["id"];
export type CoreRoleAuditStatus = (typeof CORE_ROLE_AUDIT_STATUSES)[number];

export const ORCHESTRATION_LIMITS = {
  maxInboundPayloadBytes: 256 * 1024,
  maxEventAgeMs: 5 * 60 * 1000,
  minCycleIntervalMinutes: 15,
  maxEvidencePerCycle: 12,
  maxMemoriesPerRetrieval: 12,
  maxLlmOutputTokens: 600,
  maxCycleDurationMs: 45_000,
} as const;

export const PROPOSAL_ONLY_ACTIONS = ["alterar código", "configurar credencial", "ativar conector", "publicar versão", "executar chamada externa"] as const;

export function deriveOperationalMaturity(input: { evidenceCount: number; approvedProposalCount: number; reviewedMemoryCount: number }) {
  const score = Math.min(100, Math.min(45, input.evidenceCount * 3) + Math.min(30, input.approvedProposalCount * 6) + Math.min(25, input.reviewedMemoryCount * 2));
  const level: OperationalMaturityLevel = score >= 75 ? "revisão" : score >= 50 ? "proposta" : score >= 25 ? "orientação" : "observação";
  const autonomyCeiling: "observação" | "orientação" | "proposta" = level === "observação" ? "observação" : level === "orientação" ? "orientação" : "proposta";
  return { score, level, autonomyCeiling, requiresHumanApproval: true };
}

export function canStartCycle(input: { status: OrchestrationCycleStatus; lastStartedAt?: Date | null; now?: Date; minIntervalMinutes?: number }) {
  if (input.status === "pausado" || input.status === "em execução" || input.status === "aguardando revisão") return false;
  if (!input.lastStartedAt) return true;
  const now = input.now ?? new Date();
  const intervalMinutes = input.minIntervalMinutes ?? ORCHESTRATION_LIMITS.minCycleIntervalMinutes;
  return now.getTime() - input.lastStartedAt.getTime() >= intervalMinutes * 60_000;
}

export function redactSensitiveKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitiveKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
    const isSensitive = /(api[-_]?key|token|secret|password|authorization|cookie)/i.test(key);
    return [key, isSensitive ? "[redigido]" : redactSensitiveKeys(nestedValue)];
  }));
}
