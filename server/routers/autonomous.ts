/**
 * Router tRPC — Sistema Autônomo myvideos
 * 
 * Expõe todo o sistema autônomo via tRPC:
 * - Health check e manifest
 * - Registro de modelos nativos
 * - Execução de produção (vídeo/imagem) autônoma
 * - Sistema agentic (agentes, traces, tools)
 * - Memória semântica
 * - Estatísticas
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { shouldUseNativeLLM, shouldUseNativeVideo } from "../_core/env";
import { getAutonomousHealth, getAutonomousManifest } from "../autonomous";
import { summarizeRegistry, getModelById, getModelsByModality, selectBestModel, NATIVE_MODEL_REGISTRY } from "../autonomous/models/registry";
import { invokeNativeLLM, getLLMEngineStats } from "../autonomous/models/llmEngine";
import { generateNativeImage, getImageEngineStats, type NativeImageOptions } from "../autonomous/models/imageEngine";
import { generateNativeVideo, createNativeVideoTask, queryNativeVideoTask, getVideoEngineStats } from "../autonomous/models/videoEngine";
import { executeReAct, executeMultiAgentPlan, executeVideoProductionPipeline, getAgenticSystemStats, AGENT_ROLES } from "../autonomous/agents/agenticSystem";
import { semanticSearch, storeSemanticMemory, getMemoryStats } from "../autonomous/memory/memoryEngine";
import { nativeStorageStats } from "../autonomous/storage/nativeStorage";

export const autonomousRouter = router({
  // ── Health & Manifest ──
  health: protectedProcedure.query(() => getAutonomousHealth()),
  manifest: protectedProcedure.query(() => getAutonomousManifest()),

  // ── Modelo Registry ──
  models: protectedProcedure.query(() => ({
    registry: NATIVE_MODEL_REGISTRY.map(m => ({
      id: m.id,
      name: m.name,
      modality: m.modality,
      parameterLabel: m.parameterLabel,
      status: m.status,
      backend: m.backend,
      capabilities: m.capabilities,
    })),
    summary: summarizeRegistry(),
  })),

  modelById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getModelById(input.id)),

  modelsByModality: protectedProcedure
    .input(z.object({ modality: z.enum(["text", "image", "video", "audio", "multimodal"]) }))
    .query(({ input }) => getModelsByModality(input.modality)),

  selectModel: protectedProcedure
    .input(z.object({
      capability: z.string(),
      minParameters: z.number().optional(),
      maxParameters: z.number().optional(),
    }))
    .query(({ input }) => selectBestModel(input)),

  // ── LLM Nativo ──
  invokeLLM: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["system", "user", "assistant", "tool"]),
        content: z.string(),
      })),
      maxTokens: z.number().optional(),
      model: z.string().optional(),
      responseFormat: z.enum(["text", "json_object"]).optional(),
    }))
    .mutation(async ({ input }) => {
      return invokeNativeLLM({
        messages: input.messages,
        maxTokens: input.maxTokens,
        model: input.model,
        responseFormat: input.responseFormat ? { type: input.responseFormat } : undefined,
      });
    }),

  llmStats: protectedProcedure.query(() => getLLMEngineStats()),

  // ── Geração de Imagem Nativa ──
  generateImage: protectedProcedure
    .input(z.object({
      prompt: z.string(),
      negativePrompt: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      steps: z.number().optional(),
      model: z.enum(["sd-turbo", "sdxl-base-1.0", "flux-schnell", "auto"]).optional(),
      seed: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await generateNativeImage(input);
      // Salvar via storage nativo
      const { nativeStoragePut } = await import("../autonomous/storage/nativeStorage");
      const { url } = await nativeStoragePut(
        `generated/images/${Date.now()}.png`,
        result.buffer,
        result.mimeType,
      );
      return {
        url,
        width: result.width,
        height: result.height,
        model: result.model,
        seed: result.seed,
        metadata: result.metadata,
      };
    }),

  imageStats: protectedProcedure.query(() => getImageEngineStats()),

  // ── Geração de Vídeo Nativa ──
  generateVideo: protectedProcedure
    .input(z.object({
      prompt: z.string(),
      durationSeconds: z.number().min(4).max(60),
      ratio: z.enum(["16:9", "9:16", "1:1", "4:3", "adaptive"]).optional(),
      resolution: z.enum(["768P", "1080P", "2K"]).optional(),
      model: z.enum(["stable-video-diffusion", "cogvideox-5b", "auto"]).optional(),
      fps: z.number().optional(),
      seed: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // Criar task assíncrona (compatível com polling)
      const task = await createNativeVideoTask({
        prompt: input.prompt,
        duration: input.durationSeconds,
        ratio: input.ratio ?? "16:9",
        resolution: input.resolution,
      });
      return { taskId: task.task_id };
    }),

  queryVideoTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => queryNativeVideoTask(input.taskId)),

  videoStats: protectedProcedure.query(() => getVideoEngineStats()),

  // ── Pipeline de Produção Completo ──
  produceVideo: protectedProcedure
    .input(z.object({
      briefing: z.string().min(20),
      format: z.string().optional(),
      durationSeconds: z.number().optional(),
      objective: z.string().optional(),
      creativeDirection: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return executeVideoProductionPipeline(input);
    }),

  // ── Sistema Agentic ──
  agents: protectedProcedure.query(() => getAgenticSystemStats()),

  executeAgent: protectedProcedure
    .input(z.object({
      agentId: z.enum(["planner", "executor", "critic", "researcher", "creative", "optimizer", "monitor"]),
      goal: z.string(),
      context: z.string().optional(),
      maxIterations: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return executeReAct(input);
    }),

  executeMultiAgent: protectedProcedure
    .input(z.object({
      objective: z.string(),
      context: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return executeMultiAgentPlan(input);
    }),

  // ── Memória Semântica ──
  searchMemory: protectedProcedure
    .input(z.object({
      query: z.string(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => semanticSearch(input.query, input.limit ?? 5)),

  storeMemory: protectedProcedure
    .input(z.object({
      content: z.string(),
      summary: z.string().optional(),
      tags: z.array(z.string()).optional(),
      sourceType: z.string().optional(),
    }))
    .mutation(async ({ input }) => storeSemanticMemory(input)),

  memoryStats: protectedProcedure.query(() => getMemoryStats()),

  // ── Storage ──
  storageStats: protectedProcedure.query(async () => nativeStorageStats()),

  // ── Estatísticas Globais ──
  stats: protectedProcedure.query(async () => ({
    health: getAutonomousHealth(),
    llm: getLLMEngineStats(),
    image: getImageEngineStats(),
    video: getVideoEngineStats(),
    audio: (await import("../autonomous/models/audioEngine")).getAudioEngineStats(),
    agents: getAgenticSystemStats(),
    memory: getMemoryStats(),
    storage: await nativeStorageStats(),
  })),
});
