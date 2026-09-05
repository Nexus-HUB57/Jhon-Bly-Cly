import { afterEach, describe, expect, it, vi } from "vitest";
import { makeOrchestraSignature, receiveOrchestraEvent, verifyOrchestraSignature } from "./orchestraWebhook";

describe("assinatura do endpoint Nexus", () => {
  const body = Buffer.from('{"source":"nexus-orchestra","event":{"id":"evt-1"}}');
  const secret = "segredo-de-teste";

  it("aceita somente a assinatura HMAC correspondente ao corpo bruto", () => {
    const signature = makeOrchestraSignature(body, secret);
    expect(verifyOrchestraSignature(body, signature, secret)).toBe(true);
    expect(verifyOrchestraSignature(Buffer.from("{}"), signature, secret)).toBe(false);
    expect(verifyOrchestraSignature(body, signature, undefined)).toBe(false);
  });

  it("rejeita o request antes de persistir quando a assinatura não corresponde", async () => {
    const prior = process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET;
    process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET = secret;
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await receiveOrchestraEvent({ body, header: vi.fn(() => "sha256=incorreta") } as any, response as any);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ accepted: false, reason: "assinatura inválida" });
    if (prior === undefined) delete process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET;
    else process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET = prior;
  });
});
