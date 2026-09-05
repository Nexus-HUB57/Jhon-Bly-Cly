import { createOrchestraEvent } from "./db";
import { countGovernedRouterProposals, createGovernedToolInvocation, findGovernedToolInvocation, listOrSeedGovernanceCatalog, recordCoreRoleAudit } from "./orchestrationDb";
import { buildGovernedRoutePlan } from "../shared/governedRouter";

const FALLBACK_ACTION = "9router: escalada por saldo insuficiente";

export function isMiniMaxInsufficientBalanceFailure(error: unknown) {
  const value = error instanceof Error ? error.message : String(error ?? "");
  const normalized = value.toLowerCase();
  return normalized.includes("insufficient balance") || normalized.includes("saldo insuficiente") || normalized.includes("(1008)");
}

export async function registerInsufficientBalanceEscalation(input: { userId: number; projectId: number; runId: number }) {
  const requestSummary = `Run ${input.runId} do projeto ${input.projectId}: saldo insuficiente no MiniMax-H3. Preparar alternativa de mídia generativa somente como proposta; excluir o adaptador MiniMax exaurido e não executar integrações.`;
  const existing = await findGovernedToolInvocation({ userId: input.userId, action: FALLBACK_ACTION, requestSummary });
  if (existing) return { proposalId: existing.id, created: false, eligibleCount: 0 };

  const rotationOffset = await countGovernedRouterProposals(input.userId);
  const planned = buildGovernedRoutePlan({
    capability: "mídia generativa",
    maxRisk: "alto",
    request: "Registrar alternativa para saldo insuficiente sem executar provedor.",
    rotationOffset,
  });
  const candidates = planned.candidates.filter(candidate => candidate.id !== "minimax-native-media");
  const catalog = await listOrSeedGovernanceCatalog(input.userId);
  const routerEntry = catalog.find(entry => entry.identifier === "9router");
  if (!routerEntry) throw new Error("A entrada 9router não está disponível no catálogo governado.");

  const proposal = await createGovernedToolInvocation({
    userId: input.userId,
    catalogEntryId: routerEntry.id,
    action: FALLBACK_ACTION,
    requestSummary,
    proposalOnly: true,
  });
  await recordCoreRoleAudit({
    userId: input.userId,
    roleId: "planner",
    eventName: "Escalada de saldo insuficiente",
    status: "aguardando revisão",
    evidenceCount: candidates.length,
    summary: candidates.length
      ? `A escalada do run ${input.runId} propôs ${candidates.length} alternativa(s); nenhuma integração externa foi executada.`
      : `A escalada do run ${input.runId} não encontrou alternativa elegível; nenhuma integração externa foi executada.`,
  });
  await createOrchestraEvent({
    projectId: input.projectId,
    eventName: "video.generation.fallback_proposed",
    entityType: "governed_tool_invocation",
    entityId: proposal.id,
    payload: {
      status: "aguardando revisão",
      runId: input.runId,
      candidateCount: candidates.length,
      delivery: "pendente",
      execution: "nenhuma",
      approvalRequired: true,
    },
  });
  return { proposalId: proposal.id, created: true, eligibleCount: candidates.length };
}
