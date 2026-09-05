import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "../../shared/const";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { rankMemories } from "../memory";
import { makeIdempotencyKey, runGovernedCycle } from "../orchestration";
import {
  createGovernedToolInvocation,
  getOrchestrationDashboard,
  listKnowledgeMemories,
  recordMemoryRetrieval,
  recordCoreRoleAudit,
  reviewKnowledgeMemory,
  reviewImprovementProposal,
  saveKnowledgeMemory,
  updateGovernanceCatalogEntry,
  updateOrchestrationCycle,
} from "../orchestrationDb";

const memoryInput = z.object({
  title: z.string().trim().min(3).max(255),
  content: z.string().trim().min(3).max(8_000),
  summary: z.string().trim().max(2_000).optional(),
  tags: z.array(z.string().trim().min(2).max(60)).max(12).optional(),
  projectId: z.number().int().positive().optional(),
});

const blockedMemoryPattern = /(api[-_ ]?key|bearer\s+[a-z0-9._-]{16,}|secret\s*[=:]|password\s*[=:])/i;
const heartbeatCronSchema = z.string().trim().regex(/^\S+(\s+\S+){5}$/, "Use cron UTC de seis campos: seg min hora dia mês semana.");

function sessionFromRequest(req: { headers: { cookie?: string } }) {
  const encoded = req.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  return encoded ? decodeURIComponent(encoded) : "";
}

async function retrieveContext(input: { userId: number; query: string; projectId?: number }) {
  const memories = await listKnowledgeMemories(input.userId, input.projectId);
  const results = rankMemories(input.query, memories);
  await recordMemoryRetrieval({
    userId: input.userId,
    projectId: input.projectId,
    query: input.query,
    retrievedMemoryIds: results.map(memory => memory.id),
    retrievedEvidence: results.map(memory => ({ id: memory.id, score: memory.score, trustScore: memory.trustScore, retentionClass: memory.retentionClass, sourceType: memory.sourceType, projectId: memory.projectId })),
  });
  await recordCoreRoleAudit({ userId: input.userId, roleId: "planner", eventName: "Recuperação contextual", status: results.length ? "pronto" : "aguardando evidências", evidenceCount: results.length, summary: `Consulta auditável com ${results.length} memória(s) recuperada(s).` });
  return results;
}

