import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { ORCHESTRATION_LIMITS, redactSensitiveKeys } from "../shared/orchestrationPolicy";
import { recordOrchestraInboxEvent } from "./orchestrationDb";

const eventSchema = z.object({
  id: z.union([z.string().min(1), z.number().int().nonnegative()]),
  eventName: z.string().min(1).max(160),
  occurredAt: z.string().datetime({ offset: true }),
  payload: z.unknown(),
});

const envelopeSchema = z.object({
  source: z.string().min(1).max(160),
  schemaVersion: z.string().min(1).max(32).optional(),
  event: eventSchema,
});

export function makeOrchestraSignature(rawBody: Buffer | string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

export function verifyOrchestraSignature(rawBody: Buffer | string, header: string | undefined, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(makeOrchestraSignature(rawBody, secret));
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function receiveOrchestraEvent(req: Request, res: Response) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  if (!rawBody.length || rawBody.length > ORCHESTRATION_LIMITS.maxInboundPayloadBytes) {
    return res.status(413).json({ accepted: false, reason: "payload inválido ou acima do limite" });
  }
  const secret = process.env.NEXUS_ORCHESTRA_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(503).json({ accepted: false, reason: "endpoint ainda não configurado" });
  }
  const signature = req.header("x-jhon-bly-cly-signature") ?? undefined;
  if (!verifyOrchestraSignature(rawBody, signature, secret)) {
    return res.status(401).json({ accepted: false, reason: "assinatura inválida" });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ accepted: false, reason: "JSON inválido" });
  }
  const validated = envelopeSchema.safeParse(parsedJson);
  if (!validated.success) {
    return res.status(400).json({ accepted: false, reason: "envelope inválido" });
  }
  const occurredAt = new Date(validated.data.event.occurredAt);
  if (Math.abs(Date.now() - occurredAt.getTime()) > ORCHESTRATION_LIMITS.maxEventAgeMs) {
    return res.status(400).json({ accepted: false, reason: "evento fora da janela temporal" });
  }

  const event = await recordOrchestraInboxEvent({
    eventId: `${validated.data.source}:${validated.data.event.id}`,
    eventName: validated.data.event.eventName,
    source: validated.data.source,
    occurredAt,
    payload: redactSensitiveKeys(validated.data.event.payload),
  });
  return res.status(event.duplicate ? 200 : 202).json({ accepted: true, duplicate: event.duplicate, eventId: event.id });
}
