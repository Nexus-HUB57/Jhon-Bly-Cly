import { describe, expect, it } from "vitest";
import { isMiniMaxInsufficientBalanceFailure } from "./fallbackEscalation";

describe("classificação de saldo insuficiente", () => {
  it("reconhece somente a condição explícita de saldo do MiniMax", () => {
    expect(isMiniMaxInsufficientBalanceFailure(new Error("insufficient balance (1008)"))).toBe(true);
    expect(isMiniMaxInsufficientBalanceFailure("Saldo insuficiente para iniciar a tarefa.")).toBe(true);
    expect(isMiniMaxInsufficientBalanceFailure(new Error("timeout de rede"))).toBe(false);
    expect(isMiniMaxInsufficientBalanceFailure(new Error("credencial inválida"))).toBe(false);
  });
});
