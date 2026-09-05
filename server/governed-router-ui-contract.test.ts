import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("painel 9router governado", () => {
  it("expõe prévia auditável e registra seleção como revisão, sem controle de execução externa", () => {
    const source = readFileSync(new URL("../client/src/pages/Orchestration.tsx", import.meta.url), "utf8");
    expect(source).toContain("9router · alternância governada");
    expect(source).toContain("trpc.fusion.routerPreview.useQuery");
    expect(source).toContain("trpc.fusion.proposeGovernedRoute.useMutation");
    expect(source).toContain("Registrar seleção para revisão");
    expect(source).toContain("nenhuma execução externa ocorreu");
  });
});
