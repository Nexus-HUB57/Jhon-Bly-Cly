export const TASK_STATUSES = [
  "rascunho",
  "planejando",
  "aguardando revisão",
  "gerando",
  "concluído",
  "com falha",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }> = {
  "rascunho": { label: "Rascunho", tone: "neutral" },
  "planejando": { label: "Planejando", tone: "info" },
  "aguardando revisão": { label: "Aguardando revisão", tone: "warning" },
  "gerando": { label: "Gerando", tone: "info" },
  "concluído": { label: "Concluído", tone: "success" },
  "com falha": { label: "Com falha", tone: "danger" },
};

const TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  "rascunho": ["planejando", "com falha"],
  "planejando": ["aguardando revisão", "com falha"],
  "aguardando revisão": ["planejando", "gerando", "com falha"],
  "gerando": ["concluído", "com falha"],
  "concluído": ["planejando", "gerando"],
  "com falha": ["rascunho", "planejando", "gerando"],
};

export function canTransitionTaskStatus(from: TaskStatus, to: TaskStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

export const VIDEO_FORMATS = ["16:9", "9:16", "1:1", "4:5", "custom"] as const;
export const GENERATION_RUN_TYPES = ["planejamento", "imagem_referência", "vídeo", "exportação"] as const;
