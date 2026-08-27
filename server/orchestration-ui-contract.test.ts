import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("../client/src/pages/Orchestration.tsx", import.meta.url), "utf8");

describe("contrato visual de recuperação da orquestração", () => {
  it("mantém mensagens e ações de nova tentativa para dashboard, provedores e adaptadores", () => {
    expect(pageSource).toContain("dashboardQuery.isError");
    expect(pageSource).toContain("dashboardQuery.refetch()");
    expect(pageSource).toContain("providersQuery.isError");
    expect(pageSource).toContain("providersQuery.refetch()");
    expect(pageSource).toContain("adaptersQuery.isError");
    expect(pageSource).toContain("adaptersQuery.refetch()");
  });
});
