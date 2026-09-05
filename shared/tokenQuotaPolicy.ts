export const TOKEN_QUOTA_RESET = "UTC" as const;
export const TOKEN_QUOTA_MODES = ["cota-diaria-declarada", "local-sem-cota-de-provedor", "quota-desconhecida"] as const;
export type TokenQuotaMode = (typeof TOKEN_QUOTA_MODES)[number];

export type TokenQuotaProfile = {
  providerId: string;
  label: string;
  mode: TokenQuotaMode;
  dailyTokenLimit: number | null;
  perRequestTokenLimit: number;
  scopes: readonly ("planejamento" | "texto" | "analise-referencias")[ ];
  requiresHumanApproval: true;
  note: string;
};

/**
 * A matriz é declarativa: uma cota informada pelo proprietário não é tratada
 * como saldo confirmado. O contador real só pode ser atualizado por um fluxo
 * autorizado que receba uso do provedor; esta camada nunca chama rede.
 */
export const TOKEN_QUOTA_PROFILES: readonly TokenQuotaProfile[] = [
  { providerId: "openai", label: "OpenAI", mode: "cota-diaria-declarada", dailyTokenLimit: null, perRequestTokenLimit: 8192, scopes: ["planejamento", "texto", "analise-referencias"], requiresHumanApproval: true, note: "Cota diária declarada; limite numérico e saldo não confirmados pelo Studio." },
  { providerId: "llama", label: "Llama", mode: "cota-diaria-declarada", dailyTokenLimit: null, perRequestTokenLimit: 8192, scopes: ["planejamento", "texto"], requiresHumanApproval: true, note: "Depende do host autorizado; não assumir que todo endpoint oferece cota gratuita." },
  { providerId: "zai", label: "Z.AI", mode: "cota-diaria-declarada", dailyTokenLimit: null, perRequestTokenLimit: 8192, scopes: ["planejamento", "texto", "analise-referencias"], requiresHumanApproval: true, note: "Cota diária declarada; contrato, modelo e saldo permanecem condicionais." },
  { providerId: "gemini", label: "Google AI Studio", mode: "cota-diaria-declarada", dailyTokenLimit: null, perRequestTokenLimit: 8192, scopes: ["planejamento", "texto", "analise-referencias"], requiresHumanApproval: true, note: "Free Tier depende da conta, projeto, modelo e limites vigentes." },
  { providerId: "alibaba-model-studio", label: "Alibaba Model Studio", mode: "quota-desconhecida", dailyTokenLimit: null, perRequestTokenLimit: 8192, scopes: ["planejamento", "texto"], requiresHumanApproval: true, note: "Token sincronizado não habilita o conector inativo nem confirma gratuidade." },
  { providerId: "digitalocean", label: "DigitalOcean", mode: "quota-desconhecida", dailyTokenLimit: null, perRequestTokenLimit: 4096, scopes: ["planejamento"], requiresHumanApproval: true, note: "É infraestrutura inativa; não pode ser acionada para fallback." },
  { providerId: "evomap", label: "Evomap", mode: "quota-desconhecida", dailyTokenLimit: null, perRequestTokenLimit: 8192, scopes: ["planejamento", "texto"], requiresHumanApproval: true, note: "Contrato OAuth/gateway funcional ainda não confirmado." },
  { providerId: "ollama-local", label: "Ollama local", mode: "local-sem-cota-de-provedor", dailyTokenLimit: null, perRequestTokenLimit: 8192, scopes: ["planejamento", "texto", "analise-referencias"], requiresHumanApproval: true, note: "Sem cobrança de provedor quando executado no host do proprietário; requer processo, modelo e recursos locais." },
] as const;

export type TokenBudgetState = {
  providerId: string;
  dateUtc: string;
  consumedTokens: number;
  reservedTokens: number;
};

export function utcQuotaDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getTokenQuotaProfile(providerId: string) {
  return TOKEN_QUOTA_PROFILES.find(profile => profile.providerId === providerId);
}

export function canReserveTokenBudget(profile: TokenQuotaProfile, state: TokenBudgetState, requestedTokens: number, now = new Date()) {
  if (!Number.isInteger(requestedTokens) || requestedTokens <= 0 || requestedTokens > profile.perRequestTokenLimit) return false;
  if (state.dateUtc !== utcQuotaDate(now)) return true;
  if (profile.dailyTokenLimit === null) return false;
  return state.consumedTokens + state.reservedTokens + requestedTokens <= profile.dailyTokenLimit;
}

export function createTokenRouteProposal(scope: TokenQuotaProfile["scopes"][number], requestedTokens: number, offset = 0) {
  const candidates = TOKEN_QUOTA_PROFILES.filter(profile => profile.scopes.includes(scope) && requestedTokens <= profile.perRequestTokenLimit);
  const ordered = candidates.length === 0 ? [] : candidates.map((_, index) => candidates[(index + Math.max(0, offset)) % candidates.length]);
  return {
    scope,
    requestedTokens,
    reset: TOKEN_QUOTA_RESET,
    proposalOnly: true as const,
    requiresHumanApproval: true as const,
    candidates: ordered.map(profile => ({ providerId: profile.providerId, label: profile.label, mode: profile.mode, note: profile.note })),
    guardrail: "Nenhum candidato é chamado, alternado ou cobrado por esta proposta.",
  };
}
