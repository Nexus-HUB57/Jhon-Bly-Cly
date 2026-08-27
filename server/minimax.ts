import { ENV } from "./_core/env";
import { isRuntimeProviderEnabled } from "../shared/providerRuntime";

export type MiniMaxVideoInput = {
  prompt: string;
  duration: number;
  ratio: "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
  resolution?: "768P" | "2K";
};

export function hasMiniMaxCredentials() {
  return Boolean(ENV.minimaxApiKey);
}

function endpoint(path: string) {
  return new URL(path, ENV.minimaxApiBaseUrl.replace(/\/+$/, "") + "/").toString();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isRuntimeProviderEnabled("minimax")) throw new Error("O provedor MiniMax está inativo pela política operacional do JBCx19.");
  if (!hasMiniMaxCredentials()) throw new Error("O conector MiniMax aguarda uma credencial oficial.");
  const response = await fetch(endpoint(path), {
    ...init,
    headers: { Authorization: `Bearer ${ENV.minimaxApiKey}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({})) as { error?: { message?: string }; message?: string } & T;
  if (!response.ok) throw new Error(body.error?.message || body.message || `MiniMax retornou HTTP ${response.status}.`);
  return body;
}

export async function createMiniMaxVideoTask(input: MiniMaxVideoInput) {
  if (input.duration < 4 || input.duration > 15) throw new Error("MiniMax-H3 aceita vídeos entre 4 e 15 segundos.");
  if (!input.prompt.trim()) throw new Error("O prompt de vídeo é obrigatório.");
  return request<{ task_id: string }>("/v2/video_generation", {
    method: "POST",
    body: JSON.stringify({ model: "MiniMax-H3", content: [{ type: "text", text: input.prompt.trim() }], resolution: input.resolution ?? "768P", duration: input.duration, ratio: input.ratio }),
  });
}

export async function queryMiniMaxVideoTask(taskId: string) {
  return request<{ task: { id: string; status: "queued" | "running" | "succeeded" | "failed" | "cancelled"; content?: { url?: string }; error?: { message?: string } } }>(`/v2/query/video_generation/${encodeURIComponent(taskId)}`);
}
