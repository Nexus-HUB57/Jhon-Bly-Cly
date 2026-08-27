import { and, desc, eq } from "drizzle-orm";
import {
  coreRoleAuditEvents,
  governanceCatalogEntries,
  governedToolInvocations,
  improvementProposals,
  knowledgeMemories,
  memoryRetrievals,
  operationalMaturityProfiles,
  orchestraInboxEvents,
  orchestrationCycleRuns,
  orchestrationCycles,
} from "../drizzle/schema";
import {
  type CoreRoleAuditStatus,
  type GovernedCoreRoleId,
  type ImprovementProposalStatus,
  type GovernanceCatalogStatus,
  type MemorySourceType,
  type OrchestraInboxStatus,
  type OrchestrationCycleStatus,
  canStartCycle,
  deriveOperationalMaturity,
  GOVERNED_CORE_ROLES,
} from "../shared/orchestrationPolicy";
import { getDb } from "./db";

function requireDatabase<T>(db: T | null): T {
  if (!db) throw new Error("Banco de dados indisponível.");
  return db;
}

const GOVERNANCE_CATALOG_SEED = [
  { identifier: "nexus-sidian-mcp", kind: "memória" as const, name: "Nexus Sidian (MCP)", riskLevel: "médio" as const, purpose: "Reservar o contrato de memória externa e recuperação contextual.", guardrail: "Permanece em catálogo até URL MCP, autenticação oficial, escopo e aprovação administrativa." },
  { identifier: "obsidian-vault", kind: "memória" as const, name: "Obsidian Vault", riskLevel: "médio" as const, purpose: "Representar uma possível fonte documental curada.", guardrail: "Não acessa sistema de arquivos local, diretórios pessoais ou conteúdo não enviado ao workspace." },
  { identifier: "9router", kind: "roteamento" as const, name: "9router", riskLevel: "alto" as const, purpose: "Reservar um contrato de gateway e seleção de rotas.", guardrail: "Não encaminha requisições sem endpoint autorizado, política de dados e aprovação humana." },
  { identifier: "9remote", kind: "roteamento" as const, name: "9remote", riskLevel: "alto" as const, purpose: "Reservar um contrato para acesso remoto explicitamente autorizado.", guardrail: "Acesso remoto é bloqueado por padrão; exige identidade, escopo, endpoint e aprovação explícita." },
  { identifier: "marketplace-hub", kind: "ferramenta" as const, name: "MarketplaceHub (Matrix Hub)", riskLevel: "alto" as const, purpose: "Catalogar ferramentas e integrações sujeitas à revisão.", guardrail: "Não instala, executa ou habilita ferramentas automaticamente." },
  { identifier: "github-agent-apps", kind: "ferramenta" as const, name: "Agent Apps (GitHub)", riskLevel: "alto" as const, purpose: "Catalogar possíveis integrações oficiais com GitHub.", guardrail: "Exige aplicativo OAuth oficial, permissões mínimas e aprovação para cada operação externa." },
];

export async function getOrCreateOrchestrationCycle(userId: number) {
  const db = requireDatabase(await getDb());
  const [existing] = await db.select().from(orchestrationCycles).where(eq(orchestrationCycles.userId, userId)).limit(1);
  if (existing) return existing;

  await db.insert(orchestrationCycles).values({ userId, status: "pausado" });
  const [created] = await db.select().from(orchestrationCycles).where(eq(orchestrationCycles.userId, userId)).limit(1);
  if (!created) throw new Error("Não foi possível inicializar o ciclo de orquestração.");
  return created;
}

export async function getOrchestrationCycleByTaskUid(taskUid: string) {
  const db = requireDatabase(await getDb());
  const [cycle] = await db.select().from(orchestrationCycles).where(eq(orchestrationCycles.taskUid, taskUid)).limit(1);
  return cycle;
}

