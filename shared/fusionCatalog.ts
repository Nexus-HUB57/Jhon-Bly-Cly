export const FUSION_RISK_LEVELS = ["baixo", "médio", "alto", "bloqueado"] as const;
export type FusionRiskLevel = (typeof FUSION_RISK_LEVELS)[number];

export const FUSION_ROUTES = [
  "catálogo",
  "adaptador",
  "referência",
  "bloqueado",
] as const;
export type FusionRoute = (typeof FUSION_ROUTES)[number];

export type FusionRepository = {
  repository: string;
  url: string;
  commit: string;
  license: string;
  language: string;
  archived: boolean;
  category: "agente" | "prompt" | "modelo" | "harness" | "mcp" | "runtime" | "referência";
  route: FusionRoute;
  risk: FusionRiskLevel;
  purpose: string;
  integration: string;
  guardrail: string;
};

export type FusionConnector = {
  id: string;
  name: string;
  provider: string;
  repository: string;
  capabilities: string[];
  credentialMode: "BYOK" | "infraestrutura própria";
  configurationStatus: "elegível" | "bloqueado";
  rationale: string;
  guardrail: string;
};

export const FUSION_REPOSITORIES: FusionRepository[] = [
  { repository: "FoundationAgents/OpenManus", url: "https://github.com/FoundationAgents/OpenManus", commit: "3309bf4", license: "MIT", language: "Python", archived: false, category: "agente", route: "referência", risk: "médio", purpose: "Referência arquitetural para orquestração agentic aberta.", integration: "Mapear padrões de planner, executor e memória sem copiar runtime Python para o webapp.", guardrail: "Não executar agentes externos dentro do servidor web; usar apenas princípios de arquitetura documentados." },
  { repository: "songguoxs/gpt4o-image-prompts", url: "https://github.com/songguoxs/gpt4o-image-prompts", commit: "c282b67", license: "UNSPECIFIED", language: "JavaScript", archived: false, category: "prompt", route: "catálogo", risk: "médio", purpose: "Coleção de prompts visuais para geração de imagem.", integration: "Servir como inspiração categorizada para prompts de storyboard, sem redistribuir conteúdo integral sem licença clara.", guardrail: "Licença não especificada; usar apenas metadados e padrões genéricos de prompt engineering." },
  { repository: "openinterpreter/openinterpreter", url: "https://github.com/openinterpreter/openinterpreter", commit: "5b07159", license: "Apache-2.0", language: "Rust", archived: false, category: "agente", route: "referência", risk: "alto", purpose: "Agente de código que interage com ambientes locais.", integration: "Inspirar uma futura ponte controlada de tarefas, isolada do runtime do produto.", guardrail: "Não conceder execução arbitrária de comandos pelo aplicativo; qualquer execução deve exigir ambiente dedicado e permissões explícitas." },
  { repository: "MoonshotAI/Kimi-K3", url: "https://github.com/MoonshotAI/Kimi-K3", commit: "3cb39df", license: "NOASSERTION", language: "UNSPECIFIED", archived: false, category: "modelo", route: "catálogo", risk: "médio", purpose: "Referência de modelo frontier aberto da MoonshotAI.", integration: "Registrar como opção de modelo externo para planejamento futuro, dependendo de licença e infraestrutura.", guardrail: "Sem licença assertiva; não incorporar pesos, código ou prompts proprietários." },
  { repository: "FareedKhan-dev/kimi-k3-in-c", url: "https://github.com/FareedKhan-dev/kimi-k3-in-c", commit: "117e9d2", license: "Apache-2.0", language: "C", archived: false, category: "runtime", route: "referência", risk: "alto", purpose: "Inferência Kimi em C para CPU.", integration: "Registrar como alternativa experimental fora do WebDev para ambientes dedicados.", guardrail: "Não compilar nem executar runtime C no servidor do workspace; requer validação de recursos e segurança." },
  { repository: "unslothai/unsloth", url: "https://github.com/unslothai/unsloth", commit: "177a57b", license: "Apache-2.0", language: "Python", archived: false, category: "runtime", route: "referência", risk: "alto", purpose: "Treino e execução local de LLMs e modelos de difusão.", integration: "Planejar integração futura apenas via ambiente especializado para treinamento ou fine-tuning.", guardrail: "Treinamento e inferência pesada não cabem no runtime web padrão; não instalar dependências GPU no aplicativo." },
  { repository: "openai/plugins-quickstart", url: "https://github.com/openai/plugins-quickstart", commit: "0763ac2", license: "MIT", language: "Python", archived: true, category: "referência", route: "referência", risk: "baixo", purpose: "Exemplo histórico de plugin e manifesto de integração.", integration: "Aproveitar o padrão de manifesto para descrever capacidades exportáveis do ecossistema.", guardrail: "Repositório arquivado; usar apenas como referência de contrato e não como dependência ativa." },
  { repository: "asgeirtj/system_prompts_leaks", url: "https://github.com/asgeirtj/system_prompts_leaks", commit: "c5ff66a", license: "CC0-1.0", language: "JavaScript", archived: false, category: "prompt", route: "bloqueado", risk: "bloqueado", purpose: "Coleção declarada de prompts de sistema vazados.", integration: "Não integrar conteúdo; registrar apenas como fonte bloqueada por segurança e ética operacional.", guardrail: "Não copiar, exibir, indexar ou reutilizar prompts internos/vazados de terceiros." },
  { repository: "xtekky/gpt4free", url: "https://github.com/xtekky/gpt4free", commit: "5362ba5", license: "GPL-3.0", language: "Python", archived: false, category: "agente", route: "bloqueado", risk: "bloqueado", purpose: "Coleção de provedores alternativos para acesso a modelos.", integration: "Não integrar; incompatível com política de credenciais, conformidade e estabilidade de provedor.", guardrail: "Evitar rotas que contornem termos de serviço, credenciais ou limites de provedores." },
  { repository: "xai-org/grok-1", url: "https://github.com/xai-org/grok-1", commit: "7050ed2", license: "Apache-2.0", language: "Python", archived: false, category: "modelo", route: "referência", risk: "alto", purpose: "Release aberto de modelo Grok.", integration: "Catalogar como referência de modelo e requisitos de infraestrutura.", guardrail: "Não hospedar pesos ou inferência pesada no aplicativo web; integrar somente via serviço externo autorizado." },
  { repository: "xai-org/grok-build", url: "https://github.com/xai-org/grok-build", commit: "77cd7eb", license: "Apache-2.0", language: "Rust", archived: false, category: "harness", route: "referência", risk: "médio", purpose: "Harness e TUI de agente de código extensível.", integration: "Inspirar padrões de execução, telemetria e UI de missão sem importar runtime interativo.", guardrail: "Não habilitar execução terminal arbitrária dentro do workspace." },
  { repository: "anthropics/claude-code", url: "https://github.com/anthropics/claude-code", commit: "005c5da", license: "UNSPECIFIED", language: "Python", archived: false, category: "agente", route: "catálogo", risk: "médio", purpose: "Ferramenta agentic de codificação em terminal.", integration: "Registrar capacidades compatíveis com trilhas de desenvolvimento e revisão de código.", guardrail: "Licença não especificada; não empacotar código, executar CLI ou reproduzir instruções internas." },
  { repository: "shareAI-lab/learn-claude-code", url: "https://github.com/shareAI-lab/learn-claude-code", commit: "0dcafa2", license: "MIT", language: "Python", archived: false, category: "harness", route: "referência", risk: "médio", purpose: "Harness didático inspirado em agentes de código.", integration: "Aproveitar padrões conceituais de loop agentic para documentação do Orchestra.", guardrail: "Não executar scripts externos no servidor; avaliar trechos manualmente antes de qualquer adaptação." },
  { repository: "Alishahryar1/free-claude-code", url: "https://github.com/Alishahryar1/free-claude-code", commit: "ecaf236", license: "MIT", language: "Python", archived: false, category: "agente", route: "bloqueado", risk: "bloqueado", purpose: "Ferramenta que promete acesso gratuito a serviços de agentes.", integration: "Não integrar; risco de conformidade, credenciais e termos de serviço.", guardrail: "Usar apenas APIs autorizadas e credenciais fornecidas de forma explícita pelo usuário." },
  { repository: "hesreallyhim/awesome-claude-code", url: "https://github.com/hesreallyhim/awesome-claude-code", commit: "b15421c", license: "NOASSERTION", language: "Python", archived: false, category: "referência", route: "catálogo", risk: "baixo", purpose: "Lista curada de recursos e plugins relacionados a agentes de código.", integration: "Catalogar como fonte de descoberta para futuras integrações avaliadas individualmente.", guardrail: "Não importar itens transitivos sem revisar licença, manutenção e segurança." },
  { repository: "deepseek-ai/deepseek-harness", url: "https://github.com/deepseek-ai/deepseek-harness", commit: "b150a55", license: "MIT", language: "TypeScript", archived: false, category: "harness", route: "adaptador", risk: "baixo", purpose: "Harness TypeScript orientado a plugins.", integration: "Usar como referência direta para um catálogo modular de capacidades plugáveis no workspace.", guardrail: "Adaptar padrões, não copiar módulos sem revisão; manter sandbox sem execução dinâmica." },
  { repository: "MiniMax-AI/MiniMax-MCP", url: "https://github.com/MiniMax-AI/MiniMax-MCP", commit: "0856b9a", license: "MIT", language: "Python", archived: false, category: "mcp", route: "adaptador", risk: "médio", purpose: "Servidor MCP oficial para TTS, imagem e geração de vídeo MiniMax.", integration: "Preparar conector conceitual para geração de vídeo quando o usuário fornecer API key e host corretos.", guardrail: "Sem chave do usuário, operar apenas em modo catálogo; não criar connector com placeholders." },
  { repository: "ollama/ollama", url: "https://github.com/ollama/ollama", commit: "91cf995", license: "MIT", language: "Go", archived: false, category: "runtime", route: "referência", risk: "alto", purpose: "Runtime local para modelos abertos.", integration: "Registrar como backend local opcional fora do WebDev para usuários com infraestrutura própria.", guardrail: "Requer processo persistente e recursos próprios; não acoplar ao deploy web padrão." },
  { repository: "x1xhlol/system-prompts-and-models-of-ai-tools", url: "https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools", commit: "1e4203a", license: "GPL-3.0", language: "UNSPECIFIED", archived: false, category: "prompt", route: "bloqueado", risk: "bloqueado", purpose: "Coleção declarada de prompts e ferramentas internas de produtos de IA.", integration: "Não integrar conteúdo; registrar bloqueio por segurança e proteção de instruções internas.", guardrail: "Não copiar, expor, indexar ou derivar prompts internos/vazados." },
];

