import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const orchestrationSource = readFileSync(new URL("../client/src/pages/Orchestration.tsx", import.meta.url), "utf8");

describe("bind blueprint UI contract", () => {
  it("exibe as camadas e mantém a superfície declarativa", () => {
    expect(orchestrationSource).toContain("Núcleos de bind");
    expect(orchestrationSource).toContain("BIND_BLUEPRINT.map");
    expect(orchestrationSource).toContain("não inicia processamento externo");
    expect(orchestrationSource).toContain("nenhuma camada cria saldo");
  });
});
