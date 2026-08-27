import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  completeGenerationRun: vi.fn(),
  createGenerationRun: vi.fn(),
  createOrchestraEvent: vi.fn(),
  createProjectAsset: vi.fn(),
  createVideoProject: vi.fn(),
  getGenerationRunForProject: vi.fn(),
  getProjectWorkspace: vi.fn(),
  getSceneForUser: vi.fn(),
  getVideoProject: vi.fn(),
  listReferenceAssets: vi.fn(),
  listVideoProjects: vi.fn(),
  recordOrchestraDelivery: vi.fn(),
  replaceProjectPlan: vi.fn(),
  reviewSceneProductionPackage: vi.fn(),
  updateGenerationRunProgress: vi.fn(),
  updateProjectScenesStatus: vi.fn(),
  updateScene: vi.fn(),
  updateVideoProject: vi.fn(),
  upsertSceneProductionPackage: vi.fn(),
}));
const minimaxMock = vi.hoisted(() => ({ createMiniMaxVideoTask: vi.fn(), hasMiniMaxCredentials: vi.fn(), queryMiniMaxVideoTask: vi.fn() }));

vi.mock("./db", () => dbMock);
vi.mock("./minimax", () => minimaxMock);
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./orchestra", () => ({ deliverToNexusOrchestra: vi.fn() }));
vi.mock("./_core/imageGeneration", () => ({ generateImage: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("./memory", () => ({ rankMemories: vi.fn(() => []) }));
vi.mock("./orchestrationDb", () => ({ listKnowledgeMemories: vi.fn(), recordMemoryRetrieval: vi.fn() }));

describe("router de pacote de produção", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.createOrchestraEvent.mockResolvedValue(undefined);
    dbMock.getSceneForUser.mockResolvedValue({
      project: { id: 1 },
      scene: {
        id: 4,
        durationSeconds: 8,
        storyboardPrompt: "Persona em estúdio com aproximação suave.",
        camera: "Plano médio e dolly-in lento.",
        narrative: "A persona conduz a cena com presença comercial.",
      },
    });
  });

  it("cria uma proposta de produção sem criar tarefa de mídia", async () => {
    dbMock.upsertSceneProductionPackage.mockResolvedValue({ id: 77, sceneId: 4, status: "rascunho" });
    const { videoRouter } = await import("./routers/video");
    const caller = videoRouter.createCaller({ user: { id: 7 } } as any);

    await expect(caller.production.createDraft({ projectId: 1, sceneId: 4 })).resolves.toEqual({ id: 77, sceneId: 4, status: "rascunho" });
    expect(dbMock.upsertSceneProductionPackage).toHaveBeenCalledWith(expect.objectContaining({ projectId: 1, sceneId: 4, userId: 7, content: expect.objectContaining({ audioPlan: expect.any(Object), qualityGate: expect.any(Object) }) }));
    expect(minimaxMock.createMiniMaxVideoTask).not.toHaveBeenCalled();
  });

  it("registra a decisão humana sem alterar o estado da cena ou gerar mídia", async () => {
    dbMock.reviewSceneProductionPackage.mockResolvedValue({ id: 77, sceneId: 4, status: "aprovado", reviewNote: "Pronto para o próximo gate." });
    const { videoRouter } = await import("./routers/video");
    const caller = videoRouter.createCaller({ user: { id: 7 } } as any);

    await expect(caller.production.review({ sceneId: 4, status: "aprovado", reviewNote: "Pronto para o próximo gate." })).resolves.toEqual({ id: 77, sceneId: 4, status: "aprovado", reviewNote: "Pronto para o próximo gate." });
    expect(dbMock.updateScene).not.toHaveBeenCalled();
    expect(minimaxMock.createMiniMaxVideoTask).not.toHaveBeenCalled();
  });
});
