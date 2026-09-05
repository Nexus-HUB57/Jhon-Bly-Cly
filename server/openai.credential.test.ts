import { describe, expect, it } from "vitest";

describe("OpenAI official credential", () => {
  it("autentica em uma consulta leve ao endpoint oficial sem expor a chave", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey, "OPENAI_API_KEY deve estar configurada para o conector oficial").toBeTruthy();

    const response = await fetch("https://api.openai.com/v1/models?limit=1", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(response.status, "A API OpenAI rejeitou a credencial oficial").not.toBe(401);
    expect(response.status, "A API OpenAI rejeitou a credencial oficial").not.toBe(403);
  }, 20_000);
});
