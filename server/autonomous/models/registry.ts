/**
 * Registro Nativo de Modelos — Motor Autônomo do myvideos
 * 
 * Todos os modelos rodam nativamente via ONNX Runtime / WebGPU.
 * Zero dependências de APIs externas, tokens ou cotas.
 * Milhões a bilhões de parâmetros executados localmente.
 */

// ─── Tipos ───────────────────────────────────────────────────────

export type ModelModality = "text" | "image" | "video" | "audio" | "multimodal";
export type ModelPrecision = "fp32" | "fp16" | "int8" | "int4" | "mixed";
export type ModelStatus = "carregado" | "carregando" | "descarregado" | "com falha";
export type ComputeBackend = "onnx-cpu" | "onnx-gpu" | "onnx-webgpu" | "wasm" | "native";

export type NativeModelSpec = {
  id: string;
  name: string;
  description: string;
  modality: ModelModality[];
  parameterCount: number; // ex: 7_000_000_000 = 7B
  parameterLabel: string; // ex: "7B"
  precision: ModelPrecision;
  backend: ComputeBackend;
  modelPath: string; // caminho local do modelo ONNX/binario
  configPath: string; // caminho do config do modelo
  tokenizerPath: string; // caminho do tokenizer
  maxContextLength: number;
  status: ModelStatus;
  capabilities: string[];
  version: string;
  license: string;
};

// ─── Registro de Modelos Nativos ─────────────────────────────────

/**
 * Modelos nativos do sistema autônomo myvideos.
 * Cada modelo roda inteiramente na máquina local sem APIs externas.
 */
