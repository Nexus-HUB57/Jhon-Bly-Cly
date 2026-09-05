/**
 * Tipos Compartilhados — Sistema Autônomo myvideos
 */

export type AutonomousMode = "native" | "legacy" | "hybrid";

export type NativeModelInfo = {
  id: string;
  name: string;
  parameterLabel: string;
  modality: string[];
  status: string;
  backend: string;
};

export type AutonomousHealthReport = {
  status: "operacional" | "parcial" | "com falha";
  totalModels: number;
  totalParameters: string;
  loadedModels: number;
  externalDependencies: string[];
  autonomous: boolean;
};

export type AgentInfo = {
  id: string;
  name: string;
  capabilities: string[];
};

export type VideoProductionRequest = {
  briefing: string;
  format?: string;
  durationSeconds?: number;
  objective?: string;
  creativeDirection?: string;
};

export type VideoProductionResult = {
  script: string;
  scenes: Array<{ title: string; visualPrompt: string; narrative: string }>;
  assets: Array<{ kind: string; url: string }>;
  qualityScore: number;
};

export type AutonomousTaskStatus = "queued" | "running" | "completed" | "failed";

export type AutonomousTask = {
  id: string;
  type: "video_production" | "image_generation" | "agent_execution";
  status: AutonomousTaskStatus;
  progress: number;
  result?: unknown;
  error?: string;
  createdAt: number;
  completedAt?: number;
};
