/**
 * Configuração de Ambiente — Sistema Autônomo myvideos
 * 
 * V2: Elimina dependências de APIs externas (Forge, MiniMax).
 * Adiciona configuração de modelos nativos e storage local.
 * Zero tokens, zero quotas, zero APIs externas.
 */

export const ENV = {
  // ── Identidade ──
  appId: process.env.VITE_APP_ID ?? "myvideos-autonomous",
  cookieSecret: process.env.JWT_SECRET ?? "autonomous-dev-secret-change-in-prod",
  isProduction: process.env.NODE_ENV === "production",

  // ── Banco de Dados (local/MySQL) ──
  databaseUrl: process.env.DATABASE_URL ?? "",

  // ── Auth Local (JWT, sem OAuth externo) ──
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "", // Opcional, para compat
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "autonomous-owner",

  // ── Motor Autônomo (novas configs) ──
  nativeModelsRoot: process.env.NATIVE_MODELS_ROOT ?? "./models",
  nativeStorageRoot: process.env.NATIVE_STORAGE_ROOT ?? "./.storage",
  autonomousMode: (process.env.AUTONOMOUS_MODE ?? "true") === "true",
  preferredLLMModel: process.env.PREFERRED_LLM_MODEL ?? "phi-3.5-mini-instruct",
  preferredImageModel: process.env.PREFERRED_IMAGE_MODEL ?? "sd-turbo",
  preferredVideoModel: process.env.PREFERRED_VIDEO_MODEL ?? "cogvideox-5b",
  preferredEmbeddingModel: process.env.PREFERRED_EMBEDDING_MODEL ?? "bge-m3",
  computeBackend: process.env.COMPUTE_BACKEND ?? "onnx-cpu", // onnx-cpu | onnx-gpu | wasm
  maxConcurrentInferences: parseInt(process.env.MAX_CONCURRENT_INFERENCES ?? "2", 10),

  // ── Legacy (deprecated, mantidos para compatibilidade transição) ──
  /** @deprecated Use motor LLM nativo */
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  /** @deprecated Use motor LLM nativo */
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** @deprecated Use motor de vídeo nativo */
  minimaxApiKey: process.env.MINIMAX_API_KEY ?? "",
  /** @deprecated Use motor de vídeo nativo */
  minimaxApiBaseUrl: process.env.MINIMAX_API_BASE_URL ?? "https://api.minimax.io",
};

/**
 * Verifica se o sistema está em modo autônomo (sem dependências externas).
 */
export function isAutonomousMode(): boolean {
  return ENV.autonomousMode && !ENV.forgeApiKey && !ENV.minimaxApiKey;
}

/**
 * Verifica qual motor usar: nativo ou legacy.
 */
export function shouldUseNativeLLM(): boolean {
  return ENV.autonomousMode || !ENV.forgeApiKey;
}

export function shouldUseNativeVideo(): boolean {
  return ENV.autonomousMode || !ENV.minimaxApiKey;
}

export function shouldUseNativeStorage(): boolean {
  return ENV.autonomousMode || !ENV.forgeApiKey;
}
