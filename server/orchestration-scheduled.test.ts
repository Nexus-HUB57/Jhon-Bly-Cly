import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn().mockRejectedValue(new Error("recusado")) } }));
vi.mock("./orchestrationDb", () => ({ getOrchestrationCycleByTaskUid: vi.fn() }));
vi.mock("./orchestration", () => ({ makeIdempotencyKey: vi.fn(), runGovernedCycle: vi.fn() }));

import { runScheduledMemoryCycle } from "./orchestrationHttp";

describe("callback periódico", () => {
  it("rejeita uma chamada sem identidade cron autenticada", async () => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await runScheduledMemoryCycle({ headers: {} } as any, response as any);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ accepted: false, reason: "autenticação do callback recusada" });
  });
});
