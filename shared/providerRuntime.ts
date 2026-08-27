export type ProviderRuntimeStatus = "ativo" | "inativo";

export type ProviderRuntime = {
  id: "minimax" | "openai" | "llama" | "zai" | "gemini" | "alibaba-model-studio" | "digitalocean" | "evomap";
  name: string;
  status: ProviderRuntimeStatus;
  integration: string;
  activation: string;
  rationale: string;
};

export const PROVIDER_RUNTIME_REGISTRY: readonly ProviderRuntime[] = [
  { id: "minimax", name: "MiniMax-H3", status: "ativo", integration: "Adaptador de vídeo server-side", activation: "Credencial oficial validada", rationale: "Geração audiovisual do Studio JBC." },
  { id: "openai", name: "OpenAI", status: "ativo", integration: "Conector de modelo server-side", activation: "Credencial oficial validada", rationale: "Planejamento e assistência textual." },
  { id: "llama", name: "Llama", status: "ativo", integration: "Endpoint compatível com OpenAI", activation: "Host, modelo e credencial validados", rationale: "Planejamento alternativo por provedor ou host autorizado." },
  { id: "zai", name: "Z.AI", status: "ativo", integration: "API GLM compatível com chat", activation: "Credencial oficial validada", rationale: "Capacidade complementar de agente e texto." },
  { id: "gemini", name: "Google AI Studio", status: "ativo", integration: "Gemini API server-side", activation: "Chave oficial validada", rationale: "Capacidade multimodal sob controle do backend." },
  { id: "alibaba-model-studio", name: "Alibaba Model Studio", status: "inativo", integration: "Conector DashScope preparado", activation: "Aguarda credencial validada", rationale: "Mantido inativo sem chamadas externas." },
  { id: "digitalocean", name: "DigitalOcean", status: "inativo", integration: "API de infraestrutura preparada", activation: "Aguarda token validado", rationale: "Mantido inativo sem alterações na infraestrutura." },
  { id: "evomap", name: "Evomap", status: "ativo", integration: "OAuth + PKCE preparado", activation: "Credencial oficial registrada no cofre e ativação autorizada", rationale: "Provedor real habilitado somente por contrato server-side e controles de acesso do Studio." },
] as const;

export function isRuntimeProviderEnabled(id: ProviderRuntime["id"]) {
  return PROVIDER_RUNTIME_REGISTRY.find(provider => provider.id === id)?.status === "ativo";
}

export function summarizeProviderRuntime() {
  return {
    total: PROVIDER_RUNTIME_REGISTRY.length,
    active: PROVIDER_RUNTIME_REGISTRY.filter(provider => provider.status === "ativo").length,
    inactive: PROVIDER_RUNTIME_REGISTRY.filter(provider => provider.status === "inativo").length,
  };
}
