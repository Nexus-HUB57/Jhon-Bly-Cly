import { ENV } from "./_core/env";
import { isRuntimeProviderEnabled } from "../shared/providerRuntime";

export type MiniMaxVideoInput = {
  prompt: string;
  duration: number;
  ratio: "adaptive" | "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
  resolution?: "768P" | "2K";
  references?: Array<{
    kind: "image" | "audio";
    url: string;
    durationSeconds?: number;
  }>;
};

type MiniMaxContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string }; role: "reference_image" }
  | { type: "audio_url"; audio_url: { url: string }; role: "reference_audio" };

function isSupportedReferenceUrl(url: string) {
  try {
    const protocol = new URL(url).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export function buildMiniMaxVideoPayload(input: MiniMaxVideoInput) {
  if (input.duration < 4 || input.duration > 15) throw new Error("MiniMax-H3 aceita vídeos entre 4 e 15 segundos.");
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("O prompt de vídeo é obrigatório.");

  const references = input.references ?? [];
  const images = references.filter(reference => reference.kind === "image");
  const audios = references.filter(reference => reference.kind === "audio");
  if (images.length > 9) throw new Error("MiniMax-H3 aceita no máximo 9 imagens de referência.");
  if (audios.length > 3) throw new Error("MiniMax-H3 aceita no máximo 3 áudios de referência.");

  for (const reference of references) {
    if (!isSupportedReferenceUrl(reference.url)) throw new Error("Referências MiniMax devem usar URLs HTTP(S) acessíveis ao provedor.");
    if (reference.kind === "audio" && (!reference.durationSeconds || reference.durationSeconds < 2 || reference.durationSeconds > 15)) {
      throw new Error("Cada áudio de referência MiniMax deve ter entre 2 e 15 segundos.");
    }
  }

  const content: MiniMaxContent[] = [{ type: "text", text: prompt }];
  for (const image of images) content.push({ type: "image_url", image_url: { url: image.url }, role: "reference_image" });
  for (const audio of audios) content.push({ type: "audio_url", audio_url: { url: audio.url }, role: "reference_audio" });

  return {
    model: "MiniMax-H3",
    content,
    resolution: input.resolution ?? "768P",
    duration: input.duration,
    ratio: references.length ? "adaptive" : input.ratio,
  };
}

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
  const payload = buildMiniMaxVideoPayload(input);
  return request<{ task_id: string }>("/v2/video_generation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function queryMiniMaxVideoTask(taskId: string) {
  return request<{ task: { id: string; status: "queued" | "running" | "succeeded" | "failed" | "cancelled"; content?: { url?: string }; error?: { message?: string } } }>(`/v2/query/video_generation/${encodeURIComponent(taskId)}`);
}
