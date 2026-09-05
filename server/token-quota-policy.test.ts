import { describe, expect, it } from "vitest";
import {
  TOKEN_QUOTA_PROFILES,
  canReserveTokenBudget,
  createTokenRouteProposal,
  utcQuotaDate,
} from "../shared/tokenQuotaPolicy";

describe("política de quotas de tokens", () => {
  it("mantém o reset em data UTC e rejeita requisição acima do limite", () => {
    const profile = TOKEN_QUOTA_PROFILES.find(item => item.providerId === "gemini");
    expect(profile).toBeDefined();
    expect(utcQuotaDate(new Date("2026-08-27T23:30:00-03:00"))).toBe("2026-08-28");
    expect(canReserveTokenBudget(profile!, { providerId: "gemini", dateUtc: "2026-08-28", consumedTokens: 0, reservedTokens: 0 }, profile!.perRequestTokenLimit + 1, new Date("2026-08-28T02:30:00Z"))).toBe(false);
  });

  it("não presume limite diário quando a quota real é desconhecida", () => {
    const profile = TOKEN_QUOTA_PROFILES.find(item => item.providerId === "ollama-local");
    expect(profile?.mode).toBe("local-sem-cota-de-provedor");
    expect(canReserveTokenBudget(profile!, { providerId: "ollama-local", dateUtc: "2026-08-28", consumedTokens: 0, reservedTokens: 0 }, 100, new Date("2026-08-28T02:30:00Z"))).toBe(false);
  });

  it("faz rotação determinística somente na proposta", () => {
    const first = createTokenRouteProposal("planejamento", 100, 0);
    const second = createTokenRouteProposal("planejamento", 100, 1);
    expect(first.proposalOnly).toBe(true);
    expect(first.requiresHumanApproval).toBe(true);
    expect(first.candidates.length).toBeGreaterThan(0);
    expect(first.candidates[0].providerId).not.toBe(second.candidates[0].providerId);
    expect(first.guardrail).toContain("Nenhum candidato é chamado");
  });
});
