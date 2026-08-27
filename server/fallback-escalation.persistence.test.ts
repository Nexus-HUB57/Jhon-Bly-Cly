import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({ createOrchestraEvent: vi.fn() }));
const orchestrationMock = vi.hoisted(() => ({
  countGovernedRouterProposals: vi.fn(),
  createGovernedToolInvocation: vi.fn(),
  findGovernedToolInvocation: vi.fn(),
  listOrSeedGovernanceCatalog: vi.fn(),
  recordCoreRoleAudit: vi.fn(),
}));

vi.mock("./db", () => dbMock);
vi.mock("./orchestrationDb", () => orchestrationMock);

describe("persistência da escalada de saldo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orchestrationMock.findGovernedToolInvocation.mockResolvedValue(undefined);
    orchestrationMock.countGovernedRouterProposals.mockResolvedValue(2);
    orchestrationMock.listOrSeedGovernanceCatalog.mockResolvedValue([{ id: 9, identifier: "9router" }]);
    orchestrationMock.createGovernedToolInvocation.mockResolvedValue({ id: 31, status: "proposta", executed: false });
    dbMock.createOrchestraEvent.mockResolvedValue({ id: 88 });
  });

  it("cria somente proposta, auditoria e evento local quando não há crédito", async () => {
    const { registerInsufficientBalanceEscalation } = await import("./fallbackEscalation");

    await expect(registerInsufficientBalanceEscalation({ userId: 7, projectId: 1, runId: 88 })).resolves.toEqual({ proposalId: 31, created: true, eligibleCount: 0 });
    expect(orchestrationMock.createGovernedToolInvocation).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7,
      catalogEntryId: 9,
      action: "9router: escalada por saldo insuficiente",
      proposalOnly: true,
    }));
    expect(orchestrationMock.recordCoreRoleAudit).toHaveBeenCalledWith(expect.objectContaining({ roleId: "planner", status: "aguardando revisão" }));
    expect(dbMock.createOrchestraEvent).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 1,
      eventName: "video.generation.fallback_proposed",
      payload: expect.objectContaining({ runId: 88, execution: "nenhuma", approvalRequired: true }),
    }));
  });

  it("não duplica a proposta quando a mesma execução já foi escalada", async () => {
    orchestrationMock.findGovernedToolInvocation.mockResolvedValue({ id: 31 });
    const { registerInsufficientBalanceEscalation } = await import("./fallbackEscalation");

    await expect(registerInsufficientBalanceEscalation({ userId: 7, projectId: 1, runId: 88 })).resolves.toEqual({ proposalId: 31, created: false, eligibleCount: 0 });
    expect(orchestrationMock.createGovernedToolInvocation).not.toHaveBeenCalled();
    expect(dbMock.createOrchestraEvent).not.toHaveBeenCalled();
  });
});
