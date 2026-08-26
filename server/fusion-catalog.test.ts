import { describe, expect, it } from "vitest";
import { createFusionSyncEnvelope, FUSION_CONNECTORS, FUSION_REPOSITORIES, getFusionConnector, isFusionConnectorEligible, summarizeFusionCatalog } from "../shared/fusionCatalog";

describe("catálogo de fusão", () => {
  it("mantém fontes de prompts internos fora de qualquer rota de integração", () => {
    const sensitiveSources = FUSION_REPOSITORIES.filter(item => item.route === "bloqueado");
    expect(sensitiveSources.map(item => item.repository)).toContain("asgeirtj/system_prompts_leaks");
    expect(sensitiveSources.map(item => item.repository)).toContain("x1xhlol/system-prompts-and-models-of-ai-tools");
    expect(sensitiveSources.every(item => item.risk === "bloqueado")).toBe(true);
  });

  it("permite somente conectores elegíveis e conserva o MiniMax em modo BYOK", () => {
    expect(isFusionConnectorEligible("minimax-media")).toBe(true);
    expect(getFusionConnector("minimax-media")).toMatchObject({ credentialMode: "BYOK", configurationStatus: "elegível" });
    expect(isFusionConnectorEligible("prompt-leaks-blocklist")).toBe(false);
    expect(getFusionConnector("prompt-leaks-blocklist")?.configurationStatus).toBe("bloqueado");
  });

  it("produz envelope sem credenciais e com resumo consistente", () => {
    const summary = summarizeFusionCatalog();
    const envelope = createFusionSyncEnvelope();
    expect(summary.total).toBe(FUSION_REPOSITORIES.length);
    expect(envelope.repositories).toHaveLength(FUSION_REPOSITORIES.length);
    expect(JSON.stringify(envelope)).not.toMatch(/api[_-]?key|secret|token/i);
    expect(FUSION_CONNECTORS).toHaveLength(4);
  });
});
