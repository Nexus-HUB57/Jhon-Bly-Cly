export const BIND_LAYER_IDS = [
  "ingestao",
  "orcamento",
  "politica",
  "roteamento",
  "auditoria",
] as const;

export type BindLayerId = (typeof BIND_LAYER_IDS)[number];

export type BindLayer = {
  id: BindLayerId;
  label: string;
  responsibility: string;
  input: string;
  output: string;
  execution: "somente-dados" | "somente-proposta" | "somente-auditoria";
};

export const BIND_BLUEPRINT: readonly BindLayer[] = [
  {
    id: "ingestao",
    label: "Ingestão de intenção",
    responsibility: "Recebe a finalidade e o contexto mínimo do trabalho.",
    input: "intenção revisável",
    output: "pedido normalizado",
    execution: "somente-dados",
  },
  {
    id: "orcamento",
    label: "Orçamento de tokens",
    responsibility: "Aplica limite por requisição, janela UTC e estado de quota.",
    input: "pedido normalizado",
    output: "reserva declarativa",
    execution: "somente-dados",
  },
  {
    id: "politica",
    label: "Política de custo e risco",
    responsibility: "Impede cobrança implícita, troca de credencial e uso de quota não confirmada.",
    input: "reserva declarativa",
    output: "decisão condicionada",
    execution: "somente-proposta",
  },
  {
    id: "roteamento",
    label: "Bind governado",
    responsibility: "Liga capacidade, provedor declarado e 9router em uma proposta determinística.",
    input: "decisão condicionada",
    output: "rota proposta",
    execution: "somente-proposta",
  },
  {
    id: "auditoria",
    label: "Auditoria e outbox",
    responsibility: "Registra a decisão, o motivo e o gate humano sem entregar efeitos externos.",
    input: "rota proposta",
    output: "evidência auditável",
    execution: "somente-auditoria",
  },
];

export type BindProposalInput = {
  capability: string;
  providerId: string;
  requestedTokens: number;
  quotaState: "declarada" | "confirmada" | "desconhecida" | "local";
};

export type BindProposal = BindProposalInput & {
  proposalOnly: true;
  requiresHumanApproval: true;
  mayCharge: false;
  mayRotateCredentials: false;
  mayExecuteProvider: false;
  layers: readonly BindLayerId[];
};

export function createBindProposal(input: BindProposalInput): BindProposal {
  if (!Number.isInteger(input.requestedTokens) || input.requestedTokens < 1) {
    throw new Error("requestedTokens deve ser um inteiro positivo");
  }

  return {
    ...input,
    proposalOnly: true,
    requiresHumanApproval: true,
    mayCharge: false,
    mayRotateCredentials: false,
    mayExecuteProvider: false,
    layers: BIND_LAYER_IDS,
  };
}

export function isBindExecutionBlocked(proposal: BindProposal) {
  return proposal.proposalOnly && !proposal.mayCharge && !proposal.mayRotateCredentials && !proposal.mayExecuteProvider;
}