export async function getOrCreateOperationalMaturityProfile(userId: number) {
  const db = requireDatabase(await getDb());
  const [existing] = await db.select().from(operationalMaturityProfiles).where(eq(operationalMaturityProfiles.userId, userId)).limit(1);
  if (existing) return existing;
  const maturity = deriveOperationalMaturity({ evidenceCount: 0, approvedProposalCount: 0, reviewedMemoryCount: 0 });
  const { requiresHumanApproval: _requiresHumanApproval, ...profileValues } = maturity;
  await db.insert(operationalMaturityProfiles).values({ userId, ...profileValues, protectedStorage: 1 });
  const [created] = await db.select().from(operationalMaturityProfiles).where(eq(operationalMaturityProfiles.userId, userId)).limit(1);
  if (!created) throw new Error("Não foi possível inicializar o perfil de maturidade operacional.");
  return created;
}

export async function refreshOperationalMaturityProfile(userId: number) {
  const db = requireDatabase(await getDb());
  const [memories, approvedProposals, reviewedMemories] = await Promise.all([
    db.select({ id: knowledgeMemories.id }).from(knowledgeMemories).where(eq(knowledgeMemories.userId, userId)),
    db.select({ id: improvementProposals.id }).from(improvementProposals).where(and(eq(improvementProposals.userId, userId), eq(improvementProposals.status, "aprovada"))),
    db.select({ id: knowledgeMemories.id }).from(knowledgeMemories).where(and(eq(knowledgeMemories.userId, userId), eq(knowledgeMemories.retentionClass, "curada"))),
  ]);
  const maturity = deriveOperationalMaturity({ evidenceCount: memories.length, approvedProposalCount: approvedProposals.length, reviewedMemoryCount: reviewedMemories.length });
  const { requiresHumanApproval: _requiresHumanApproval, ...profileValues } = maturity;
  const profile = await getOrCreateOperationalMaturityProfile(userId);
  await db.update(operationalMaturityProfiles).set({ ...profileValues, evidenceCount: memories.length, approvedProposalCount: approvedProposals.length, reviewedMemoryCount: reviewedMemories.length, lastCalculatedAt: new Date() }).where(eq(operationalMaturityProfiles.id, profile.id));
  const [updated] = await db.select().from(operationalMaturityProfiles).where(eq(operationalMaturityProfiles.id, profile.id)).limit(1);
  return updated!;
}

export async function listOrSeedGovernanceCatalog(userId: number) {
  const db = requireDatabase(await getDb());
  const existing = await db.select().from(governanceCatalogEntries).where(eq(governanceCatalogEntries.userId, userId));
  const existingIds = new Set(existing.map(entry => entry.identifier));
  const missing = GOVERNANCE_CATALOG_SEED.filter(entry => !existingIds.has(entry.identifier));
  if (missing.length) await db.insert(governanceCatalogEntries).values(missing.map(entry => ({ ...entry, userId, status: "catálogo" as const, requiresHumanApproval: 1 })));
  return db.select().from(governanceCatalogEntries).where(eq(governanceCatalogEntries.userId, userId)).orderBy(governanceCatalogEntries.kind, governanceCatalogEntries.name);
}

export async function updateGovernanceCatalogEntry(input: { userId: number; entryId: number; status: GovernanceCatalogStatus }) {
  const db = requireDatabase(await getDb());
  const [entry] = await db.select().from(governanceCatalogEntries).where(and(eq(governanceCatalogEntries.id, input.entryId), eq(governanceCatalogEntries.userId, input.userId))).limit(1);
  if (!entry) return undefined;
  await db.update(governanceCatalogEntries).set({ status: input.status, updatedAt: new Date() }).where(eq(governanceCatalogEntries.id, entry.id));
  const [updated] = await db.select().from(governanceCatalogEntries).where(eq(governanceCatalogEntries.id, entry.id)).limit(1);
  return updated;
}

export async function createGovernedToolInvocation(input: { userId: number; catalogEntryId: number; action: string; requestSummary: string; proposalOnly?: boolean }) {
  const db = requireDatabase(await getDb());
  const [entry] = await db.select().from(governanceCatalogEntries).where(and(eq(governanceCatalogEntries.id, input.catalogEntryId), eq(governanceCatalogEntries.userId, input.userId))).limit(1);
  if (!entry) throw new Error("Ferramenta ou rota não encontrada no catálogo protegido.");
  const status = input.proposalOnly || entry.status === "ativado" ? "proposta" as const : "bloqueada" as const;
  const result = await db.insert(governedToolInvocations).values({ userId: input.userId, catalogEntryId: entry.id, action: input.action, status, requestSummary: input.requestSummary, resultSummary: input.proposalOnly ? "Seleção registrada para revisão humana; nenhuma integração, credencial ou chamada externa foi executada." : status === "bloqueada" ? "Invocação registrada sem execução: a entrada ainda não foi ativada com aprovação humana." : null });
  return { id: Number(result[0].insertId), status, executed: false };
}

