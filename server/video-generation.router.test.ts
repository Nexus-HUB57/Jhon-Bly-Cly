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
  updateGenerationRunProgress: vi.fn(),
  updateProjectScenesStatus: vi.fn(),
  updateScene: vi.fn(),
  updateVideoProject: vi.fn(),
}));
const minimaxMock = vi.hoisted(() => ({
  createMiniMaxVideoTask: vi.fn(),
  hasMiniMaxCredentials: vi.fn(),
  queryMiniMaxVideoTask: vi.fn(),
}));
const fallbackEscalationMock = vi.hoisted(() => ({
  isMiniMaxInsufficientBalanceFailure: vi.fn(),
  registerInsufficientBalanceEscalation: vi.fn(),
}));

vi.mock("./db", () => dbMock);
vi.mock("./minimax", () => minimaxMock);
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
vi.mock("./orchestra", () => ({ deliverToNexusOrchestra: vi.fn() }));
vi.mock("./_core/imageGeneration", () => ({ generateImage: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("./memory", () => ({ rankMemories: vi.fn(() => []) }));
vi.mock("./orchestrationDb", () => ({ listKnowledgeMemories: vi.fn(), recordMemoryRetrieval: vi.fn() }));
vi.mock("./fallbackEscalation", () => fallbackEscalationMock);

describe("fluxo de geração de vídeo MiniMax", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.createOrchestraEvent.mockResolvedValue(undefined);
    minimaxMock.hasMiniMaxCredentials.mockReturnValue(true);
    fallbackEscalationMock.isMiniMaxInsufficientBalanceFailure.mockReturnValue(false);
  });

  it("encaminha somente ativos próprios de imagem e áudio como referências multimodais e registra a tarefa", async () => {
    const { storageGetSignedUrl } = await import("./storage");
    vi.mocked(storageGetSignedUrl).mockResolvedValueOnce("https://storage.example/persona.webp").mockResolvedValueOnce("https://storage.example/audio.mp3");
    dbMock.getVideoProject.mockResolvedValue({ id: 1, status: "aguardando revisão", format: "16:9", script: "Cena KTD" });
    dbMock.getProjectWorkspace.mockResolvedValue({ assets: [
      { id: 10, storageKey: "projects/1/persona.webp", mimeType: "image/webp" },
      { id: 11, storageKey: "projects/1/audio.mp3", mimeType: "audio/mpeg" },
    ] });
    dbMock.createGenerationRun.mockResolvedValue(88);
    minimaxMock.createMiniMaxVideoTask.mockResolvedValue({ task_id: "task-ktd" });
    const { videoRouter } = await import("./routers/video");
    const caller = videoRouter.createCaller({ user: { id: 7 } } as any);

    await expect(caller.projects.requestVideoGeneration({ projectId: 1, duration: 8, references: [{ assetId: 10 }, { assetId: 11, audioDurationSeconds: 8 }] })).resolves.toEqual({ runId: 88, taskId: "task-ktd", status: "gerando" });
    expect(minimaxMock.createMiniMaxVideoTask).toHaveBeenCalledWith(expect.objectContaining({
      duration: 8,
      references: [
        { kind: "image", url: "https://storage.example/persona.webp" },
        { kind: "audio", url: "https://storage.example/audio.mp3", durationSeconds: 8 },
      ],
    }));
    expect(dbMock.updateGenerationRunProgress).toHaveBeenCalledWith(88, expect.objectContaining({ taskId: "task-ktd", providerStatus: "queued", referenceAssetIds: [10, 11] }));
  });

  it("conclui uma tarefa consultada manualmente e cria o ativo de resultado somente após URL válida do provedor", async () => {
    dbMock.getGenerationRunForProject.mockResolvedValue({ run: { id: 88, runType: "vídeo", status: "gerando", output: { taskId: "task-ktd" } }, project: { id: 1 } });
    minimaxMock.queryMiniMaxVideoTask.mockResolvedValue({ task: { id: "task-ktd", status: "succeeded", content: { url: "https://video.example/ktd.mp4" } } });
    dbMock.createProjectAsset.mockResolvedValue(30);
    const { videoRouter } = await import("./routers/video");
    const caller = videoRouter.createCaller({ user: { id: 7 } } as any);

    await expect(caller.projects.pollVideoGeneration({ projectId: 1, runId: 88 })).resolves.toEqual({ runId: 88, status: "concluído", assetId: 30, terminal: true });
    expect(dbMock.completeGenerationRun).toHaveBeenCalledWith(88, "concluído", expect.objectContaining({ taskId: "task-ktd", providerStatus: "succeeded", assetId: 30 }));
    expect(dbMock.createProjectAsset).toHaveBeenCalledWith(expect.objectContaining({ projectId: 1, kind: "resultado de vídeo", url: "https://video.example/ktd.mp4" }));
  });

  it("registra a escalada governada quando o MiniMax informa saldo insuficiente, sem reenviar o vídeo", async () => {
    const { storageGetSignedUrl } = await import("./storage");
    vi.mocked(storageGetSignedUrl).mockResolvedValue("https://storage.example/persona.webp");
    dbMock.getVideoProject.mockResolvedValue({ id: 1, status: "aguardando revisão", format: "16:9", script: "Cena KTD" });
    dbMock.getProjectWorkspace.mockResolvedValue({ assets: [{ id: 10, storageKey: "projects/1/persona.webp", mimeType: "image/webp" }] });
    dbMock.createGenerationRun.mockResolvedValue(88);
    minimaxMock.createMiniMaxVideoTask.mockRejectedValue(new Error("insufficient balance (1008)"));
    fallbackEscalationMock.isMiniMaxInsufficientBalanceFailure.mockReturnValue(true);
    fallbackEscalationMock.registerInsufficientBalanceEscalation.mockResolvedValue({ proposalId: 91, created: true, eligibleCount: 0 });
    const { videoRouter } = await import("./routers/video");
    const caller = videoRouter.createCaller({ user: { id: 7 } } as any);

    await expect(caller.projects.requestVideoGeneration({ projectId: 1, duration: 8, references: [{ assetId: 10 }] })).rejects.toThrow();
    expect(fallbackEscalationMock.registerInsufficientBalanceEscalation).toHaveBeenCalledWith({ userId: 7, projectId: 1, runId: 88 });
    expect(minimaxMock.createMiniMaxVideoTask).toHaveBeenCalledTimes(1);
    expect(dbMock.updateVideoProject).toHaveBeenCalledWith(1, 7, { status: "com falha" });
  });
});
