import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => {
  const values = vi.fn();
  const insert = vi.fn(() => ({ values }));
  const limit = vi.fn();
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const set = vi.fn(() => ({ where: vi.fn() }));
  const update = vi.fn(() => ({ set }));
  return { insert, values, select, from, where, limit, update, set };
});

vi.mock("drizzle-orm/mysql2", () => ({ drizzle: vi.fn(() => dbMock) }));

const originalDatabaseUrl = process.env.DATABASE_URL;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.DATABASE_URL = "mysql://unit-test";
  dbMock.values.mockResolvedValue([{ insertId: 42 }]);
  dbMock.limit.mockResolvedValue([{
    id: 42,
    projectId: 9,
    sceneId: null,
    eventName: "video.project.created",
    entityType: "project",
    entityId: 9,
    payload: { status: "rascunho" },
    deliveryStatus: "pendente",
    deliveryAttempts: 0,
    deliveryError: null,
    deliveredAt: null,
    occurredAt: new Date("2026-08-26T20:00:00.000Z"),
  }]);
});

afterEach(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});

describe("persistência do outbox", () => {
  it("grava um evento e recupera o registro persistido para entrega", async () => {
    const { createOrchestraEvent } = await import("./db");

    const event = await createOrchestraEvent({
      projectId: 9,
      eventName: "video.project.created",
      entityType: "project",
      entityId: 9,
      payload: { status: "rascunho" },
    });

    expect(dbMock.insert).toHaveBeenCalledTimes(1);
    expect(dbMock.values).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 9,
      eventName: "video.project.created",
      payload: { status: "rascunho" },
    }));
    expect(event).toEqual(expect.objectContaining({ id: 42, deliveryStatus: "pendente" }));
  });

  it("atualiza o estado de entrega e registra erro quando o destino falha", async () => {
    const { recordOrchestraDelivery } = await import("./db");

    await recordOrchestraDelivery(42, false, "HTTP 502");

    expect(dbMock.update).toHaveBeenCalledTimes(1);
    expect(dbMock.set).toHaveBeenCalledWith(expect.objectContaining({
      deliveryStatus: "falha",
      deliveryAttempts: 1,
      deliveryError: "HTTP 502",
      deliveredAt: null,
    }));
  });
});