export async function countGovernedRouterProposals(userId: number) {
  const db = requireDatabase(await getDb());
  const records = await db.select({ id: governedToolInvocations.id }).from(governedToolInvocations).where(and(
    eq(governedToolInvocations.userId, userId),
    eq(governedToolInvocations.action, "9router: seleção governada")
  ));
  return records.length;
}

export async function recordCoreRoleAudit(input: {
  userId: number;
  roleId: GovernedCoreRoleId;
  eventName: string;
  status: CoreRoleAuditStatus;
  evidenceCount?: number;
  summary: string;
}) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(coreRoleAuditEvents).values({ ...input, evidenceCount: input.evidenceCount ?? 0 });
  return Number(result[0].insertId);
}

export async function updateOrchestrationCycle(input: {
  userId: number;
  status?: OrchestrationCycleStatus;
  scheduleCron?: string;
  taskUid?: string | null;
  minIntervalMinutes?: number;
  maxEvidencePerCycle?: number;
  pausedReason?: string | null;
}) {
  const cycle = await getOrCreateOrchestrationCycle(input.userId);
  const db = requireDatabase(await getDb());
  await db.update(orchestrationCycles).set({
    ...(input.status ? { status: input.status } : {}),
    ...(input.scheduleCron ? { scheduleCron: input.scheduleCron } : {}),
    ...(input.taskUid !== undefined ? { taskUid: input.taskUid } : {}),
    ...(input.minIntervalMinutes ? { minIntervalMinutes: input.minIntervalMinutes } : {}),
    ...(input.maxEvidencePerCycle ? { maxEvidencePerCycle: input.maxEvidencePerCycle } : {}),
    ...(input.pausedReason !== undefined ? { pausedReason: input.pausedReason } : {}),
    updatedAt: new Date(),
  }).where(eq(orchestrationCycles.id, cycle.id));
  const [updated] = await db.select().from(orchestrationCycles).where(eq(orchestrationCycles.id, cycle.id)).limit(1);
  return updated!;
}

export async function saveKnowledgeMemory(input: {
  userId: number;
  projectId?: number | null;
  sourceType: MemorySourceType;
  title: string;
  content: string;
  summary?: string | null;
  tags?: string[];
  sourceReference?: string | null;
}) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(knowledgeMemories).values({
    ...input,
    projectId: input.projectId ?? null,
    summary: input.summary ?? null,
    sourceReference: input.sourceReference ?? null,
    tags: input.tags ?? [],
  });
  return Number(result[0].insertId);
}

export async function upsertReferenceMemory(input: {
  userId: number;
  sourceReference: string;
  title: string;
  content: string;
  summary?: string | null;
  tags?: string[];
}) {
  const db = requireDatabase(await getDb());
  const [existing] = await db.select().from(knowledgeMemories).where(and(
    eq(knowledgeMemories.userId, input.userId),
    eq(knowledgeMemories.sourceReference, input.sourceReference)
  )).limit(1);
  if (existing) {
    await db.update(knowledgeMemories).set({
      title: input.title,
      content: input.content,
      summary: input.summary ?? null,
      tags: input.tags ?? [],
      updatedAt: new Date(),
    }).where(eq(knowledgeMemories.id, existing.id));
    return existing.id;
  }
  return saveKnowledgeMemory({
    userId: input.userId,
    sourceType: "referência",
    title: input.title,
    content: input.content,
    summary: input.summary ?? null,
    tags: input.tags,
    sourceReference: input.sourceReference,
  });
}

export async function listKnowledgeMemories(userId: number, projectId?: number | null) {
  const db = requireDatabase(await getDb());
  if (projectId === undefined) {
    return db.select().from(knowledgeMemories).where(eq(knowledgeMemories.userId, userId)).orderBy(desc(knowledgeMemories.updatedAt));
  }
  if (projectId === null) {
    return db.select().from(knowledgeMemories).where(eq(knowledgeMemories.userId, userId)).orderBy(desc(knowledgeMemories.updatedAt));
  }
  return db.select().from(knowledgeMemories).where(and(eq(knowledgeMemories.userId, userId), eq(knowledgeMemories.projectId, projectId))).orderBy(desc(knowledgeMemories.updatedAt));
}

