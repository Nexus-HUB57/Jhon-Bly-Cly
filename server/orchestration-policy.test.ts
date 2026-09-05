import { describe, expect, it } from "vitest";
import {
  ORCHESTRATION_LIMITS,
  canStartCycle,
  redactSensitiveKeys,
} from "../shared/orchestrationPolicy";

describe("política de orquestração governada", () => {
  it("bloqueia ciclos pausados, em execução e aguardando revisão", () => {
    for (const status of ["pausado", "em execução", "aguardando revisão"] as const) {
      expect(canStartCycle({ status })).toBe(false);
    }
  });

  it("respeita o intervalo mínimo entre ciclos", () => {
    const now = new Date("2026-08-26T12:15:00.000Z");
    expect(canStartCycle({ status: "pronto", lastStartedAt: new Date("2026-08-26T12:01:00.000Z"), now })).toBe(false);
    expect(canStartCycle({ status: "pronto", lastStartedAt: new Date("2026-08-26T12:00:00.000Z"), now })).toBe(true);
  });

  it("redige chaves sensíveis antes da persistência de evidências", () => {
    expect(redactSensitiveKeys({ token: "nunca registrar", safe: { direction: "luz lateral" } })).toEqual({
      token: "[redigido]",
      safe: { direction: "luz lateral" },
    });
    expect(ORCHESTRATION_LIMITS.maxInboundPayloadBytes).toBeLessThanOrEqual(256 * 1024);
  });
});
