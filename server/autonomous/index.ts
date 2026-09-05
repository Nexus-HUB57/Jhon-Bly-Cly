/**
 * Motor Autônomo myvideos — Integração Central
 * 
 * Ponto de entrada único para todo o sistema autônomo.
 * Substitui todas as dependências externas (Forge, MiniMax, S3, OAuth)
 * com motores nativos de milhões/bilhões de parâmetros.
 */

// ── Exportar todos os sub-módulos ──
export * as Models from "./models/registry";
export * as LLM from "./models/llmEngine";
export * as Image from "./models/imageEngine";
export * as Video from "./models/videoEngine";
export * as Audio from "./models/audioEngine";
export * as Storage from "./storage/nativeStorage";
export * as Agents from "./agents/agenticSystem";
export * as Memory from "./memory/memoryEngine";

// ── Importar para stats ──
import { summarizeRegistry, getTotalParameters } from "./models/registry";
import { getLLMEngineStats } from "./models/llmEngine";
import { getImageEngineStats } from "./models/imageEngine";
import { getVideoEngineStats } from "./models/videoEngine";
import { getAudioEngineStats } from "./models/audioEngine";
import { getAgenticSystemStats } from "./agents/agenticSystem";
import { getMemoryStats } from "./memory/memoryEngine";

// ─── Health Check ────────────────────────────────────────────────

export type AutonomousHealth = {
  status: "operacional" | "parcial" | "com falha";
  totalModels: number;
  totalParameters: string;
  loadedModels: number;
  llmEngine: ReturnType<typeof getLLMEngineStats>;
  imageEngine: ReturnType<typeof getImageEngineStats>;
  videoEngine: ReturnType<typeof getVideoEngineStats>;
  audioEngine: ReturnType<typeof getAudioEngineStats>;
  agenticSystem: ReturnType<typeof getAgenticSystemStats>;
  memorySystem: ReturnType<typeof getMemoryStats>;
  externalDependencies: string[];
  autonomous: boolean;
};

/**
 * getAutonomousHealth — Verifica saúde de todo o sistema autônomo.
 */
export function getAutonomousHealth(): AutonomousHealth {
  const registry = summarizeRegistry();
  const totalParams = getTotalParameters();

  const externalDeps: string[] = [];
  // Verificar se há variáveis de API externa ainda configuradas
  if (process.env.BUILT_IN_FORGE_API_KEY) externalDeps.push("FORGE_API_KEY");
  if (process.env.MINIMAX_API_KEY) externalDeps.push("MINIMAX_API_KEY");

  const isAutonomous = externalDeps.length === 0;

  return {
    status: isAutonomous ? "operacional" : "parcial",
    totalModels: registry.total,
    totalParameters: registry.parameterLabel,
    loadedModels: registry.loaded,
    llmEngine: getLLMEngineStats(),
    imageEngine: getImageEngineStats(),
    videoEngine: getVideoEngineStats(),
    audioEngine: getAudioEngineStats(),
    agenticSystem: getAgenticSystemStats(),
    memorySystem: getMemoryStats(),
    externalDependencies: externalDeps,
    autonomous: isAutonomous,
  };
}

/**
 * getAutonomousManifest — Manifesto completo do sistema.
 */
export function getAutonomousManifest() {
  const health = getAutonomousHealth();
  const registry = summarizeRegistry();

  return {
    name: "myvideos-autonomous",
    version: "2.0.0",
    description: "Plataforma myvideos totalmente autônoma — zero dependências externas",
    architecture: {
      paradigm: "agentic-ai-native",
      models: "onnx-runtime-native",
      storage: "local-filesystem",
      memory: "semantic-vector-native",
      auth: "local-jwt",
      agents: "react-multi-agent",
    },
    capabilities: [
      "geração de vídeo end-to-end",
      "geração de imagem de alta qualidade",
      "raciocínio e planejamento agentic",
      "memória semântica nativa",
      "síntese e transcrição de áudio",
      "orquestração multi-agente",
      "auto-reflexão e auto-correção",
      "zero dependências externas",
    ],
    parameters: {
      total: registry.parameterLabel,
      byModality: registry.modalities,
    },
    health,
  };
}