export const NATIVE_MODEL_REGISTRY: NativeModelSpec[] = [
  // ── LLMs para raciocínio, planejamento e geração de scripts ──
  {
    id: "phi-3.5-mini-instruct",
    name: "Phi-3.5 Mini Instruct",
    description: "Modelo linguístico compacto de 3.8B parâmetros para raciocínio, planejamento, e geração de scripts. Otimizado para instruções em múltiplos idiomas incluindo PT-BR.",
    modality: ["text", "multimodal"],
    parameterCount: 3_800_000_000,
    parameterLabel: "3.8B",
    precision: "int4",
    backend: "onnx-cpu",
    modelPath: "models/phi-3.5-mini-instruct/model.onnx",
    configPath: "models/phi-3.5-mini-instruct/config.json",
    tokenizerPath: "models/phi-3.5-mini-instruct/tokenizer.json",
    maxContextLength: 128_000,
    status: "descarregado",
    capabilities: ["raciocínio", "planejamento", "script", "análise", "síntese", "json-estruturado", "multi-idioma"],
    version: "1.0.0",
    license: "MIT",
  },
  {
    id: "llama-3.2-3b-instruct",
    name: "Llama 3.2 3B Instruct",
    description: "Modelo linguístico de 3B parâmetros da Meta para raciocínio avançado e geração de conteúdo. Alta qualidade em tarefas de planejamento criativo.",
    modality: ["text"],
    parameterCount: 3_000_000_000,
    parameterLabel: "3B",
    precision: "int4",
    backend: "onnx-cpu",
    modelPath: "models/llama-3.2-3b-instruct/model.onnx",
    configPath: "models/llama-3.2-3b-instruct/config.json",
    tokenizerPath: "models/llama-3.2-3b-instruct/tokenizer.json",
    maxContextLength: 128_000,
    status: "descarregado",
    capabilities: ["raciocínio", "planejamento", "script", "análise", "síntese", "json-estruturado"],
    version: "1.0.0",
    license: "Llama-3.2-Community",
  },
  {
    id: "qwen2.5-7b-instruct",
    name: "Qwen2.5 7B Instruct",
    description: "Modelo linguístico de 7B parâmetros da Alibaba para tarefas complexas de raciocínio, planejamento e criação de conteúdo audiovisual. Excelente em PT-BR.",
    modality: ["text", "multimodal"],
    parameterCount: 7_000_000_000,
    parameterLabel: "7B",
    precision: "int4",
    backend: "onnx-cpu",
    modelPath: "models/qwen2.5-7b-instruct/model.onnx",
    configPath: "models/qwen2.5-7b-instruct/config.json",
    tokenizerPath: "models/qwen2.5-7b-instruct/tokenizer.json",
    maxContextLength: 131_072,
    status: "descarregado",
    capabilities: ["raciocínio", "planejamento", "script", "análise", "síntese", "json-estruturado", "multi-idioma", "código"],
    version: "1.0.0",
    license: "Apache-2.0",
  },
  {
    id: "gemma-2-9b-it",
    name: "Gemma 2 9B IT",
    description: "Modelo de 9B parâmetros do Google para raciocínio profundo e geração de conteúdo de alta qualidade. Ideal para síntese criativa complexa.",
    modality: ["text"],
    parameterCount: 9_000_000_000,
    parameterLabel: "9B",
    precision: "int4",
    backend: "onnx-cpu",
    modelPath: "models/gemma-2-9b-it/model.onnx",
    configPath: "models/gemma-2-9b-it/config.json",
    tokenizerPath: "models/gemma-2-9b-it/tokenizer.json",
    maxContextLength: 8_192,
    status: "descarregado",
    capabilities: ["raciocínio", "planejamento", "script", "análise", "síntese", "json-estruturado"],
    version: "1.0.0",
    license: "Gemma",
  },

  // ── Modelos de Visão/Linguagem (VLM) ──
  {
    id: "phi-3.5-vision-instruct",
    name: "Phi-3.5 Vision Instruct",
    description: "Modelo multimodal de 4.2B parâmetros para análise visual de referências, storyboards e frames de vídeo. Compreende imagem + texto simultaneamente.",
    modality: ["multimodal", "text", "image"],
    parameterCount: 4_200_000_000,
    parameterLabel: "4.2B",
    precision: "int4",
    backend: "onnx-cpu",
    modelPath: "models/phi-3.5-vision-instruct/model.onnx",
    configPath: "models/phi-3.5-vision-instruct/config.json",
    tokenizerPath: "models/phi-3.5-vision-instruct/tokenizer.json",
    maxContextLength: 128_000,
    status: "descarregado",
    capabilities: ["análise-visual", "descrição-imagem", "ocr", "storyboard", "referência-visual", "raciocínio-visual"],
    version: "1.0.0",
    license: "MIT",
  },
  {
    id: "qwen2-vl-7b-instruct",
    name: "Qwen2-VL 7B Instruct",
    description: "Modelo vision-language de 7B parâmetros para análise visual avançada, compreensão de vídeo e geração de descrições detalhadas.",
    modality: ["multimodal", "text", "image", "video"],
    parameterCount: 7_000_000_000,
    parameterLabel: "7B",
    precision: "int4",
    backend: "onnx-cpu",
    modelPath: "models/qwen2-vl-7b-instruct/model.onnx",
    configPath: "models/qwen2-vl-7b-instruct/config.json",
    tokenizerPath: "models/qwen2-vl-7b-instruct/tokenizer.json",
    maxContextLength: 131_072,
    status: "descarregado",
    capabilities: ["análise-visual", "compreensão-vídeo", "descrição-imagem", "ocr", "storyboard", "referência-visual", "raciocínio-visual"],
    version: "1.0.0",
    license: "Apache-2.0",
  },

  // ── Modelos de Geração de Imagem (Diffusion) ──
  {
    id: "sd-turbo",
    name: "Stable Diffusion Turbo",
    description: "Modelo de difusão de 815M parâmetros para geração rápida de imagens. 4 pasos de inferência para resultados em tempo real. Ideal para pré-visualização e iteração rápida.",
    modality: ["image"],
    parameterCount: 815_000_000,
    parameterLabel: "815M",
    precision: "fp16",
    backend: "onnx-gpu",
    modelPath: "models/sd-turbo/model.onnx",
    configPath: "models/sd-turbo/config.json",
    tokenizerPath: "models/sd-turbo/tokenizer.json",
    maxContextLength: 77, // CLIP text encoder max tokens
    status: "descarregado",
    capabilities: ["geração-imagem", "imagem-rápida", "text2img"],
    version: "1.0.0",
    license: "SDXL-Community",
  },
  {
    id: "sdxl-base-1.0",
    name: "Stable Diffusion XL Base 1.0",
    description: "Modelo de difusão de 3.5B parâmetros para geração de imagens de alta qualidade. Resolução nativa 1024x1024. Excelente fidelidade e detalhes.",
    modality: ["image"],
    parameterCount: 3_500_000_000,
    parameterLabel: "3.5B",
    precision: "fp16",
    backend: "onnx-gpu",
    modelPath: "models/sdxl-base-1.0/model.onnx",
    configPath: "models/sdxl-base-1.0/config.json",
    tokenizerPath: "models/sdxl-base-1.0/tokenizer.json",
    maxContextLength: 77,
    status: "descarregado",
    capabilities: ["geração-imagem", "alta-resolução", "text2img", "img2img", "inpainting"],
    version: "1.0.0",
    license: "SDXL-Community",
  },
  {
    id: "flux-schnell",
    name: "FLUX.1 Schnell",
    description: "Modelo de difusão de 12B parâmetros para geração de imagens de altíssima qualidade em poucos passos. Estado-da-arte em fidelidade e coerência visual.",
    modality: ["image"],
    parameterCount: 12_000_000_000,
    parameterLabel: "12B",
    precision: "fp16",
    backend: "onnx-gpu",
    modelPath: "models/flux-schnell/model.onnx",
    configPath: "models/flux-schnell/config.json",
    tokenizerPath: "models/flux-schnell/tokenizer.json",
    maxContextLength: 256,
    status: "descarregado",
    capabilities: ["geração-imagem", "alta-resolução", "text2img", "qualidade-extrema"],
    version: "1.0.0",
    license: "FLUX-Community",
  },

  // ── Modelos de Geração de Vídeo ──
  {
    id: "stable-video-diffusion",
    name: "Stable Video Diffusion (SVD)",
    description: "Modelo de difusão de vídeo de 1.5B parâmetros. Gera frames de vídeo curtos (2-4s) a partir de imagem de referência. Base para pipeline de vídeo nativo.",
    modality: ["video", "image"],
    parameterCount: 1_500_000_000,
    parameterLabel: "1.5B",
    precision: "fp16",
    backend: "onnx-gpu",
    modelPath: "models/stable-video-diffusion/model.onnx",
    configPath: "models/stable-video-diffusion/config.json",
    tokenizerPath: "models/stable-video-diffusion/tokenizer.json",
    maxContextLength: 77,
    status: "descarregado",
    capabilities: ["geração-vídeo", "img2vid", "frame-interpolação"],
    version: "1.0.0",
    license: "SVD-Community",
  },
  {
    id: "cogvideox-5b",
    name: "CogVideoX-5B",
    description: "Modelo de geração de vídeo de 5B parâmetros. Gera vídeos de 6s a partir de texto. Alta coerência temporal e visual. Estado-da-arte open-source para vídeo.",
    modality: ["video", "text"],
    parameterCount: 5_000_000_000,
    parameterLabel: "5B",
    precision: "fp16",
    backend: "onnx-gpu",
    modelPath: "models/cogvideox-5b/model.onnx",
    configPath: "models/cogvideox-5b/config.json",
    tokenizerPath: "models/cogvideox-5b/tokenizer.json",
    maxContextLength: 226,
    status: "descarregado",
    capabilities: ["geração-vídeo", "text2vid", "alta-coerência", "vídeo-longo"],
    version: "1.0.0",
    license: "Apache-2.0",
  },

  // ── Modelos de Embedding (Memória Semântica) ──
  {
    id: "bge-m3",
    name: "BGE-M3",
    description: "Modelo de embedding multilingual de 568M parâmetros. Para busca semântica na memória de conhecimento. Substitui busca lexical por busca vetorial nativa.",
    modality: ["text"],
    parameterCount: 568_000_000,
    parameterLabel: "568M",
    precision: "fp32",
    backend: "onnx-cpu",
    modelPath: "models/bge-m3/model.onnx",
    configPath: "models/bge-m3/config.json",
    tokenizerPath: "models/bge-m3/tokenizer.json",
    maxContextLength: 8_192,
    status: "descarregado",
    capabilities: ["embedding", "busca-semântica", "multilingual"],
    version: "1.0.0",
    license: "MIT",
  },

  // ── Modelos de Áudio (TTS + STT) ──
  {
    id: "whisper-small",
    name: "Whisper Small",
    description: "Modelo de speech-to-text de 244M parâmetros. Transcrição nativa de áudio em múltiplos idiomas. Para narração e análise de áudio de referência.",
    modality: ["audio", "text"],
    parameterCount: 244_000_000,
    parameterLabel: "244M",
    precision: "fp32",
    backend: "onnx-cpu",
    modelPath: "models/whisper-small/model.onnx",
    configPath: "models/whisper-small/config.json",
    tokenizerPath: "models/whisper-small/tokenizer.json",
    maxContextLength: 448, // max audio frames
    status: "descarregado",
    capabilities: ["speech-to-text", "transcrição", "multi-idioma"],
    version: "1.0.0",
    license: "MIT",
  },
  {
    id: "bark-small",
    name: "Bark Small",
    description: "Modelo de text-to-speech de ~400M parâmetros. Geração de narração e vozes nativamente. Para trilha sonora e voiceover de vídeos.",
    modality: ["text", "audio"],
    parameterCount: 400_000_000,
    parameterLabel: "400M",
    precision: "fp32",
    backend: "onnx-cpu",
    modelPath: "models/bark-small/model.onnx",
    configPath: "models/bark-small/config.json",
    tokenizerPath: "models/bark-small/tokenizer.json",
    maxContextLength: 256,
    status: "descarregado",
    capabilities: ["text-to-speech", "narração", "múltiplas-vozes"],
    version: "1.0.0",
    license: "MIT",
  },
];

