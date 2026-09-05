/**
 * Registro de Runtime de Provedores — V2 Autônomo
 * 
 * V1: 8 provedores externos (MiniMax, OpenAI, Llama, Z.AI, etc.)
 * V2: Modelos nativos rodando via ONNX Runtime — zero APIs externas.
 * 
 * Todos os "provedores" são agora modelos locais com milhões/bilhões
 * de parâmetros executados nativamente na máquina.
 */

export type NativeProviderStatus = "ativo" | "inativo" | "carregando";
export type ComputeBackend = "onnx-cpu" | "onnx-gpu" | "wasm" | "native";

export type NativeProviderRuntime = {
  id: string;
  name: string;
  status: NativeProviderStatus;
  modality: string[];
  parameterCount: string;
  backend: ComputeBackend;
  capabilities: string[];
  /** Substitui freeFallbackStatus — tudo é nativo e gratuito */
  isFree: true;
  /** Substitui contractStatus — sem contrato, é nativo */
  contractStatus: "nativo";
};

/**
 * Registro de provedores nativos — V2 Autônomo.
 * Cada entrada é um modelo nativo rodando via ONNX Runtime.
 * Zero tokens, zero quotas, zero contrato.
 */
export const NATIVE_PROVIDER_RUNTIME: readonly NativeProviderRuntime[] = [
  // ── LLMs ──
  {
    id: "phi-3.5-mini",
    name: "Phi-3.5 Mini Instruct (3.8B)",
    status: "ativo",
    modality: ["texto", "multimodal"],
    parameterCount: "3.8B",
    backend: "onnx-cpu",
    capabilities: ["raciocínio", "planejamento", "script", "análise", "síntese", "json-estruturado", "multi-idioma"],
    isFree: true,
    contractStatus: "nativo",
  },
  {
    id: "llama-3.2-3b",
    name: "Llama 3.2 3B Instruct (3B)",
    status: "ativo",
    modality: ["texto"],
    parameterCount: "3B",
    backend: "onnx-cpu",
    capabilities: ["raciocínio", "planejamento", "script", "análise", "síntese", "json-estruturado"],
    isFree: true,
    contractStatus: "nativo",
  },
  {
    id: "qwen2.5-7b",
    name: "Qwen2.5 7B Instruct (7B)",
    status: "ativo",
    modality: ["texto", "multimodal"],
    parameterCount: "7B",
    backend: "onnx-cpu",
    capabilities: ["raciocínio", "planejamento", "script", "análise", "síntese", "json-estruturado", "multi-idioma", "código"],
    isFree: true,
    contractStatus: "nativo",
  },
  {
    id: "gemma-2-9b",
    name: "Gemma 2 9B IT (9B)",
    status: "ativo",
    modality: ["texto"],
    parameterCount: "9B",
    backend: "onnx-cpu",
    capabilities: ["raciocínio", "planejamento", "script", "análise", "síntese", "json-estruturado"],
    isFree: true,
    contractStatus: "nativo",
  },

  // ── VLMs ──
  {
    id: "phi-3.5-vision",
    name: "Phi-3.5 Vision Instruct (4.2B)",
    status: "ativo",
    modality: ["texto", "imagem", "multimodal"],
    parameterCount: "4.2B",
    backend: "onnx-cpu",
    capabilities: ["análise-visual", "descrição-imagem", "ocr", "storyboard", "referência-visual", "raciocínio-visual"],
    isFree: true,
    contractStatus: "nativo",
  },
  {
    id: "qwen2-vl-7b",
    name: "Qwen2-VL 7B Instruct (7B)",
    status: "ativo",
    modality: ["texto", "imagem", "vídeo", "multimodal"],
    parameterCount: "7B",
    backend: "onnx-cpu",
    capabilities: ["análise-visual", "compreensão-vídeo", "descrição-imagem", "ocr", "storyboard", "referência-visual"],
    isFree: true,
    contractStatus: "nativo",
  },

  // ── Diffusion (Imagem) ──
  {
    id: "sd-turbo",
    name: "Stable Diffusion Turbo (815M)",
    status: "ativo",
    modality: ["imagem"],
    parameterCount: "815M",
    backend: "onnx-gpu",
    capabilities: ["geração-imagem", "imagem-rápida", "text2img"],
    isFree: true,
    contractStatus: "nativo",
  },
  {
    id: "sdxl-base",
    name: "Stable Diffusion XL (3.5B)",
    status: "ativo",
    modality: ["imagem"],
    parameterCount: "3.5B",
    backend: "onnx-gpu",
    capabilities: ["geração-imagem", "alta-resolução", "text2img", "img2img", "inpainting"],
    isFree: true,
    contractStatus: "nativo",
  },
  {
    id: "flux-schnell",
    name: "FLUX.1 Schnell (12B)",
    status: "ativo",
    modality: ["imagem"],
    parameterCount: "12B",
    backend: "onnx-gpu",
    capabilities: ["geração-imagem", "alta-resolução", "text2img", "qualidade-extrema"],
    isFree: true,
    contractStatus: "nativo",
  },

  // ── Vídeo ──
  {
    id: "svd",
    name: "Stable Video Diffusion (1.5B)",
    status: "ativo",
    modality: ["vídeo", "imagem"],
    parameterCount: "1.5B",
    backend: "onnx-gpu",
    capabilities: ["geração-vídeo", "img2vid", "frame-interpolação"],
    isFree: true,
    contractStatus: "nativo",
  },
  {
    id: "cogvideox",
    name: "CogVideoX-5B (5B)",
    status: "ativo",
    modality: ["vídeo", "texto"],
    parameterCount: "5B",
    backend: "onnx-gpu",
    capabilities: ["geração-vídeo", "text2vid", "alta-coerência", "vídeo-longo"],
    isFree: true,
    contractStatus: "nativo",
  },

  // ── Embedding ──
  {
    id: "bge-m3",
    name: "BGE-M3 (568M)",
    status: "ativo",
    modality: ["texto"],
    parameterCount: "568M",
    backend: "onnx-cpu",
    capabilities: ["embedding", "busca-semântica", "multilingual"],
    isFree: true,
    contractStatus: "nativo",
  },

  // ── Áudio ──
  {
    id: "whisper-small",
    name: "Whisper Small (244M)",
    status: "ativo",
    modality: ["áudio", "texto"],
    parameterCount: "244M",
    backend: "onnx-cpu",
    capabilities: ["speech-to-text", "transcrição", "multi-idioma"],
    isFree: true,
    contractStatus: "nativo",
  },
  {
    id: "bark-small",
    name: "Bark Small (400M)",
    status: "ativo",
    modality: ["texto", "áudio"],
    parameterCount: "400M",
    backend: "onnx-cpu",
    capabilities: ["text-to-speech", "narração", "múltiplas-vozes"],
    isFree: true,
    contractStatus: "nativo",
  },
] as const;

