import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const orchestrationDbMock = vi.hoisted(() => ({
  createGovernedToolInvocation: vi.fn(),
  getOrchestrationDashboard: vi.fn(),
  listKnowledgeMemories: vi.fn(),
  recordMemoryRetrieval: vi.fn(),
  recordCoreRoleAudit: vi.fn(),
  reviewKnowledgeMemory: vi.fn(),
  reviewImprovementProposal: vi.fn(),
  saveKnowledgeMemory: vi.fn(),
  updateGovernanceCatalogEntry: vi.fn(),
  updateOrchestrationCycle: vi.fn(),
}));
const fusionDbMock = vi.hoisted(() => ({ listFusionConnectorProfiles: vi.fn() }));

vi.mock("./orchestrationDb", () => orchestrationDbMock);
vi.mock("./db", () => fusionDbMock);
vi.mock("./orchestration", () => ({ makeIdempotencyKey: vi.fn(), runGovernedCycle: vi.fn() }));
vi.mock("./_core/heartbeat", () => ({ createHeartbeatJob: vi.fn(), updateHeartbeatJob: vi.fn() }));

import { fusionRouter } from "./routers/fusion";
import { orchestrationRouter } from "./routers/orchestration";

function authenticatedContext(): TrpcContext {
  return {
    user: { id: 1, openId: "owner", name: "Owner", email: "owner@example.com", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("smoke autenticado da orquestração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orchestrationDbMock.getOrchestrationDashboard.mockResolvedValue({ cycle: { id: 1, status: "pausado" }, runs: [], proposals: [], memories: [], inbox: [], maturity: { score: 0, level: "observação" }, catalog: [], toolInvocations: [] });
    orchestrationDbMock.listKnowledgeMemories.mockResolvedValue([]);
    orchestrationDbMock.recordMemoryRetrieval.mockResolvedValue(undefined);
    orchestrationDbMock.recordCoreRoleAudit.mockResolvedValue(1);
    orchestrationDbMock.createGovernedToolInvocation.mockResolvedValue({ id: 1, status: "bloqueada", executed: false });
    fusionDbMock.listFusionConnectorProfiles.mockResolvedValue([]);
  });

  it("carrega dashboard, provedores e adaptadores para um administrador autenticado", async () => {
    const context = authenticatedContext();
    const [dashboard, providers, adapters] = await Promise.all([
      orchestrationRouter.createCaller(context).dashboard(),
      fusionRouter.createCaller(context).providers(),
      fusionRouter.createCaller(context).adapters(),
    ]);

    expect(dashboard.cycle.status).toBe("pausado");
    expect(providers.summary).toEqual({ total: 8, active: 6, inactive: 2 });
    expect(adapters.items).toHaveLength(19);
    expect(orchestrationDbMock.getOrchestrationDashboard).toHaveBeenCalledWith(1);
    expect(fusionDbMock.listFusionConnectorProfiles).toHaveBeenCalledWith(1);
  });

  it("registra telemetria funcional por papel sem executar efeitos externos", async () => {
    const caller = orchestrationRouter.createCaller(authenticatedContext());
    await caller.plannerRetrieve({ query: "contexto criativo" });
    await caller.observeCoreRole({ roleId: "monitor", summary: "Inspeção dos limites de ciclo." });
    await caller.observeCoreRole({ roleId: "optimizer", summary: "Observação de melhoria sujeita a revisão." });
    await caller.proposeCatalogAction({ catalogEntryId: 1, action: "avaliar contrato", requestSummary: "Registrar intenção sem chamada externa." });

    expect(orchestrationDbMock.recordCoreRoleAudit).toHaveBeenCalledWith(expect.objectContaining({ roleId: "planner", status: "aguardando evidências" }));
    expect(orchestrationDbMock.recordCoreRoleAudit).toHaveBeenCalledWith(expect.objectContaining({ roleId: "monitor", status: "observando" }));
    expect(orchestrationDbMock.recordCoreRoleAudit).toHaveBeenCalledWith(expect.objectContaining({ roleId: "optimizer", status: "aguardando revisão" }));
    expect(orchestrationDbMock.recordCoreRoleAudit).toHaveBeenCalledWith(expect.objectContaining({ roleId: "executor", status: "bloqueado" }));
    expect(orchestrationDbMock.createGovernedToolInvocation).toHaveBeenCalledWith(expect.objectContaining({ userId: 1, catalogEntryId: 1 }));
  });
});
