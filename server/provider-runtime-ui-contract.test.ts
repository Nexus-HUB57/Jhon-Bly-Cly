import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("superfície de disponibilidade sem cobrança", () => {
  it("mostra elegibilidade como informação e não apresenta execução de fallback", () => {
    const source = readFileSync(new URL("../client/src/pages/Orchestration.tsx", import.meta.url), "utf8");
    expect(source).toContain("A elegibilidade sem cobrança nunca inicia uma chamada.");
    expect(source).toContain("sem cobrança: {provider.freeFallbackStatus}");
    expect(source).toContain("Token: {provider.tokenSynchronization} · Contrato: {provider.contractStatus}");
    expect(source).toContain("{provider.freeFallbackNote}");
  });
});
