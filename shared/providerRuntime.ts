export type ProviderRuntimeStatus = "ativo" | "inativo";
export type FreeFallbackStatus = "não elegível" | "condicional" | "não confirmado";
export type FreeFallbackScope = "planejamento e texto" | "análise de referências";
export type ProviderTokenSynchronization = "sincronizada" | "conector audiovisual separado";
export type ProviderContractStatus = "funcional" | "requer contrato" | "requer host";

export type ProviderRuntime = {
  id: "minimax" | "openai" | "llama" | "zai" | "gemini" | "alibaba-model-studio" | "digitalocean" | "evomap";
  name: string;
  status: ProviderRuntimeStatus;
  integration: string;
  activation: string;
  rationale: string;
  freeFallbackStatus: FreeFallbackStatus;
  freeFallbackScopes: readonly FreeFallbackScope[];
  freeFallbackNote: string;
  tokenSynchronization: ProviderTokenSynchronization;
  contractStatus: ProviderContractStatus;
};

export const PROVIDER_RUNTIME_REGISTRY: readonly ProviderRuntime[] = [
  { id: "minimax", name: "MiniMax-H3", status: "ativo", integration: "Adaptador de vídeo server-side", activation: "Credencial oficial validada", rationale: "Geração audiovisual do Studio JBC.", freeFallbackStatus: "não elegível", freeFallbackScopes: [], freeFallbackNote: "A saída de vídeo H3 é cobrada por segundo; saldo insuficiente gera apenas proposta de revisão.", tokenSynchronization: "conector audiovisual separado", contractStatus: "funcional" },
  { id: "openai", name: "OpenAI", status: "ativo", integration: "Conector de modelo server-side", activation: "Credencial oficial validada", rationale: "Planejamento e assistência textual.", freeFallbackStatus: "não confirmado", freeFallbackScopes: [], freeFallbackNote: "Créditos promocionais não constituem plano gratuito permanente de API.", tokenSynchronization: "sincronizada", contractStatus: "funcional" },
  { id: "llama", name: "Llama", status: "ativo", integration: "Endpoint compatível com OpenAI", activation: "Host, modelo e credencial validados", rationale: "Planejamento alternativo por provedor ou host autorizado.", freeFallbackStatus: "não confirmado", freeFallbackScopes: [], freeFallbackNote: "A disponibilidade sem cobrança depende do host e do contrato do proprietário.", tokenSynchronization: "sincronizada", contractStatus: "requer host" },
  { id: "zai", name: "Z.AI", status: "ativo", integration: "API GLM compatível com chat", activation: "Credencial oficial validada", rationale: "Capacidade complementar de agente e texto.", freeFallbackStatus: "condicional", freeFallbackScopes: ["planejamento e texto", "análise de referências"], freeFallbackNote: "Exige confirmar modelo, conta e termos da API antes de qualquer chamada aprovada.", tokenSynchronization: "sincronizada", contractStatus: "funcional" },
  { id: "gemini", name: "Google AI Studio", status: "ativo", integration: "Gemini API server-side", activation: "Chave oficial validada", rationale: "Capacidade multimodal sob controle do backend.", freeFallbackStatus: "condicional", freeFallbackScopes: ["planejamento e texto", "análise de referências"], freeFallbackNote: "Elegibilidade depende de conta, projeto, modelo, limites e termos do Free Tier.", tokenSynchronization: "sincronizada", contractStatus: "funcional" },
  { id: "alibaba-model-studio", name: "Alibaba Model Studio", status: "inativo", integration: "Conector DashScope preparado", activation: "Aguarda credencial validada", rationale: "Mantido inativo sem chamadas externas.", freeFallbackStatus: "não confirmado", freeFallbackScopes: [], freeFallbackNote: "Provedor inativo; não é candidato até contrato e credencial validados.", tokenSynchronization: "sincronizada", contractStatus: "requer contrato" },
  { id: "digitalocean", name: "DigitalOcean", status: "inativo", integration: "API de infraestrutura preparada", activation: "Aguarda token validado", rationale: "Mantido inativo sem alterações na infraestrutura.", freeFallbackStatus: "não confirmado", freeFallbackScopes: [], freeFallbackNote: "Infraestrutura inativa; não pode ser iniciada por fallback.", tokenSynchronization: "sincronizada", contractStatus: "requer contrato" },
  { id: "evomap", name: "Evomap", status: "ativo", integration: "OAuth + PKCE preparado", activation: "Credencial oficial registrada no cofre e ativação autorizada", rationale: "Provedor real habilitado somente por contrato server-side e controles de acesso do Studio.", freeFallbackStatus: "não confirmado", freeFallbackScopes: [], freeFallbackNote: "Requer contrato OAuth/gateway oficial antes de se tornar candidato funcional.", tokenSynchronization: "sincronizada", contractStatus: "requer contrato" },
] as const;

export function isRuntimeProviderEnabled(id: ProviderRuntime["id"]) {
  return PROVIDER_RUNTIME_REGISTRY.find(provider => provider.id === id)?.status === "ativo";
}

export function getConditionalFreeFallbackProviders(scope: FreeFallbackScope) {
  return PROVIDER_RUNTIME_REGISTRY.filter(provider => provider.status === "ativo" && provider.freeFallbackStatus === "condicional" && provider.freeFallbackScopes.includes(scope));
}

export function getSynchronizedTokenProviders() {
  return PROVIDER_RUNTIME_REGISTRY.filter(provider => provider.tokenSynchronization === "sincronizada");
}

export function summarizeProviderRuntime() {
  return {
    total: PROVIDER_RUNTIME_REGISTRY.length,
    active: PROVIDER_RUNTIME_REGISTRY.filter(provider => provider.status === "ativo").length,
    inactive: PROVIDER_RUNTIME_REGISTRY.filter(provider => provider.status === "inativo").length,
    synchronizedTokenApis: getSynchronizedTokenProviders().length,
  };
}
