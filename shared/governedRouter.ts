import { FUSION_RISK_LEVELS, type FusionRiskLevel } from "./fusionCatalog";
import { JBCX19_ADAPTERS, type Jbcx19Adapter } from "./jbcx19Adapters";

export const GOVERNED_ROUTER_CAPABILITIES = [
  "planejamento e orquestração",
  "pesquisa e referência",
  "mídia generativa",
  "arquitetura e telemetria",
  "infraestrutura de modelo",
] as const;

export type GovernedRouterCapability = (typeof GOVERNED_ROUTER_CAPABILITIES)[number];
export type GovernedRouterRisk = Exclude<FusionRiskLevel, "bloqueado">;

type RouterRequest = {
  capability: GovernedRouterCapability;
  maxRisk: GovernedRouterRisk;
  request: string;
  rotationOffset: number;
};

export type GovernedRouterCandidate = Pick<Jbcx19Adapter, "id" | "repository" | "category" | "activationMode" | "status" | "guardrail"> & {
  rank: number;
  riskLevel: FusionRiskLevel;
  reason: string;
  execution: "proposta";
  requiresHumanApproval: true;
};

const RISK_SCORE: Record<FusionRiskLevel, number> = { baixo: 1, médio: 2, alto: 3, bloqueado: 99 };

const CAPABILITY_CATEGORIES: Record<GovernedRouterCapability, Jbcx19Adapter["category"][]> = {
  "planejamento e orquestração": ["agente", "harness"],
  "pesquisa e referência": ["referência", "prompt"],
  "mídia generativa": ["mcp"],
  "arquitetura e telemetria": ["harness", "agente"],
  "infraestrutura de modelo": ["modelo", "runtime"],
};

function riskFor(adapter: Jbcx19Adapter): FusionRiskLevel {
  if (adapter.status === "bloqueado" || adapter.activationMode === "bloqueado") return "bloqueado";
  if (adapter.activationMode === "host autorizado") return "alto";
  if (adapter.activationMode === "credencial oficial") return "médio";
  return adapter.category === "referência" ? "baixo" : "médio";
}

function rotate<T>(items: T[], offset: number) {
  if (!items.length) return [];
  const start = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

export function buildGovernedRoutePlan(input: RouterRequest, adapters = JBCX19_ADAPTERS) {
  const allowedRisk = RISK_SCORE[input.maxRisk];
  const candidates = adapters
    .filter(adapter => CAPABILITY_CATEGORIES[input.capability].includes(adapter.category))
    .map(adapter => ({ adapter, riskLevel: riskFor(adapter) }))
    .filter(({ adapter, riskLevel }) => adapter.status !== "bloqueado" && riskLevel !== "bloqueado" && RISK_SCORE[riskLevel] <= allowedRisk)
    .sort((left, right) => left.riskLevel.localeCompare(right.riskLevel) || left.adapter.repository.localeCompare(right.adapter.repository));

  const ordered = rotate(candidates, input.rotationOffset).map(({ adapter, riskLevel }, index) => ({
    id: adapter.id,
    repository: adapter.repository,
    category: adapter.category,
    activationMode: adapter.activationMode,
    status: adapter.status,
    guardrail: adapter.guardrail,
    riskLevel,
    rank: index + 1,
    reason: `${input.capability}: aderência de categoria e risco ${riskLevel} dentro do teto ${input.maxRisk}.`,
    execution: "proposta" as const,
    requiresHumanApproval: true as const,
  }));

  return {
    request: input.request,
    capability: input.capability,
    maxRisk: input.maxRisk,
    rotationOffset: input.rotationOffset,
    totalAdapters: adapters.length,
    eligibleCount: ordered.length,
    excludedCount: adapters.length - ordered.length,
    candidates: ordered,
    policy: {
      execution: "proposta" as const,
      requiresHumanApproval: true as const,
      blockedRisk: "bloqueado" as const,
      note: "A alternância escolhe prioridades de proposta. Nenhum adaptador é executado, instalado, configurado ou recebe credenciais por esta decisão.",
    },
  };
}

export const GOVERNED_ROUTER_RISKS = FUSION_RISK_LEVELS.filter((risk): risk is GovernedRouterRisk => risk !== "bloqueado");
