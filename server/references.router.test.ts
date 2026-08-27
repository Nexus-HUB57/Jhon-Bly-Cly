import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({ createReferenceAsset: vi.fn(), listReferenceAssets: vi.fn() }));
const storageMock = vi.hoisted(() => ({ storagePut: vi.fn() }));
const orchestrationDbMock = vi.hoisted(() => ({ upsertReferenceMemory: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./storage", () => storageMock);
vi.mock("./orchestrationDb", () => orchestrationDbMock);

import { referencesRouter } from "./routers/references";

function context(): TrpcContext {
  return {
    user: { id: 1, openId: "reference-owner", name: "Owner", email: "owner@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("references router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMock.storagePut.mockResolvedValue({ key: "references/1/track.mp3", url: "/manus-storage/references/1/track.mp3" });
    dbMocks.createReferenceAsset.mockResolvedValue(22);
    orchestrationDbMock.upsertReferenceMemory.mockResolvedValue(31);
    dbMocks.listReferenceAssets.mockResolvedValue([]);
  });

  it("armazena uma referência MP3 com metadados para os agentes", async () => {
    const caller = referencesRouter.createCaller(context());
    const result = await caller.upload({ name: "ritmo.mp3", mimeType: "audio/mpeg", base64: "data:audio/mpeg;base64,aGVsbG8=", agentUse: "ritmo e música", purpose: "Usar como guia de energia" });

    expect(result).toMatchObject({ assetId: 22, category: "áudio", byteSize: 5 });
    expect(storageMock.storagePut).toHaveBeenCalledWith(expect.stringContaining("references/1/"), expect.any(Buffer), "audio/mpeg");
    expect(dbMocks.createReferenceAsset).toHaveBeenCalledWith(expect.objectContaining({ userId: 1, category: "áudio", agentUse: "ritmo e música" }));
  });

  it("rejeita formatos não permitidos", async () => {
    const caller = referencesRouter.createCaller(context());
    await expect(caller.upload({ name: "arquivo.exe", mimeType: "application/octet-stream", base64: "data:application/octet-stream;base64,aGVsbG8=" })).rejects.toThrow("Formato não permitido");
    expect(storageMock.storagePut).not.toHaveBeenCalled();
  });

  it("indexa conteúdo TXT limitado como memória auditável", async () => {
    const caller = referencesRouter.createCaller(context());
    const content = Buffer.from("Direção de fotografia: luz lateral suave e movimento de câmera controlado.").toString("base64");
    const result = await caller.upload({ name: "direcao.txt", mimeType: "text/plain", base64: `data:text/plain;base64,${content}`, agentUse: "direção de fotografia", purpose: "Guia de identidade visual" });

    expect(result).toMatchObject({ assetId: 22, category: "texto", memoryId: 31 });
    expect(orchestrationDbMock.upsertReferenceMemory).toHaveBeenCalledWith(expect.objectContaining({
      userId: 1,
      sourceReference: "reference-asset:22",
      content: expect.stringContaining("luz lateral suave"),
    }));
  });

  it("aceita extrato curado para indexar documento binário sem executar seu conteúdo", async () => {
    const caller = referencesRouter.createCaller(context());
    const result = await caller.upload({ name: "briefing.pdf", mimeType: "application/pdf", base64: "data:application/pdf;base64,aGVsbG8=", agentUse: "roteiro e narrativa", indexText: "Resumo aprovado: narrativa intimista, ritmo gradual e luz natural." });

    expect(result).toMatchObject({ assetId: 22, category: "documento", memoryId: 31 });
    expect(orchestrationDbMock.upsertReferenceMemory).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining("narrativa intimista") }));
  });
});