// ─── API Compatível ──────────────────────────────────────────────

/**
 * isRuntimeProviderEnabled — Compatível com V1.
 * No V2, todos os provedores nativos estão sempre ativos.
 */
export function isRuntimeProviderEnabled(id: string): boolean {
  return NATIVE_PROVIDER_RUNTIME.find(p => p.id === id)?.status === "ativo";
}

/**
 * getTotalNativeParameters — Soma total de parâmetros nativos.
 */
export function getTotalNativeParameters(): string {
  const total = NATIVE_PROVIDER_RUNTIME.reduce((sum, p) => {
    const num = parseFloat(p.parameterCount);
    const unit = p.parameterCount.slice(-1);
    const multiplier = unit === "B" ? 1_000_000_000 : unit === "M" ? 1_000_000 : 1;
    return sum + num * multiplier;
  }, 0);

  if (total >= 1_000_000_000_000) return `${(total / 1_000_000_000_000).toFixed(1)}T`;
  if (total >= 1_000_000_000) return `${(total / 1_000_000_000).toFixed(1)}B`;
  return `${(total / 1_000_000).toFixed(0)}M`;
}

export function summarizeProviderRuntime() {
  return {
    total: NATIVE_PROVIDER_RUNTIME.length,
    active: NATIVE_PROVIDER_RUNTIME.filter(p => p.status === "ativo").length,
    inactive: NATIVE_PROVIDER_RUNTIME.filter(p => p.status === "inativo").length,
    totalParameters: getTotalNativeParameters(),
    allNative: true,
    externalDependencies: 0,
    modalities: [...new Set(NATIVE_PROVIDER_RUNTIME.flatMap(p => p.modality))],
  };
}

export function getConditionalFreeFallbackProviders() {
  // V2: todos são nativos e gratuitos
  return NATIVE_PROVIDER_RUNTIME.filter(p => p.status === "ativo");
}

export function getSynchronizedTokenProviders() {
  // V2: sem tokens — todos são nativos
  return [...NATIVE_PROVIDER_RUNTIME];
}

// ─── V1 Compat (deprecated) ──────────────────────────────────────

/** @deprecated Use NATIVE_PROVIDER_RUNTIME */
export type ProviderRuntimeStatus = "ativo" | "inativo";
/** @deprecated Use NATIVE_PROVIDER_RUNTIME */
export type FreeFallbackStatus = "não elegível" | "condicional" | "não confirmado";
/** @deprecated Use NATIVE_PROVIDER_RUNTIME */
export type FreeFallbackScope = "planejamento e texto" | "análise de referências";
/** @deprecated Use NATIVE_PROVIDER_RUNTIME */
export type ProviderTokenSynchronization = "sincronizada" | "conector audiovisual separado";
/** @deprecated Use NATIVE_PROVIDER_RUNTIME */
export type ProviderContractStatus = "funcional" | "requer contrato" | "requer host" | "nativo";

/** @deprecated Use NATIVE_PROVIDER_RUNTIME */
export const PROVIDER_RUNTIME_REGISTRY = NATIVE_PROVIDER_RUNTIME;
