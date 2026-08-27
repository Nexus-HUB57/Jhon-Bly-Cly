import { describe, expect, it } from "vitest";
import { buildGovernedRoutePlan } from "../shared/governedRouter";
import { JBCX19_ADAPTERS } from "../shared/jbcx19Adapters";

describe("9router governado", () => {
  it("mantém as fontes bloqueadas fora de qualquer seleção", () => {
    const plan = buildGovernedRoutePlan({ capability: "planejamento e orquestração", maxRisk: "alto", request: "Organizar um plano criativo", rotationOffset: 0 });
    expect(plan.totalAdapters).toBe(19);
    expect(plan.candidates.every(candidate => candidate.riskLevel !== "bloqueado")).toBe(true);
    expect(plan.candidates.every(candidate => candidate.execution === "proposta" && candidate.requiresHumanApproval)).toBe(true);
  });

  it("alterna a prioridade entre candidatos elegíveis sem acioná-los", () => {
    const first = buildGovernedRoutePlan({ capability: "planejamento e orquestração", maxRisk: "alto", request: "Estruturar a produção", rotationOffset: 0 });
    const second = buildGovernedRoutePlan({ capability: "planejamento e orquestração", maxRisk: "alto", request: "Estruturar a produção", rotationOffset: 1 });
    expect(first.candidates.length).toBeGreaterThan(1);
    expect(second.candidates[0]?.id).toBe(first.candidates[1]?.id);
    expect(JBCX19_ADAPTERS.filter(adapter => adapter.status === "bloqueado").every(adapter => !second.candidates.some(candidate => candidate.id === adapter.id))).toBe(true);
  });
});
