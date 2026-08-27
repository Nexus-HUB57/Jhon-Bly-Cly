import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { getOrchestrationCycleByTaskUid } from "./orchestrationDb";
import { makeIdempotencyKey, runGovernedCycle } from "./orchestration";

export async function runScheduledMemoryCycle(req: Request, res: Response) {
  try {
    const actor = await sdk.authenticateRequest(req as unknown as Request);
    if (!actor.isCron || !actor.taskUid) {
      return res.status(403).json({ accepted: false, reason: "callback agendado não autenticado" });
    }
    const cycle = await getOrchestrationCycleByTaskUid(actor.taskUid);
    if (!cycle) return res.status(404).json({ accepted: false, reason: "tarefa não registrada" });
    const result = await runGovernedCycle({
      userId: cycle.userId,
      trigger: "agendado",
      idempotencyKey: makeIdempotencyKey(`${actor.taskUid}:${Math.floor(Date.now() / 900_000)}`),
    });
    return res.status(200).json({ accepted: true, result });
  } catch {
    return res.status(403).json({ accepted: false, reason: "autenticação do callback recusada" });
  }
}
