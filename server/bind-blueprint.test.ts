import { describe, expect, it } from "vitest";
import { BIND_BLUEPRINT, createBindProposal, isBindExecutionBlocked } from "../shared/bindBlueprint";

describe("bind blueprint", () => {
  it("mantém a sequência completa de núcleos declarativos", () => {
    expect(BIND_BLUEPRINT.map(layer => layer.id)).toEqual(["ingestao", "orcamento", "politica", "roteamento", "auditoria"]);
    expect(BIND_BLUEPRINT.every(layer => layer.execution !== "somente-dados" || layer.id === "ingestao" || layer.id === "orcamento")).toBe(true);
  });

  it("cria uma proposta sem efeitos externos", () => {
    const proposal = createBindProposal({
      capability: "planejamento e orquestração",
      providerId: "ollama-local",
      requestedTokens: 4096,
      quotaState: "local",
    });

    expect(proposal.proposalOnly).toBe(true);
    expect(proposal.requiresHumanApproval).toBe(true);
    expect(isBindExecutionBlocked(proposal)).toBe(true);
    expect(proposal.mayCharge).toBe(false);
    expect(proposal.mayRotateCredentials).toBe(false);
    expect(proposal.mayExecuteProvider).toBe(false);
  });

  it("rejeita uma reserva inválida", () => {
    expect(() => createBindProposal({ capability: "x", providerId: "y", requestedTokens: 0, quotaState: "desconhecida" })).toThrow();
  });
});