// ─── API do Registro ─────────────────────────────────────────────

export function getModelById(id: string): NativeModelSpec | undefined {
  return NATIVE_MODEL_REGISTRY.find(m => m.id === id);
}

export function getModelsByModality(modality: ModelModality): NativeModelSpec[] {
  return NATIVE_MODEL_REGISTRY.filter(m => m.modality.includes(modality));
}

export function getModelsByCapability(capability: string): NativeModelSpec[] {
  return NATIVE_MODEL_REGISTRY.filter(m => m.capabilities.includes(capability));
}

export function getLoadedModels(): NativeModelSpec[] {
  return NATIVE_MODEL_REGISTRY.filter(m => m.status === "carregado");
}

export function getTotalParameters(): number {
  return NATIVE_MODEL_REGISTRY.reduce((sum, m) => sum + m.parameterCount, 0);
}

export function summarizeRegistry() {
  const total = NATIVE_MODEL_REGISTRY.length;
  const loaded = NATIVE_MODEL_REGISTRY.filter(m => m.status === "carregado").length;
  const totalParams = getTotalParameters();
  const modalities = [...new Set(NATIVE_MODEL_REGISTRY.flatMap(m => m.modality))];
  const byModality: Record<string, number> = {};
  for (const m of modalities) {
    byModality[m] = NATIVE_MODEL_REGISTRY.filter(model => model.modality.includes(m)).length;
  }
  return {
    total,
    loaded,
    totalParameters: totalParams,
    parameterLabel: totalParams >= 1_000_000_000_000
      ? `${(totalParams / 1_000_000_000_000).toFixed(1)}T`
      : totalParams >= 1_000_000_000
      ? `${(totalParams / 1_000_000_000).toFixed(1)}B`
      : `${(totalParams / 1_000_000).toFixed(0)}M`,
    modalities: byModality,
    backends: [...new Set(NATIVE_MODEL_REGISTRY.map(m => m.backend))],
  };
}

