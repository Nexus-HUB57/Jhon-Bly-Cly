import { describe, expect, it } from "vitest";

describe("MiniMax official credential", () => {
  it("autentica em uma consulta leve ao endpoint oficial sem expor a chave", async () => {
    const apiKey = process.env.MINIMAX_API_KEY;
    expect(apiKey, "MINIMAX_API_KEY deve estar configurada para o conector oficial").toBeTruthy();

    const baseUrl = (process.env.MINIMAX_API_BASE_URL || "https://api.minimax.io").replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/v2/query/video_generation/jbcx19-credential-check`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(response.status, "A API MiniMax rejeitou a credencial oficial").not.toBe(401);
    expect(response.status, "A API MiniMax rejeitou a credencial oficial").not.toBe(403);
  }, 20_000);
});