export async function recordMemoryRetrieval(input: {
  userId: number;
  projectId?: number | null;
  query: string;
  retrievedMemoryIds: number[];
  retrievedEvidence?: Array<{ id: number; score: number; trustScore: number; retentionClass: string; sourceType: string; projectId: number | null }>;
}) {
  const db = requireDatabase(await getDb());
  await db.insert(memoryRetrievals).values({
    userId: input.userId,
    projectId: input.projectId ?? null,
    query: input.query,
    resultCount: input.retrievedMemoryIds.length,
    retrievedMemoryIds: input.retrievedMemoryIds,
    retrievedEvidence: input.retrievedEvidence ?? null,
  });
}

export async function reviewKnowledgeMemory(input: {
  userId: number;
  memoryId: number;
  trustScore: number;
  retentionClass: "curta" | "padrão" | "curada";
}) {
  const db = requireDatabase(await getDb());
  const [memory] = await db.select().from(knowledgeMemories).where(and(eq(knowledgeMemories.id, input.memoryId), eq(knowledgeMemories.userId, input.userId))).limit(1);
  if (!memory) return undefined;
  await db.update(knowledgeMemories).set({ trustScore: input.trustScore, retentionClass: input.retentionClass, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(knowledgeMemories.id, memory.id));
  const [updated] = await db.select().from(knowledgeMemories).where(eq(knowledgeMemories.id, memory.id)).limit(1);
  return updated;
}

export async function claimCycleRun(input: {
  userId: number;
  trigger: "manual" | "agendado" | "evento";
  idempotencyKey: string;
}) {
  const cycle = await getOrCreateOrchestrationCycle(input.userId);
  if (!canStartCycle(cycle)) return { cycle, run: undefined, reason: "ciclo indisponível ou aguardando revisão" as const };

  const db = requireDatabase(await getDb());
  try {
    const inserted = await db.insert(orchestrationCycleRuns).values({
      cycleId: cycle.id,
      trigger: input.trigger,
      idempotencyKey: input.idempotencyKey,
      status: "em execução",
    });
    const runId = Number(inserted[0].insertId);
    await db.update(orchestrationCycles).set({
      status: "em execução",
      lastStartedAt: new Date(),
      lastError: null,
      updatedAt: new Date(),
    }).where(eq(orchestrationCycles.id, cycle.id));
    const [run] = await db.select().from(orchestrationCycleRuns).where(eq(orchestrationCycleRuns.id, runId)).limit(1);
    const [updatedCycle] = await db.select().from(orchestrationCycles).where(eq(orchestrationCycles.id, cycle.id)).limit(1);
    return { cycle: updatedCycle!, run: run!, reason: undefined };
  } catch (error) {
    const [existing] = await db.select().from(orchestrationCycleRuns).where(eq(orchestrationCycleRuns.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existing) return { cycle, run: existing, reason: "execução idempotente já registrada" as const };
    throw error;
  }
}

export async function completeCycleRun(input: {
  cycleId: number;
  runId: number;
  status: Extract<OrchestrationCycleStatus, "aguardando revisão" | "concluído" | "com falha">;
  evidenceCount: number;
  retrievedCount: number;
  summary?: string | null;
  errorMessage?: string | null;
}) {
  const db = requireDatabase(await getDb());
  const now = new Date();
  await db.transaction(async tx => {
    await tx.update(orchestrationCycleRuns).set({
      status: input.status,
      evidenceCount: input.evidenceCount,
      retrievedCount: input.retrievedCount,
      summary: input.summary ?? null,
      errorMessage: input.errorMessage ?? null,
      finishedAt: now,
    }).where(eq(orchestrationCycleRuns.id, input.runId));
    await tx.update(orchestrationCycles).set({
      status: input.status,
      lastFinishedAt: now,
      lastError: input.errorMessage ?? null,
      updatedAt: now,
    }).where(eq(orchestrationCycles.id, input.cycleId));
  });
}

export async function createImprovementProposal(input: {
  cycleRunId: number;
  userId: number;
  title: string;
  rationale: string;
  evidence: unknown;
  proposedAction: string;
  riskLevel: "baixo" | "médio" | "alto";
}) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(improvementProposals).values(input);
  return Number(result[0].insertId);
}

export async function listImprovementProposals(userId: number) {
  const db = requireDatabase(await getDb());
  return db.select().from(improvementProposals).where(eq(improvementProposals.userId, userId)).orderBy(desc(improvementProposals.createdAt));
}

export async function reviewImprovementProposal(input: {
  proposalId: number;
  reviewerId: number;
  status: Exclude<ImprovementProposalStatus, "pendente">;
  reviewNote?: string;
}) {
  const db = requireDatabase(await getDb());
  const [proposal] = await db.select().from(improvementProposals).where(eq(improvementProposals.id, input.proposalId)).limit(1);
  if (!proposal) return false;
  const [run] = await db.select().from(orchestrationCycleRuns).where(eq(orchestrationCycleRuns.id, proposal.cycleRunId)).limit(1);
  const now = new Date();
  await db.transaction(async tx => {
    await tx.update(improvementProposals).set({
      status: input.status,
      reviewedBy: input.reviewerId,
      reviewedAt: now,
      reviewNote: input.reviewNote ?? null,
    }).where(eq(improvementProposals.id, input.proposalId));
    if (run) {
      await tx.update(orchestrationCycles).set({
        status: "pronto",
        pausedReason: null,
        updatedAt: now,
      }).where(eq(orchestrationCycles.id, run.cycleId));
    }
  });
  return true;
}

export async function recordOrchestraInboxEvent(input: {
  eventId: string;
  eventName: string;
  source: string;
  occurredAt: Date;
  payload: unknown;
  status?: OrchestraInboxStatus;
  verificationError?: string | null;
}) {
  const db = requireDatabase(await getDb());
  try {
    const result = await db.insert(orchestraInboxEvents).values({
      ...input,
      status: input.status ?? "recebido",
      verificationError: input.verificationError ?? null,
    });
    return { id: Number(result[0].insertId), duplicate: false };
  } catch (error) {
    const [existing] = await db.select().from(orchestraInboxEvents).where(eq(orchestraInboxEvents.eventId, input.eventId)).limit(1);
    if (existing) return { id: existing.id, duplicate: true };
    throw error;
  }
}

export async function listOrchestraInboxEvents(limit = 20) {
  const db = requireDatabase(await getDb());
  return db.select().from(orchestraInboxEvents).orderBy(desc(orchestraInboxEvents.receivedAt)).limit(limit);
}

export async function getOrchestrationDashboard(userId: number) {
  const cycle = await getOrCreateOrchestrationCycle(userId);
  const db = requireDatabase(await getDb());
  const [runs, proposals, memories, inbox, maturity, catalog, toolInvocations, coreRoleAudit] = await Promise.all([
    db.select().from(orchestrationCycleRuns).where(eq(orchestrationCycleRuns.cycleId, cycle.id)).orderBy(desc(orchestrationCycleRuns.startedAt)).limit(12),
    listImprovementProposals(userId),
    db.select().from(knowledgeMemories).where(eq(knowledgeMemories.userId, userId)).orderBy(desc(knowledgeMemories.updatedAt)).limit(12),
    listOrchestraInboxEvents(12),
    refreshOperationalMaturityProfile(userId),
    listOrSeedGovernanceCatalog(userId),
    db.select().from(governedToolInvocations).where(eq(governedToolInvocations.userId, userId)).orderBy(desc(governedToolInvocations.createdAt)).limit(12),
    db.select().from(coreRoleAuditEvents).where(eq(coreRoleAuditEvents.userId, userId)).orderBy(desc(coreRoleAuditEvents.createdAt)).limit(24),
  ]);
  const coreRoles = GOVERNED_CORE_ROLES.map(role => ({ ...role, latestAudit: coreRoleAudit.find(audit => audit.roleId === role.id) ?? null }));
  return { cycle, runs, proposals: proposals.slice(0, 12), memories, inbox, maturity, catalog, toolInvocations, coreRoles, coreRoleAudit };
}