export const orchestrationRouter = router({
  dashboard: protectedProcedure.query(({ ctx }) => getOrchestrationDashboard(ctx.user.id)),

  saveMemory: protectedProcedure.input(memoryInput).mutation(async ({ ctx, input }) => {
    if (blockedMemoryPattern.test(input.content)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Memória recusada: não armazene credenciais ou segredos." });
    }
    const id = await saveKnowledgeMemory({
      userId: ctx.user.id,
      projectId: input.projectId ?? null,
      sourceType: "manual",
      title: input.title,
      content: input.content,
      summary: input.summary,
      tags: input.tags,
    });
    return { id };
  }),

  retrieveMemory: protectedProcedure.input(z.object({ query: z.string().trim().min(3).max(500), projectId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => {
    return retrieveContext({ userId: ctx.user.id, ...input });
  }),

  plannerRetrieve: protectedProcedure.input(z.object({ query: z.string().trim().min(3).max(500), projectId: z.number().int().positive().optional() })).mutation(({ ctx, input }) => retrieveContext({ userId: ctx.user.id, ...input })),

  resume: protectedProcedure.input(z.object({ scheduleCron: heartbeatCronSchema.optional() })).mutation(async ({ ctx, input }) => {
    const cycle = await updateOrchestrationCycle({ userId: ctx.user.id, status: "pronto", scheduleCron: input.scheduleCron, pausedReason: null });
    if (cycle.taskUid && process.env.NODE_ENV === "production") {
      await updateHeartbeatJob(cycle.taskUid, { enable: true }, sessionFromRequest(ctx.req));
    }
    return cycle;
  }),

  pause: protectedProcedure.input(z.object({ reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
    const cycle = await updateOrchestrationCycle({ userId: ctx.user.id, status: "pausado", pausedReason: input.reason });
    if (cycle.taskUid && process.env.NODE_ENV === "production") {
      await updateHeartbeatJob(cycle.taskUid, { enable: false }, sessionFromRequest(ctx.req));
    }
    await recordCoreRoleAudit({ userId: ctx.user.id, roleId: "monitor", eventName: "Pausa de ciclo", status: "observando", summary: `Ciclo pausado para revisão: ${input.reason}` });
    return cycle;
  }),

  registerPeriodicSchedule: adminProcedure.input(z.object({ cron: heartbeatCronSchema.default("0 0 */6 * * *") })).mutation(async ({ ctx, input }) => {
    if (process.env.NODE_ENV !== "production") {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Publique um checkpoint antes de registrar o ciclo periódico." });
    }
    const cycle = await updateOrchestrationCycle({ userId: ctx.user.id, status: "pronto", scheduleCron: input.cron, pausedReason: null });
    const userSession = sessionFromRequest(ctx.req);
    if (cycle.taskUid) {
      await updateHeartbeatJob(cycle.taskUid, { cron: input.cron, path: "/api/scheduled/memory-cycle", method: "POST", enable: true }, userSession);
      return { taskUid: cycle.taskUid, created: false };
    }
    const job = await createHeartbeatJob({
      name: `jbc-memory-cycle-${ctx.user.id}`,
      cron: input.cron,
      path: "/api/scheduled/memory-cycle",
      method: "POST",
      payload: {},
      description: "Ciclo periódico governado de memória e propostas do JBC.",
    }, userSession);
    await updateOrchestrationCycle({ userId: ctx.user.id, taskUid: job.taskUid, status: "pronto", scheduleCron: input.cron, pausedReason: null });
    return { taskUid: job.taskUid, created: true };
  }),

  runOnce: protectedProcedure.mutation(({ ctx }) => runGovernedCycle({
    userId: ctx.user.id,
    trigger: "manual",
    idempotencyKey: makeIdempotencyKey(`manual:${ctx.user.id}:${Date.now()}`),
  })),

  reviewProposal: adminProcedure.input(z.object({
    proposalId: z.number().int().positive(),
    status: z.enum(["aprovada", "rejeitada"]),
    note: z.string().trim().max(2_000).optional(),
  })).mutation(async ({ ctx, input }) => {
    const reviewed = await reviewImprovementProposal({
      proposalId: input.proposalId,
      reviewerId: ctx.user.id,
      status: input.status,
      reviewNote: input.note,
    });
    if (!reviewed) throw new TRPCError({ code: "NOT_FOUND", message: "Proposta não encontrada." });
    await recordCoreRoleAudit({ userId: ctx.user.id, roleId: "optimizer", eventName: "Revisão de proposta", status: input.status === "aprovada" ? "pronto" : "aguardando revisão", summary: `Proposta ${input.proposalId} foi ${input.status}.` });
    return { success: true, actionExecuted: false };
  }),

  reviewMemory: adminProcedure.input(z.object({
    memoryId: z.number().int().positive(),
    trustScore: z.number().int().min(0).max(100),
    retentionClass: z.enum(["curta", "padrão", "curada"]),
  })).mutation(async ({ ctx, input }) => {
    const memory = await reviewKnowledgeMemory({ userId: ctx.user.id, ...input });
    if (!memory) throw new TRPCError({ code: "NOT_FOUND", message: "Memória não encontrada." });
    return memory;
  }),

  stageCatalogEntry: adminProcedure.input(z.object({
    entryId: z.number().int().positive(),
    status: z.enum(["catálogo", "aguardando aprovação", "bloqueado"]),
  })).mutation(async ({ ctx, input }) => {
    const entry = await updateGovernanceCatalogEntry({ userId: ctx.user.id, ...input });
    if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Entrada de catálogo não encontrada." });
    return entry;
  }),

  proposeCatalogAction: protectedProcedure.input(z.object({
    catalogEntryId: z.number().int().positive(),
    action: z.string().trim().min(3).max(255),
    requestSummary: z.string().trim().min(3).max(2_000),
  })).mutation(async ({ ctx, input }) => {
    const proposal = await createGovernedToolInvocation({ userId: ctx.user.id, ...input });
    await recordCoreRoleAudit({ userId: ctx.user.id, roleId: "executor", eventName: "Intenção de ferramenta", status: proposal.status === "bloqueada" ? "bloqueado" : "aguardando revisão", summary: `Intenção registrada para ${input.action}; execução externa não ocorreu.` });
    return proposal;
  }),

  observeCoreRole: protectedProcedure.input(z.object({
    roleId: z.enum(["planner", "executor", "monitor", "optimizer"]),
    summary: z.string().trim().min(3).max(500),
  })).mutation(async ({ ctx, input }) => {
    const status = input.roleId === "monitor" ? "observando" : input.roleId === "optimizer" ? "aguardando revisão" : "pronto";
    const id = await recordCoreRoleAudit({ userId: ctx.user.id, roleId: input.roleId, eventName: "Observação manual", status, summary: input.summary });
    return { id, executed: false };
  }),
});
