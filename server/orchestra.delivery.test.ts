import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverToNexusOrchestra } from "./orchestra";

const previousEndpoint = process.env.NEXUS_ORCHESTRA_WEBHOOK_URL;
const previousSecret = process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET;

afterEach(() => {
  vi.unstubAllGlobals();
  if (previousEndpoint === undefined) delete process.env.NEXUS_ORCHESTRA_WEBHOOK_URL;
  else process.env.NEXUS_ORCHESTRA_WEBHOOK_URL = previousEndpoint;
  if (previousSecret === undefined) delete process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET;
  else process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET = previousSecret;
});

describe("entrega ao Nexus_Orchestra", () => {
  it("envia um envelope assinado e reconhece uma resposta de sucesso", async () => {
    process.env.NEXUS_ORCHESTRA_WEBHOOK_URL = "https://orchestra.example/events";
    process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET = "shared-test-secret";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    vi.stubGlobal("fetch", fetchMock);

    const event = {
      id: 5,
      projectId: 3,
      sceneId: null,
      eventName: "video.generation.requested",
      entityType: "generation_run",
      entityId: 18,
      payload: { status: "gerando" },
      occurredAt: new Date("2026-08-26T20:00:00.000Z"),
    };
    const result = await deliverToNexusOrchestra(event);

    expect(result).toEqual({ delivered: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, { body: string; headers: Record<string, string> }];
    expect(url).toBe("https://orchestra.example/events");
    expect(options.headers["x-jhon-bly-cly-event"]).toBe("video.generation.requested");
    expect(JSON.parse(options.body)).toEqual(expect.objectContaining({ source: "jhon-bly-cly-video", schemaVersion: "1.0" }));
    const expectedSignature = createHmac("sha256", "shared-test-secret").update(options.body).digest("hex");
    expect(options.headers["x-jhon-bly-cly-signature"]).toBe(`sha256=${expectedSignature}`);
  });
});
