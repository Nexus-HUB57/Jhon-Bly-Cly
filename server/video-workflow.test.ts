import { afterEach, describe, expect, it } from "vitest";
import { deliverToNexusOrchestra } from "./orchestra";
import { canTransitionTaskStatus, TASK_STATUSES } from "../shared/video";

const previousEndpoint = process.env.NEXUS_ORCHESTRA_WEBHOOK_URL;
const previousSecret = process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET;

afterEach(() => {
  if (previousEndpoint === undefined) delete process.env.NEXUS_ORCHESTRA_WEBHOOK_URL;
  else process.env.NEXUS_ORCHESTRA_WEBHOOK_URL = previousEndpoint;
  if (previousSecret === undefined) delete process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET;
  else process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET = previousSecret;
});

describe("workflow de vídeo", () => {
  it("mantém exatamente os seis estados de tarefa definidos para a plataforma", () => {
    expect(TASK_STATUSES).toEqual([
      "rascunho",
      "planejando",
      "aguardando revisão",
      "gerando",
      "concluído",
      "com falha",
    ]);
  });

  it("aceita apenas transições operacionais autorizadas", () => {
    expect(canTransitionTaskStatus("rascunho", "planejando")).toBe(true);
    expect(canTransitionTaskStatus("planejando", "aguardando revisão")).toBe(true);
    expect(canTransitionTaskStatus("aguardando revisão", "gerando")).toBe(true);
    expect(canTransitionTaskStatus("gerando", "concluído")).toBe(true);
    expect(canTransitionTaskStatus("com falha", "rascunho")).toBe(true);
    expect(canTransitionTaskStatus("gerando", "rascunho")).toBe(false);
    expect(canTransitionTaskStatus("concluído", "aguardando revisão")).toBe(false);
  });

  it("preserva o evento no outbox quando ainda não há endpoint do Orchestra configurado", async () => {
    delete process.env.NEXUS_ORCHESTRA_WEBHOOK_URL;
    delete process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET;

    const result = await deliverToNexusOrchestra({
      id: 8,
      projectId: 3,
      sceneId: null,
      eventName: "video.generation.requested",
      entityType: "generation_run",
      entityId: 19,
      payload: { status: "gerando" },
      occurredAt: new Date("2026-08-26T20:00:00.000Z"),
    });

    expect(result).toEqual({
      delivered: false,
      error: "Endpoint do Nexus_Orchestra ainda não configurado.",
    });
  });
});
