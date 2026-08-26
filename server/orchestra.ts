import { createHmac } from "node:crypto";

export type OrchestraEventEnvelope = {
  id: number;
  eventName: string;
  projectId: number;
  sceneId?: number | null;
  entityType: string;
  entityId: number;
  payload: unknown;
  occurredAt: Date;
};

export type OrchestraDeliveryResult = {
  delivered: boolean;
  error?: string;
};

/**
 * Delivers a persisted domain event only when a receiving endpoint is configured.
 * The application never exposes the shared secret to the browser.
 */
export async function deliverToNexusOrchestra(
  event: OrchestraEventEnvelope
): Promise<OrchestraDeliveryResult> {
  const endpoint = process.env.NEXUS_ORCHESTRA_WEBHOOK_URL;
  const secret = process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET;

  if (!endpoint) {
    return { delivered: false, error: "Endpoint do Nexus_Orchestra ainda não configurado." };
  }

  const body = JSON.stringify({
    source: "jhon-bly-cly-video",
    schemaVersion: "1.0",
    event: {
      ...event,
      occurredAt: event.occurredAt.toISOString(),
    },
  });
  const signature = secret ? createHmac("sha256", secret).update(body).digest("hex") : undefined;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-jhon-bly-cly-event": event.eventName,
        ...(signature ? { "x-jhon-bly-cly-signature": `sha256=${signature}` } : {}),
      },
      body,
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return { delivered: false, error: `Nexus_Orchestra respondeu com HTTP ${response.status}.` };
    }

    return { delivered: true };
  } catch (error) {
    return {
      delivered: false,
      error: error instanceof Error ? error.message : "Falha desconhecida na sincronização.",
    };
  }
}
