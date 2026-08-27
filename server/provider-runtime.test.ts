import { describe, expect, it } from "vitest";
import { getConditionalFreeFallbackProviders, getSynchronizedTokenProviders, isRuntimeProviderEnabled, PROVIDER_RUNTIME_REGISTRY, summarizeProviderRuntime } from "../shared/providerRuntime";

describe("JBCx19 provider runtime registry", () => {
  it("mantém exatamente os seis provedores autorizados ativos", () => {
    expect(PROVIDER_RUNTIME_REGISTRY.filter(provider => provider.status === "ativo").map(provider => provider.id)).toEqual(["minimax", "openai", "llama", "zai", "gemini", "evomap"]);
    expect(summarizeProviderRuntime()).toEqual({ total: 8, active: 6, inactive: 2, synchronizedTokenApis: 7 });
  });

  it("mantém provedores não aprovados fora do runtime", () => {
    expect(isRuntimeProviderEnabled("alibaba-model-studio")).toBe(false);
    expect(isRuntimeProviderEnabled("digitalocean")).toBe(false);
    expect(isRuntimeProviderEnabled("evomap")).toBe(true);
    expect(PROVIDER_RUNTIME_REGISTRY.find(provider => provider.id === "evomap")).toEqual(expect.objectContaining({
      activation: expect.stringContaining("cofre"),
      rationale: expect.stringContaining("server-side"),
    }));
  });

  it("restringe a elegibilidade gratuita a propostas condicionais de texto e referência", () => {
    expect(PROVIDER_RUNTIME_REGISTRY.find(provider => provider.id === "minimax")).toEqual(expect.objectContaining({
      freeFallbackStatus: "não elegível",
      freeFallbackScopes: [],
    }));
    expect(getConditionalFreeFallbackProviders("planejamento e texto").map(provider => provider.id)).toEqual(["zai", "gemini"]);
    expect(getConditionalFreeFallbackProviders("análise de referências").map(provider => provider.id)).toEqual(["zai", "gemini"]);
    expect(getConditionalFreeFallbackProviders("planejamento e texto")).not.toContainEqual(expect.objectContaining({ id: "minimax" }));
  });

  it("separa as sete APIs sincronizadas do conector audiovisual e de contratos ainda pendentes", () => {
    expect(getSynchronizedTokenProviders().map(provider => provider.id)).toEqual(["openai", "llama", "zai", "gemini", "alibaba-model-studio", "digitalocean", "evomap"]);
    expect(PROVIDER_RUNTIME_REGISTRY.find(provider => provider.id === "minimax")).toEqual(expect.objectContaining({
      tokenSynchronization: "conector audiovisual separado",
      contractStatus: "funcional",
    }));
    expect(PROVIDER_RUNTIME_REGISTRY.find(provider => provider.id === "evomap")).toEqual(expect.objectContaining({ contractStatus: "requer contrato" }));
  });
});