/**
 * Seleciona o melhor modelo para uma dada capacidade e preferências.
 * Algoritmo de roteamento nativo — sem APIs externas.
 */
export function selectBestModel(input: {
  capability: string;
  minParameters?: number;
  maxParameters?: number;
  preferBackend?: ComputeBackend;
  preferPrecision?: ModelPrecision;
}): NativeModelSpec | undefined {
  let candidates = getModelsByCapability(input.capability);

  if (input.minParameters) {
    candidates = candidates.filter(m => m.parameterCount >= input.minParameters!);
  }
  if (input.maxParameters) {
    candidates = candidates.filter(m => m.parameterCount <= input.maxParameters!);
  }

  // Ordenar por: backend preferido > precisão preferida > mais parâmetros
  candidates.sort((a, b) => {
    if (input.preferBackend) {
      const aPreferred = a.backend === input.preferBackend ? 1 : 0;
      const bPreferred = b.backend === input.preferBackend ? 1 : 0;
      if (aPreferred !== bPreferred) return bPreferred - aPreferred;
    }
    if (input.preferPrecision) {
      const aPreferred = a.precision === input.preferPrecision ? 1 : 0;
      const bPreferred = b.precision === input.preferPrecision ? 1 : 0;
      if (aPreferred !== bPreferred) return bPreferred - aPreferred;
    }
    return b.parameterCount - a.parameterCount;
  });

  return candidates[0];
}
