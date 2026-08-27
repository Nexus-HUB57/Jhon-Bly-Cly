import { afterEach, describe, expect, it, vi } from "vitest";

describe("MiniMax native adapter", () => {
  const originalKey = process.env.MINIMAX_API_KEY;
  const originalUrl = process.env.MINIMAX_API_BASE_URL;

  afterEach(() => {
    process.env.MINIMAX_API_KEY = originalKey;
    process.env.MINIMAX_API_BASE_URL = originalUrl;
    vi.restoreAllMocks();
  });

  it("bloqueia chamada sem credencial oficial", async () => {
    delete process.env.MINIMAX_API_KEY;
    vi.resetModules();
    const adapter = await import("./minimax");
    await expect(adapter.createMiniMaxVideoTask({ prompt: "Cena de teste", duration: 8, ratio: "16:9" })).rejects.toThrow("aguarda uma credencial oficial");
  });

  it("envia somente o contrato público MiniMax-H3 quando a credencial está configurada", async () => {
    process.env.MINIMAX_API_KEY = "test-official-key";
    process.env.MINIMAX_API_BASE_URL = "https://api.minimax.io";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ task_id: "task-123" }) });
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    const adapter = await import("./minimax");
    await expect(adapter.createMiniMaxVideoTask({ prompt: "Cena de teste", duration: 8, ratio: "16:9" })).resolves.toEqual({ task_id: "task-123" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.minimax.io/v2/video_generation", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer test-official-key" }) }));
  });

  it("monta referências de imagem e áudio com os papéis públicos e razão adaptativa", async () => {
    const adapter = await import("./minimax");
    expect(adapter.buildMiniMaxVideoPayload({
      prompt: "Performance de estúdio com iluminação editorial.",
      duration: 8,
      ratio: "16:9",
      references: [
        { kind: "image", url: "https://cdn.example.com/persona.webp" },
        { kind: "audio", url: "https://cdn.example.com/trecho.mp3", durationSeconds: 8 },
      ],
    })).toEqual(expect.objectContaining({
      ratio: "adaptive",
      content: expect.arrayContaining([
        expect.objectContaining({ type: "image_url", role: "reference_image" }),
        expect.objectContaining({ type: "audio_url", role: "reference_audio" }),
      ]),
    }));
  });

  it("rejeita áudio de referência fora da janela oficial", async () => {
    const adapter = await import("./minimax");
    expect(() => adapter.buildMiniMaxVideoPayload({
      prompt: "Cena de teste",
      duration: 8,
      ratio: "16:9",
      references: [{ kind: "audio", url: "https://cdn.example.com/faixa.mp3", durationSeconds: 16 }],
    })).toThrow("entre 2 e 15 segundos");
  });

  it("consulta uma tarefa de vídeo sem recriá-la", async () => {
    process.env.MINIMAX_API_KEY = "test-official-key";
    process.env.MINIMAX_API_BASE_URL = "https://api.minimax.io";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ task: { id: "task-123", status: "running" } }) });
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    const adapter = await import("./minimax");
    await expect(adapter.queryMiniMaxVideoTask("task-123")).resolves.toEqual({ task: { id: "task-123", status: "running" } });
    expect(fetchMock).toHaveBeenCalledWith("https://api.minimax.io/v2/query/video_generation/task-123", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-official-key" }) }));
  });
});
