import { describe, expect, it } from "vitest";
import { isRuntimeProviderEnabled, PROVIDER_RUNTIME_REGISTRY, summarizeProviderRuntime } from "../shared/providerRuntime";

describe("JBCx19 provider runtime registry", () => {
  it("mantém exatamente os cinco provedores aprovados ativos", () => {
    expect(PROVIDER_RUNTIME_REGISTRY.filter(provider => provider.status === "ativo").map(provider => provider.id)).toEqual(["minimax", "openai", "llama", "zai", "gemini"]);
    expect(summarizeProviderRuntime()).toEqual({ total: 8, active: 5, inactive: 3 });
  });

  it("mantém provedores não aprovados fora do runtime", () => {
    expect(isRuntimeProviderEnabled("alibaba-model-studio")).toBe(false);
    expect(isRuntimeProviderEnabled("digitalocean")).toBe(false);
    expect(isRuntimeProviderEnabled("evomap")).toBe(false);
  });
});