export const FUSION_CONNECTORS: FusionConnector[] = [
  {
    id: "minimax-media",
    name: "MiniMax Media",
    provider: "MiniMax",
    repository: "MiniMax-AI/MiniMax-MCP",
    capabilities: ["vídeo por prompt", "consulta de geração", "imagem", "TTS"],
    credentialMode: "BYOK",
    configurationStatus: "elegível",
    rationale: "Servidor MCP oficial com escopo audiovisual compatível com o pipeline de vídeo.",
    guardrail: "Exige API key e host fornecidos pelo usuário; nenhuma credencial é armazenada no catálogo ou enviada ao navegador.",
  },
  {
    id: "ollama-local",
    name: "Ollama Local Runtime",
    provider: "Ollama",
    repository: "ollama/ollama",
    capabilities: ["LLM local", "modelos abertos", "inferência privada"],
    credentialMode: "infraestrutura própria",
    configurationStatus: "elegível",
    rationale: "Runtime local para modelos abertos que pode operar como backend externo do Orchestra.",
    guardrail: "Requer host persistente e recursos próprios; não é executado dentro do deploy web padrão.",
  },
  {
    id: "deepseek-harness-patterns",
    name: "DeepSeek Harness Patterns",
    provider: "DeepSeek",
    repository: "deepseek-ai/deepseek-harness",
    capabilities: ["arquitetura de plugins", "harness", "telemetria"],
    credentialMode: "infraestrutura própria",
    configurationStatus: "elegível",
    rationale: "Referência TypeScript para contratos de plugin e extensão do orquestrador.",
    guardrail: "É uma fonte de padrão arquitetural; não executa código remoto nem concede ferramentas dinâmicas.",
  },
  {
    id: "prompt-leaks-blocklist",
    name: "Fontes de prompts internos",
    provider: "Bloqueio de segurança",
    repository: "asgeirtj/system_prompts_leaks + x1xhlol/system-prompts-and-models-of-ai-tools",
    capabilities: ["nenhuma"],
    credentialMode: "infraestrutura própria",
    configurationStatus: "bloqueado",
    rationale: "Fontes declaradas de prompts internos ou vazados não são uma integração permitida.",
    guardrail: "Conteúdo não é copiado, exibido, indexado ou usado para instruir agentes.",
  },
];

