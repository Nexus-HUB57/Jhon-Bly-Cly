import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createFusionSyncEvent: vi.fn(),
  listFusionConnectorProfiles: vi.fn(),
  recordFusionSyncDelivery: vi.fn(),
  stageFusionConnector: vi.fn(),
}));
const orchestraMock = vi.hoisted(() => ({ deliverFusionSyncToNexusOrchestra: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./orchestra", () => orchestraMock);

import { fusionRouter } from "./routers/fusion";

function context(): TrpcContext {
  return {
    user: { id: 4, openId: "fusion-owner", name: "Owner", email: "owner@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("router de fusão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.listFusionConnectorProfiles.mockResolvedValue([]);
    dbMocks.createFusionSyncEvent.mockResolvedValue({ id: 77 });
    orchestraMock.deliverFusionSyncToNexusOrchestra.mockResolvedValue({ delivered: false, error: "Endpoint do Nexus_Orchestra ainda não configurado." });
  });

  it("prepara um conector elegível sem receber credencial no navegador", async () => {
    const caller = fusionRouter.createCaller(context());
    const result = await caller.stageConnector({ connectorId: "minimax-media" });

    expect(result).toMatchObject({ connectorId: "minimax-media", status: "aguardando credencial" });
    expect(dbMocks.stageFusionConnector).toHaveBeenCalledWith(4, "minimax-media");
  });

  it("recusa fontes bloqueadas pela política de segurança", async () => {
    const caller = fusionRouter.createCaller(context());
    await expect(caller.stageConnector({ connectorId: "prompt-leaks-blocklist" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.stageFusionConnector).not.toHaveBeenCalled();
  });

  it("persiste e registra a falha de entrega do envelope de sincronização", async () => {
    const caller = fusionRouter.createCaller(context());
    const result = await caller.sync();

    expect(result).toMatchObject({ eventId: 77, deliveryStatus: "falha" });
    expect(dbMocks.createFusionSyncEvent).toHaveBeenCalledWith(4, "ecosystem.fusion.catalog.synchronized", expect.any(Object));
    expect(dbMocks.recordFusionSyncDelivery).toHaveBeenCalledWith(77, false, "Endpoint do Nexus_Orchestra ainda não configurado.");
  });
});
