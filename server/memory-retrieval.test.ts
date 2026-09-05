import { describe, expect, it } from "vitest";
import { rankMemories, tokenizeMemoryQuery } from "./memory";

const memories = [
  {
    id: 1,
    title: "Direção de luz para KTD",
    content: "Estúdio com contraste suave, teal e coral.",
    summary: "Referência de fotografia live action.",
    tags: ["luz", "live action"],
    updatedAt: new Date("2026-08-26T12:00:00.000Z"),
  },
  {
    id: 2,
    title: "Plano de áudio",
    content: "A trilha deve ser tratada na pós-produção.",
    summary: "Sem referência visual.",
    tags: ["áudio"],
    updatedAt: new Date("2026-08-26T13:00:00.000Z"),
  },
] as any;

describe("recuperação contextual lexical", () => {
  it("normaliza termos em português sem duplicá-los", () => {
    expect(tokenizeMemoryQuery("Luz, luz e direção criativa")).toEqual(["luz", "direcao", "criativa"]);
  });

  it("prioriza título e tags relevantes e respeita limite", () => {
    const ranked = rankMemories("direção luz live", memories, 1);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.id).toBe(1);
    expect(ranked[0]?.score).toBeGreaterThan(0);
  });
});
