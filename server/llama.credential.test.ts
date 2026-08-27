import { describe, expect, it } from "vitest";

describe("Llama official connector credential", () => {
  it("autentica em uma consulta leve ao endpoint configurado sem expor segredos", async () => {
    const apiKey = process.env.LLAMA_API_KEY;
    const baseUrl = process.env.LLAMA_API_BASE_URL;
    const model = process.env.LLAMA_MODEL;
    expect(apiKey, "LLAMA_API_KEY deve estar configurada").toBeTruthy();
    expect(baseUrl, "LLAMA_API_BASE_URL deve estar configurada").toBeTruthy();
    expect(model, "LLAMA_MODEL deve estar configurado").toBeTruthy();

    const response = await fetch(`${baseUrl!.replace(/\/+$/, "")}/v1/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(response.status, "O endpoint Llama rejeitou a credencial configurada").not.toBe(401);
    expect(response.status, "O endpoint Llama rejeitou a credencial configurada").not.toBe(403);
  }, 20_000);
});
