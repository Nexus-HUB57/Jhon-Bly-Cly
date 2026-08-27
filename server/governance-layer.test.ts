import { describe, expect, it } from "vitest";
import { deriveOperationalMaturity, GOVERNED_CORE_ROLES } from "../shared/orchestrationPolicy";

describe("maturidade operacional governada", () => {
  it("cresce gradualmente por evidência revisável sem liberar execução autônoma", () => {
    expect(deriveOperationalMaturity({ evidenceCount: 0, approvedProposalCount: 0, reviewedMemoryCount: 0 })).toMatchObject({ score: 0, level: "observação", autonomyCeiling: "observação", requiresHumanApproval: true });
    expect(deriveOperationalMaturity({ evidenceCount: 12, approvedProposalCount: 4, reviewedMemoryCount: 8 })).toMatchObject({ level: "revisão", autonomyCeiling: "proposta", requiresHumanApproval: true });
  });

  it("mantém o teto de autonomia no modo de proposta mesmo com pontuação máxima", () => {
    const maturity = deriveOperationalMaturity({ evidenceCount: 200, approvedProposalCount: 200, reviewedMemoryCount: 200 });
    expect(maturity.score).toBe(100);
    expect(maturity.level).toBe("revisão");
    expect(maturity.autonomyCeiling).toBe("proposta");
  });

  it("declara os quatro papéis do core sem conceder execução irrestrita", () => {
    expect(GOVERNED_CORE_ROLES.map(role => role.id)).toEqual(["planner", "executor", "monitor", "optimizer"]);
    expect(GOVERNED_CORE_ROLES.every(role => /não|nunca|permanece/i.test(role.boundary))).toBe(true);
  });
});