export function getFusionConnector(id: string) {
  return FUSION_CONNECTORS.find(connector => connector.id === id);
}

export function isFusionConnectorEligible(id: string) {
  return getFusionConnector(id)?.configurationStatus === "elegível";
}

export function summarizeFusionCatalog(items = FUSION_REPOSITORIES) {
  return {
    total: items.length,
    byRoute: Object.fromEntries(FUSION_ROUTES.map(route => [route, items.filter(item => item.route === route).length])),
    byRisk: Object.fromEntries(FUSION_RISK_LEVELS.map(risk => [risk, items.filter(item => item.risk === risk).length])),
    safeToAdapt: items.filter(item => item.route === "adaptador").length,
    blocked: items.filter(item => item.route === "bloqueado").length,
  };
}

export function createFusionSyncEnvelope() {
  return {
    source: "jhon-bly-cly-video",
    schemaVersion: "1.0",
    eventName: "ecosystem.fusion.catalog.synchronized",
    occurredAt: new Date().toISOString(),
    summary: summarizeFusionCatalog(),
    repositories: FUSION_REPOSITORIES.map(({ repository, url, commit, license, category, route, risk, purpose, integration, guardrail }) => ({
      repository,
      url,
      commit,
      license,
      category,
      route,
      risk,
      purpose,
      integration,
      guardrail,
    })),
  };
}
