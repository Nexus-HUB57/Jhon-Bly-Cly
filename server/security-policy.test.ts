import { describe, expect, it } from "vitest";
import { FORBIDDEN_JBCX19_OPERATIONS, isJbcx19OperationAllowed } from "../shared/securityPolicy";
import { JBCX19_ADAPTERS } from "../shared/jbcx19Adapters";

describe("JBCx19 security policy", () => {
  it("declara como proibidas a coleta de segredos, execução dinâmica e instalação automática", () => {
    expect(FORBIDDEN_JBCX19_OPERATIONS).toHaveLength(3);
    expect(isJbcx19OperationAllowed("coleta ou reutilização de segredos descobertos em código-fonte")).toBe(false);
    expect(isJbcx19OperationAllowed("execução dinâmica de payload ou código externo não revisado")).toBe(false);
    expect(isJbcx19OperationAllowed("instalação automática de dependências ou runtimes de terceiros")).toBe(false);
  });

  it("mantém adaptadores bloqueados não executáveis", () => {
    expect(JBCX19_ADAPTERS.filter(adapter => adapter.status === "bloqueado").every(adapter => !adapter.executableInWebapp && adapter.activationMode === "bloqueado")).toBe(true);
  });
});
