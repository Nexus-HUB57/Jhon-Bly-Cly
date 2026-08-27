import { z } from "zod";
import { createReferenceAsset, listReferenceAssets } from "../db";
import { upsertReferenceMemory } from "../orchestrationDb";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const MAX_REFERENCE_BYTES = 50 * 1024 * 1024;
const allowedExtensions = new Set(["mp3", "wav", "mp4", "mov", "webm", "jpg", "jpeg", "png", "webp", "gif", "txt", "pdf", "doc", "docx"]);
const categories = ["imagem", "áudio", "vídeo", "documento", "texto"] as const;

function categoryFor(name: string, mimeType: string): (typeof categories)[number] {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) return "imagem";
  if (mimeType.startsWith("audio/") || ["mp3", "wav"].includes(extension)) return "áudio";
  if (mimeType.startsWith("video/") || ["mp4", "mov", "webm"].includes(extension)) return "vídeo";
  if (mimeType.startsWith("text/") || extension === "txt") return "texto";
  return "documento";
}

function parseBase64(value: string) {
  const raw = value.includes(",") ? value.split(",", 2)[1] : value;
  return Buffer.from(raw, "base64");
}

function extractIndexableText(input: { category: (typeof categories)[number]; mimeType: string; data: Buffer }) {
  if (input.category !== "texto" || !input.mimeType.startsWith("text/")) return undefined;
  const content = input.data.toString("utf8").replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  if (!content) return undefined;
  return content.slice(0, 12_000);
}

function referenceMemoryContent(input: { name: string; category: (typeof categories)[number]; mimeType: string; agentUse: string; purpose?: string; text?: string }) {
  if (input.text) return input.text;
  return `Referência: ${input.name}. Categoria: ${input.category}. Tipo MIME: ${input.mimeType}. Uso declarado: ${input.agentUse}.${input.purpose ? ` Finalidade: ${input.purpose}.` : ""}`;
}

export const referencesRouter = router({
  list: protectedProcedure.query(({ ctx }) => listReferenceAssets(ctx.user.id)),
  agentContext: protectedProcedure.query(async ({ ctx }) => {
    const assets = await listReferenceAssets(ctx.user.id);
    return assets.map(asset => ({ id: asset.id, name: asset.name, category: asset.category, agentUse: asset.agentUse, purpose: asset.purpose, url: asset.url }));
  }),
  upload: protectedProcedure.input(z.object({
    name: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(3).max(160),
    base64: z.string().min(1).max(70_000_000),
    agentUse: z.string().trim().min(2).max(120).default("referência criativa"),
    purpose: z.string().trim().max(2_000).optional(),
    indexText: z.string().trim().max(12_000).optional(),
  })).mutation(async ({ ctx, input }) => {
    const extension = input.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.has(extension)) {
      throw new Error("Formato não permitido. Use áudio, vídeo, imagem, texto ou documento compatível.");
    }
    const data = parseBase64(input.base64);
    if (!data.length || data.length > MAX_REFERENCE_BYTES) {
      throw new Error("A referência deve ter no máximo 50 MB.");
    }
    const safeName = input.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stored = await storagePut(`references/${ctx.user.id}/${Date.now()}_${safeName}`, data, input.mimeType);
    const category = categoryFor(input.name, input.mimeType);
    const assetId = await createReferenceAsset({
      userId: ctx.user.id,
      name: input.name,
      storageKey: stored.key,
      url: stored.url,
      mimeType: input.mimeType,
      byteSize: data.length,
      category,
      agentUse: input.agentUse,
      purpose: input.purpose,
    });
    const indexableText = input.indexText?.replace(/\s+/g, " ").trim().slice(0, 12_000) || extractIndexableText({ category, mimeType: input.mimeType, data });
    const memoryId = await upsertReferenceMemory({
      userId: ctx.user.id,
      title: `Referência: ${input.name}`,
      content: referenceMemoryContent({ ...input, category, text: indexableText }),
      summary: input.purpose ?? input.agentUse,
      tags: ["referência", category, extension],
      sourceReference: `reference-asset:${assetId}`,
    });
    return { assetId, url: stored.url, category, byteSize: data.length, memoryId };
  }),
});
