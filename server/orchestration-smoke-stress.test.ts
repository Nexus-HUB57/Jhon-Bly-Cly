import { describe, expect, it } from "vitest";
import { makeIdempotencyKey } from "./orchestration";
import { rankMemories } from "./memory";

const fixture = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  title: `Memória criativa ${index}`,
  content: index % 2 === 0 ? "direção de luz e câmera para vídeo" : "ritmo de edição e áudio",
  summary: "Evidência curada para teste local.",
  tags: [index % 2 === 0 ? "luz" : "áudio"],
  updatedAt: new Date(1_700_000_000_000 + index),
})) as any;

describe("smoke e estresse limitado da orquestração", () => {
  it("gera chave idempotente estável para a mesma execução", () => {
    expect(makeIdempotencyKey("cycle:1:manual")).toBe(makeIdempotencyKey("cycle:1:manual"));
  });

  it("processa 50 recuperações concorrentes locais sem chamar provedores externos", async () => {
    const results = await Promise.all(Array.from({ length: 50 }, () => Promise.resolve(rankMemories("direção luz vídeo", fixture, 12))));
    expect(results).toHaveLength(50);
    expect(results.every(result => result.length <= 12 && result[0]?.score > 0)).toBe(true);
  });
});
