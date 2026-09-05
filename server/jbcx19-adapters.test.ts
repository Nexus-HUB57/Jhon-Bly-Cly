import { describe, expect, it } from "vitest";
import { JBCX19_ADAPTERS, summarizeJbcx19Adapters } from "../shared/jbcx19Adapters";

describe("JBCx19 native adapter registry", () => {
  it("mantém um contrato para cada repositório auditado", () => {
    expect(JBCX19_ADAPTERS).toHaveLength(19);
    expect(new Set(JBCX19_ADAPTERS.map(adapter => adapter.repository)).size).toBe(19);
  });

  it("mantém fontes sensíveis bloqueadas e requer ativação explícita para chamadas externas", () => {
    const summary = summarizeJbcx19Adapters();
    expect(summary.blocked).toBeGreaterThan(0);
    expect(JBCX19_ADAPTERS.filter(adapter => adapter.status === "bloqueado").every(adapter => adapter.activationMode === "bloqueado")).toBe(true);
    expect(JBCX19_ADAPTERS.find(adapter => adapter.id === "minimax-native-media")).toMatchObject({ activationMode: "credencial oficial", executableInWebapp: true });
    expect(JBCX19_ADAPTERS.find(adapter => adapter.id === "ollama-native-runtime")).toMatchObject({ activationMode: "host autorizado", executableInWebapp: false });
  });
});
