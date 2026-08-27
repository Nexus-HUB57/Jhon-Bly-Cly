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
});
