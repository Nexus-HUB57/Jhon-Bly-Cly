import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  completeGenerationRun: vi.fn(),
  createGenerationRun: vi.fn(),
  createOrchestraEvent: vi.fn(),
  createProjectAsset: vi.fn(),
  createVideoProject: vi.fn(),
  getProjectWorkspace: vi.fn(),
  getSceneForUser: vi.fn(),
  getVideoProject: vi.fn(),
  listVideoProjects: vi.fn(),
  recordOrchestraDelivery: vi.fn(),
  replaceProjectPlan: vi.fn(),
  updateProjectScenesStatus: vi.fn(),
  updateScene: vi.fn(),
  updateVideoProject: vi.fn(),
}));

const llmMock = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
const orchestraMock = vi.hoisted(() => ({ deliverToNexusOrchestra: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/llm", () => llmMock);
vi.mock("./orchestra", () => orchestraMock);
vi.mock("./_core/imageGeneration", () => ({ generateImage: vi.fn() }));
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { videoRouter } from "./routers/video";

const project = {
  id: 7,
  userId: 1,
  name: "Filme de lançamento",
  briefing: "Apresentar um lançamento de produto com linguagem cinematográfica e foco no público profissional.",
  format: "16:9",
  durationSeconds: 30,
  language: "Português (Brasil)",
  objective: "Explicar o lançamento",
  creativeDirection: "Teal, azul e coral",
  script: null,
  creativeSummary: null,
  status: "rascunho" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function context(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "project-owner",
      name: "Owner",
      email: "owner@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("video.projects.plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getVideoProject.mockResolvedValue(project);
    dbMocks.createGenerationRun.mockResolvedValue(41);
    dbMocks.createOrchestraEvent.mockImplementation(async (input: Record<string, unknown>) => ({
      id: 100,
      ...input,
      occurredAt: new Date("2026-08-26T20:00:00.000Z"),
    }));
    orchestraMock.deliverToNexusOrchestra.mockResolvedValue({ delivered: true });
    llmMock.invokeLLM.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            creativeSummary: "Uma peça de apresentação de alto contraste.",
            script: "Abertura, demonstração e encerramento.",
            scenes: [{
              title: "Abertura",
              durationSeconds: 10,
              narrative: "O produto surge em uma superfície arquitetônica.",
              camera: "Travelling lento frontal.",
              visualPrompt: "produto central em cenário arquitetônico",
              productionPrompt: "movimento suave e iluminação de estúdio",
              storyboardPrompt: "frame amplo com produto em destaque",
            }],
          }),
        },
      }],
    });
  });

  it("persiste roteiro, cenas, versão e eventos após receber o plano estruturado", async () => {
    const caller = videoRouter.createCaller(context());

    await expect(caller.projects.plan({ projectId: 7 })).resolves.toEqual({ success: true, scenesCreated: 1 });

    expect(dbMocks.updateVideoProject).toHaveBeenCalledWith(7, 1, { status: "planejando" });
    expect(dbMocks.replaceProjectPlan).toHaveBeenCalledWith(7, 1, expect.objectContaining({
      script: "Abertura, demonstração e encerramento.",
      creativeSummary: "Uma peça de apresentação de alto contraste.",
      scenes: [expect.objectContaining({ sceneNumber: 1, status: "aguardando revisão" })],
    }));
    expect(dbMocks.completeGenerationRun).toHaveBeenCalledWith(41, "concluído", { scenesCreated: 1 });
    expect(dbMocks.createOrchestraEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName: "video.planning.ready_for_review" }));
    expect(dbMocks.recordOrchestraDelivery).toHaveBeenCalledWith(100, true, undefined);
  });
});
