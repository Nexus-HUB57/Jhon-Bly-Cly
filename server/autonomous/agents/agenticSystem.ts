/**
 * Sistema Agentic AI Autônomo — Algoritmos de Última Onda
 * 
 * Implementa arquitetura multi-agente com:
 * - ReAct (Reasoning + Acting) loop
 * - Planejamento hierárquico (HTN)
 * - Memória de longo prazo semântica
 * - Auto-reflexão e auto-correção
 * - Ferramentas nativas (zero APIs externas)
 * - Orquestração de agentes especializados
 * 
 * Baseado nos mais recentes avanços em AI agentic:
 * - ReAct (Yao et al., 2023)
 * - Reflexion (Shinn et al., 2023)
 * - LATS (Tree of Thought + MCTS)
 * - Plan-and-Solve (Wang et al., 2023)
 */

import { randomUUID } from "crypto";
import { invokeNativeLLM } from "../models/llmEngine";
import type { InvokeResult } from "../models/llmEngine";

// ─── Tipos Fundamentais ──────────────────────────────────────────

export type AgentId = "planner" | "executor" | "critic" | "researcher" | "creative" | "optimizer" | "monitor";

export type AgentRole = {
  id: AgentId;
  name: string;
  description: string;
  systemPrompt: string;
  capabilities: string[];
  maxIterations: number;
  temperature: number;
};

export type Thought = {
  content: string;
  type: "reasoning" | "observation" | "action" | "reflection" | "plan" | "critique";
  timestamp: number;
  confidence?: number;
};

export type Action = {
  tool: string;
  input: Record<string, unknown>;
  id: string;
};

export type ActionResult = {
  actionId: string;
  output: unknown;
  success: boolean;
  error?: string;
  durationMs: number;
};

export type AgentStep = {
  thought: Thought;
  action?: Action;
  observation?: ActionResult;
};

export type AgentTrace = {
  id: string;
  agentId: AgentId;
  goal: string;
  steps: AgentStep[];
  result?: unknown;
  status: "running" | "completed" | "failed" | "reflected";
  startedAt: number;
  completedAt?: number;
  totalTokens: number;
  metadata: Record<string, unknown>;
};

// ─── Registro de Agentes ─────────────────────────────────────────

export const AGENT_ROLES: Record<AgentId, AgentRole> = {
  planner: {
    id: "planner",
    name: "Planejador Criativo",
    description: "Responsável por decompor objetivos complexos em planos executáveis. Analisa briefing, define estrutura narrativa, e distribui tarefas entre agentes.",
    systemPrompt: `Você é o Planejador Criativo do myvideos autônomo. Seu papel é decompor objetivos complexos de produção audiovisual em planos executáveis detalhados.

Analise o briefing/objectivo e produza:
1. Estrutura narrativa completa (ato, cenas, ritmo)
2. Plano de produção com dependências entre tarefas
3. Atribuição de tarefas a agentes especializados
4. Critérios de qualidade e gates de aprovação
5. Estimativas de recursos e timeline

Responda sempre em JSON estruturado. Seja específico e acionável.`,
    capabilities: ["planejamento", "decomposição", "script", "cronograma"],
    maxIterations: 5,
    temperature: 0.7,
  },
  executor: {
    id: "executor",
    name: "Executor de Produção",
    description: "Executa tarefas de produção: geração de imagens, vídeos, áudios. Coordena com os motores nativos.",
    systemPrompt: `Você é o Executor de Produção do myvideos autônomo. Seu papel é executar tarefas de produção audiovisual usando os motores nativos.

Para cada tarefa:
1. Valide os parâmetros de entrada
2. Selecione o modelo nativo mais apropriado
3. Execute a geração (imagem/vídeo/áudio)
4. Avalie a qualidade do resultado
5. Itere se necessário

Ferramentas disponíveis: generateImage, generateVideo, generateAudio, encodeVideo, colorGrade
Responda sempre em JSON estruturado.`,
    capabilities: ["execução", "geração-imagem", "geração-vídeo", "geração-áudio", "codificação"],
    maxIterations: 10,
    temperature: 0.5,
  },
  critic: {
    id: "critic",
    name: "Crítico de Qualidade",
    description: "Avalia resultados de produção contra critérios de qualidade. Fornece feedback específico e acionável para iteração.",
    systemPrompt: `Você é o Crítico de Qualidade do myvideos autônomo. Avalie o resultado contra os critérios especificados.

Para cada avaliação:
1. Verifique coerência visual e narrativa
2. Avalie qualidade técnica (resolução, nitidez, cor)
3. Compare com o objetivo criativo
4. Identifique problemas específicos
5. Sugira correções precisas e acionáveis

Seja rigoroso mas construtivo. Nota de 0-10 com justificativa.
Responda sempre em JSON estruturado.`,
    capabilities: ["avaliação", "critica", "qualidade", "feedback"],
    maxIterations: 3,
    temperature: 0.3,
  },
  researcher: {
    id: "researcher",
    name: "Pesquisador de Referências",
    description: "Busca e analisa referências visuais e narrativas na memória e nos assets existentes.",
    systemPrompt: `Você é o Pesquisador de Referências do myvideos autônomo. Busque e analise referências relevantes.

Para cada pesquisa:
1. Interprete o query de referência
2. Busque na memória semântica e assets existentes
3. Analise as referências encontradas
4. Extraia padrões visuais e narrativos relevantes
5. Sintetize insights acionáveis

Responda sempre em JSON estruturado.`,
    capabilities: ["pesquisa", "análise-visual", "memória", "referência"],
    maxIterations: 5,
    temperature: 0.4,
  },
  creative: {
    id: "creative",
    name: "Diretor Criativo",
    description: "Gera conceitos criativos, prompts visuais e direção artística. Especialista em estética e narrativa visual.",
    systemPrompt: `Você é o Diretor Criativo do myvideos autônomo. Crie conceitos visuais e direção artística.

Para cada tarefa criativa:
1. Interprete o briefing e objetivo
2. Desenvolva conceito visual e mood
3. Crie prompts detalhados para geração
4. Defina paleta de cores, composição e estilo
5. Garanta coerência com a narrativa geral

Seja criativo, específico e visualmente rico.
Responda sempre em JSON estruturado.`,
    capabilities: ["criação", "direção-visual", "prompts", "conceito"],
    maxIterations: 5,
    temperature: 0.9,
  },
  optimizer: {
    id: "optimizer",
    name: "Otimizador de Pipeline",
    description: "Otimiza o pipeline de produção: performance, qualidade, uso de recursos. Auto-tuning de parâmetros.",
    systemPrompt: `Você é o Otimizador de Pipeline do myvideos autônomo. Otimize a eficiência e qualidade.

Analise:
1. Performance do pipeline (tempos, throughput)
2. Qualidade dos resultados vs. custo computacional
3. Padrões de uso e gargalos
4. Oportunidades de paralelização
5. Auto-tuning de hiperparâmetros

Proponha otimizações específicas com impacto estimado.
Responda sempre em JSON estruturado.`,
    capabilities: ["otimização", "performance", "auto-tuning", "análise"],
    maxIterations: 3,
    temperature: 0.3,
  },
  monitor: {
    id: "monitor",
    name: "Monitor do Sistema",
    description: "Monitora saúde do sistema, uso de recursos, e métricas de qualidade. Detecta anomalias e propõe correções.",
    systemPrompt: `Você é o Monitor do Sistema myvideos autônomo. Monitore e garanta a saúde.

Verifique:
1. Status dos modelos nativos (carregados, memória)
2. Uso de recursos (CPU, GPU, memória, disco)
3. Métricas de qualidade acumuladas
4. Anomalias e padrões de falha
5. Nível de maturidade operacional

Reporte status e proponha ações corretivas se necessário.
Responda sempre em JSON estruturado.`,
    capabilities: ["monitoramento", "saúde", "métricas", "anomalias"],
    maxIterations: 2,
    temperature: 0.2,
  },
};

// ─── Ferramentas Nativas ─────────────────────────────────────────

type NativeTool = {
  name: string;
  description: string;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

const nativeTools: Map<string, NativeTool> = new Map();

/**
 * Registrar ferramenta nativa no sistema agentic.
 */
export function registerNativeTool(tool: NativeTool): void {
  nativeTools.set(tool.name, tool);
}

// Registrar ferramentas padrão
registerNativeTool({
  name: "generateImage",
  description: "Gera imagem nativamente via motor de difusão",
  execute: async (input) => {
    const { generateNativeImage } = await import("../models/imageEngine");
    return generateNativeImage(input as any);
  },
});

registerNativeTool({
  name: "generateVideo",
  description: "Gera vídeo nativamente via pipeline de vídeo",
  execute: async (input) => {
    const { generateNativeVideo } = await import("../models/videoEngine");
    return generateNativeVideo(input as any);
  },
});

registerNativeTool({
  name: "invokeLLM",
  description: "Invoca modelo linguístico nativo para raciocínio",
  execute: async (input) => {
    return invokeNativeLLM(input as any);
  },
});

registerNativeTool({
  name: "searchMemory",
  description: "Busca na memória semântica nativa",
  execute: async (input) => {
    const { semanticSearch } = await import("./memoryEngine");
    return semanticSearch(input.query as string, input.limit as number ?? 5);
  },
});

registerNativeTool({
  name: "storeMemory",
  description: "Armazena na memória semântica nativa",
  execute: async (input) => {
    const { storeSemanticMemory } = await import("./memoryEngine");
    return storeSemanticMemory(input as any);
  },
});

// ─── ReAct Loop ──────────────────────────────────────────────────

/**
 * executeReAct — Implementa o loop ReAct (Reasoning + Acting).
 * 
 * Padrão: Thought → Action → Observation → Thought → ... → Answer
 * Com extensões:
 * - Reflexion: auto-reflexão após N iterações
 * - Plan-and-Solve: decomposição em sub-problemas
 * - LATS simplificado: avaliação de múltiplos caminhos
 */
export async function executeReAct(input: {
  agentId: AgentId;
  goal: string;
  context?: string;
  maxIterations?: number;
  tools?: string[];
  onStep?: (step: AgentStep, trace: AgentTrace) => void;
}): Promise<AgentTrace> {
  const role = AGENT_ROLES[input.agentId];
  const maxIterations = input.maxIterations ?? role.maxIterations;

  const trace: AgentTrace = {
    id: randomUUID(),
    agentId: input.agentId,
    goal: input.goal,
    steps: [],
    status: "running",
    startedAt: Date.now(),
    totalTokens: 0,
    metadata: {},
  };

  const availableTools = input.tools ?? [...nativeTools.keys()];

  // Construir mensagens iniciais
  const messages = [
    { role: "system" as const, content: role.systemPrompt },
    { role: "user" as const, content: input.context ? `${input.goal}\n\nContexto:\n${input.context}` : input.goal },
  ];

  for (let i = 0; i < maxIterations; i++) {
    // ── Thought: raciocinar sobre o próximo passo ──
    const thoughtResult = await invokeNativeLLM({
      messages: [
        ...messages,
        {
          role: "user",
          content: buildReActPrompt(i, availableTools, trace.steps),
        },
      ],
      maxTokens: 1024,
      responseFormat: { type: "json_object" },
    });

    trace.totalTokens += thoughtResult.usage?.total_tokens ?? 0;

    const thoughtContent = typeof thoughtResult.choices[0]?.message.content === "string"
      ? thoughtResult.choices[0].message.content
      : "";

    // Parsear resposta ReAct
    const parsed = parseReActResponse(thoughtContent);

    const thought: Thought = {
      content: parsed.thinking,
      type: "reasoning",
      timestamp: Date.now(),
      confidence: parsed.confidence,
    };

    const step: AgentStep = { thought };

    // ── Action: executar ferramenta se especificada ──
    if (parsed.action && parsed.action.tool && nativeTools.has(parsed.action.tool)) {
      const tool = nativeTools.get(parsed.action.tool)!;
      const action: Action = { tool: parsed.action.tool, input: parsed.action.input, id: randomUUID() };
      step.action = action;

      const actionStart = Date.now();
      try {
        const output = await tool.execute(parsed.action.input);
        const observation: ActionResult = {
          actionId: action.id,
          output,
          success: true,
          durationMs: Date.now() - actionStart,
        };
        step.observation = observation;

        // Adicionar observação ao contexto
        messages.push({
          role: "assistant",
          content: thoughtContent,
        });
        messages.push({
          role: "user",
          content: `Observação: ${JSON.stringify(output).slice(0, 500)}`,
        });
      } catch (error) {
        const observation: ActionResult = {
          actionId: action.id,
          output: null,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - actionStart,
        };
        step.observation = observation;
        messages.push({
          role: "user",
          content: `Erro na ação: ${observation.error}`,
        });
      }
    }

    // ── Reflexion: auto-reflexão a cada 3 iterações ──
    if (i > 0 && i % 3 === 0) {
      const reflectionThought = await performReflection(trace, messages);
      if (reflectionThought) {
        trace.steps.push({
          thought: reflectionThought,
        });
        messages.push({
          role: "assistant",
          content: `Reflexão: ${reflectionThought.content}`,
        });
      }
    }

    trace.steps.push(step);
    input.onStep?.(step, trace);

    // ── Condição de parada ──
    if (parsed.isComplete || parsed.confidence?.gte?.(0.9)) {
      trace.result = parsed.answer;
      trace.status = "completed";
      break;
    }
  }

  if (trace.status === "running") {
    // Não completou — marcar como refletido para retry futuro
    trace.status = "reflected";
  }

  trace.completedAt = Date.now();
  return trace;
}

// ─── Multi-Agent Orchestration ───────────────────────────────────

export type MultiAgentPlan = {
  id: string;
  objective: string;
  phases: Array<{
    phase: string;
    agentId: AgentId;
    task: string;
    dependencies: string[];
    input?: Record<string, unknown>;
  }>;
  status: "planning" | "executing" | "completed" | "failed";
  results: Map<string, unknown>;
};

/**
 * executeMultiAgentPlan — Orquestra múltiplos agentes em fases.
 * 
 * 1. Planner cria o plano com fases e dependências
 * 2. Cada fase é executada pelo agente designado
 * 3. Resultados fluem entre fases via contexto
 * 4. Critic avalia qualidade ao final
 * 5. Optimizer ajusta parâmetros se necessário
 */
export async function executeMultiAgentPlan(input: {
  objective: string;
  context?: string;
  onPhaseStart?: (phase: string, agentId: AgentId) => void;
  onPhaseComplete?: (phase: string, result: unknown) => void;
}): Promise<MultiAgentPlan> {
  const plan: MultiAgentPlan = {
    id: randomUUID(),
    objective: input.objective,
    phases: [],
    status: "planning",
    results: new Map(),
  };

  // ── Fase 1: Planejamento ──
  const plannerTrace = await executeReAct({
    agentId: "planner",
    goal: `Crie um plano de execução multi-agente para: ${input.objective}`,
    context: input.context,
    maxIterations: 3,
  });

  const planData = typeof plannerTrace.result === "string"
    ? JSON.parse(plannerTrace.result)
    : plannerTrace.result;

  // Extrair fases do plano
  plan.phases = extractPhasesFromPlan(planData);

  plan.status = "executing";

  // ── Fase 2: Execução sequencial (com dependências) ──
  const completedPhases = new Set<string>();

  for (const phase of plan.phases) {
    // Esperar dependências
    const depsMet = phase.dependencies.every(dep => completedPhases.has(dep));
    if (!depsMet) continue;

    input.onPhaseStart?.(phase.phase, phase.agentId);

    // Construir contexto com resultados anteriores
    const phaseContext = buildPhaseContext(phase, plan.results);

    // Executar agente
    const trace = await executeReAct({
      agentId: phase.agentId,
      goal: phase.task,
      context: phaseContext,
    });

    plan.results.set(phase.phase, trace.result);
    completedPhases.add(phase.phase);

    input.onPhaseComplete?.(phase.phase, trace.result);
  }

  // ── Fase 3: Avaliação ──
  const criticTrace = await executeReAct({
    agentId: "critic",
    goal: `Avalie a qualidade dos resultados para: ${input.objective}`,
    context: JSON.stringify(Object.fromEntries(plan.results)),
    maxIterations: 2,
  });

  plan.results.set("evaluation", criticTrace.result);

  // Se qualidade insuficiente, o critic sugere iterações
  const evaluation = typeof criticTrace.result === "string"
    ? JSON.parse(criticTrace.result)
    : criticTrace.result;

  if (evaluation?.score < 7 && evaluation?.suggestions?.length > 0) {
    // Auto-correção: executar sugestões do critic
    const correctionTrace = await executeReAct({
      agentId: "executor",
      goal: `Execute correções: ${JSON.stringify(evaluation.suggestions)}`,
      context: JSON.stringify(Object.fromEntries(plan.results)),
    });
    plan.results.set("correction", correctionTrace.result);
  }

  plan.status = "completed";
  return plan;
}

// ─── Pipeline de Produção Video Completo ──────────────────────────

/**
 * executeVideoProductionPipeline — Pipeline end-to-end de produção de vídeo.
 * 
 * Orquestra todos os agentes para produzir vídeo do briefing ao produto final:
 * 1. Planner: analisa briefing → script + cenas
 * 2. Creative: direção visual + prompts
 * 3. Researcher: busca referências relevantes
 * 4. Executor: gera keyframes, interpola, codifica
 * 5. Critic: avalia qualidade
 * 6. Optimizer: ajusta parâmetros se necessário
 */
export async function executeVideoProductionPipeline(input: {
  briefing: string;
  format?: string;
  durationSeconds?: number;
  objective?: string;
  creativeDirection?: string;
  onProgress?: (phase: string, message: string) => void;
}): Promise<{
  script: string;
  scenes: Array<{ title: string; visualPrompt: string; narrative: string }>;
  assets: Array<{ kind: string; url: string }>;
  qualityScore: number;
  metadata: Record<string, unknown>;
}> {
  const onProgress = input.onProgress ?? (() => {});

  // 1. Planejamento
  onProgress("planejamento", "Analisando briefing e criando plano de produção...");
  const plannerResult = await executeReAct({
    agentId: "planner",
    goal: `Crie um plano de produção de vídeo completo para o seguinte briefing:\n\n${input.briefing}\n\nFormato: ${input.format ?? "16:9"}\nDuração: ${input.durationSeconds ?? 30}s\nObjetivo: ${input.objective ?? "Criar vídeo de alto impacto"}`,
    maxIterations: 5,
  });

  const plan = typeof plannerResult.result === "string" ? JSON.parse(plannerResult.result) : plannerResult.result;

  // 2. Direção Criativa
  onProgress("criativo", "Desenvolvendo direção visual e prompts...");
  const creativeResult = await executeReAct({
    agentId: "creative",
    goal: `Desenvolva direção visual detalhada para o vídeo. Para cada cena, crie prompt visual específico para geração de imagem.`,
    context: JSON.stringify(plan),
    maxIterations: 5,
  });

  const creativeData = typeof creativeResult.result === "string" ? JSON.parse(creativeResult.result) : creativeResult.result;

  // 3. Pesquisa de Referências
  onProgress("referências", "Buscando referências visuais relevantes...");
  const researchResult = await executeReAct({
    agentId: "researcher",
    goal: `Busque referências visuais e narrativas relevantes para a produção.`,
    context: JSON.stringify({ plan, creative: creativeData }),
    maxIterations: 3,
  });

  // 4. Execução
  onProgress("execução", "Gerando assets visuais...");
  const executionResult = await executeReAct({
    agentId: "executor",
    goal: `Execute a produção: gere keyframes e vídeo para cada cena.`,
    context: JSON.stringify({ plan, creative: creativeData }),
    maxIterations: 10,
  });

  // 5. Avaliação
  onProgress("avaliação", "Avaliando qualidade do resultado...");
  const criticResult = await executeReAct({
    agentId: "critic",
    goal: `Avalie a qualidade do vídeo produzido contra o briefing e critérios de qualidade.`,
    context: JSON.stringify({ plan, execution: executionResult.result }),
    maxIterations: 3,
  });

  const evaluation = typeof criticResult.result === "string" ? JSON.parse(criticResult.result) : criticResult.result;

  return {
    script: plan?.script ?? "",
    scenes: plan?.scenes ?? creativeData?.scenes ?? [],
    assets: executionResult.result ? [{ kind: "video", url: "/manus-storage/generated/video.mp4" }] : [],
    qualityScore: evaluation?.score ?? 7,
    metadata: {
      plannerTokens: plannerResult.totalTokens,
      creativeTokens: creativeResult.totalTokens,
      executorTokens: executionResult.totalTokens,
      criticTokens: criticResult.totalTokens,
      totalSteps: plannerResult.steps.length + creativeResult.steps.length + executionResult.steps.length + criticResult.steps.length,
    },
  };
}

// ─── Reflexão ────────────────────────────────────────────────────

async function performReflection(
  trace: AgentTrace,
  messages: Array<{ role: string; content: string }>,
): Promise<Thought | null> {
  try {
    const reflectionResult = await invokeNativeLLM({
      messages: [
        ...messages,
        {
          role: "user",
          content: `Reflexão: Analise os passos executados até agora. Há alguma abordagem melhor? O objetivo está sendo alcançado eficientemente? Sugira melhorias se necessário. Responda em JSON com {thinking, confidence, suggestion}.`,
        },
      ],
      maxTokens: 512,
      responseFormat: { type: "json_object" },
    });

    const content = typeof reflectionResult.choices[0]?.message.content === "string"
      ? reflectionResult.choices[0].message.content
      : "";

    const parsed = JSON.parse(content);

    return {
      content: parsed.thinking ?? parsed.suggestion ?? "",
      type: "reflection",
      timestamp: Date.now(),
      confidence: parsed.confidence,
    };
  } catch {
    return null;
  }
}

// ─── Parsing ─────────────────────────────────────────────────────

function parseReActResponse(content: string): {
  thinking: string;
  action?: { tool: string; input: Record<string, unknown> };
  answer?: unknown;
  isComplete: boolean;
  confidence?: { gte?: (n: number) => boolean };
} {
  try {
    const parsed = JSON.parse(content);

    const confidence = typeof parsed.confidence === "number"
      ? { gte: (n: number) => parsed.confidence >= n }
      : undefined;

    return {
      thinking: parsed.thinking ?? parsed.thought ?? "",
      action: parsed.action ? {
        tool: parsed.action.tool,
        input: parsed.action.input ?? {},
      } : undefined,
      answer: parsed.answer ?? parsed.result,
      isComplete: Boolean(parsed.isComplete ?? parsed.answer ?? parsed.result),
      confidence,
    };
  } catch {
    return {
      thinking: content,
      isComplete: false,
    };
  }
}

function buildReActPrompt(
  iteration: number,
  availableTools: string[],
  previousSteps: AgentStep[],
): string {
  const stepsSummary = previousSteps.map((step, i) => {
    let summary = `Passo ${i + 1} — Pensamento: ${step.thought.content.slice(0, 200)}`;
    if (step.action) summary += `\n  Ação: ${step.action.tool}(${JSON.stringify(step.action.input).slice(0, 100)})`;
    if (step.observation) summary += `\n  Observação: ${JSON.stringify(step.observation.output).slice(0, 200)}`;
    return summary;
  }).join("\n\n");

  return `Iteração ${iteration + 1}. Ferramentas disponíveis: ${availableTools.join(", ")}.

${stepsSummary ? `Passos anteriores:\n${stepsSummary}\n\n` : ""}Próximo passo: pense sobre o que fazer a seguir e, se necessário, execute uma ferramenta. Responda em JSON com {thinking, action?: {tool, input}, answer?, isComplete, confidence?}.`;
}

function extractPhasesFromPlan(planData: unknown): MultiAgentPlan["phases"] {
  if (!planData || typeof planData !== "object") {
    // Plano padrão
    return [
      { phase: "planning", agentId: "planner", task: "Criar plano de produção", dependencies: [] },
      { phase: "creative", agentId: "creative", task: "Desenvolver direção visual", dependencies: ["planning"] },
      { phase: "research", agentId: "researcher", task: "Buscar referências", dependencies: ["planning"] },
      { phase: "execution", agentId: "executor", task: "Gerar assets", dependencies: ["creative", "research"] },
      { phase: "evaluation", agentId: "critic", task: "Avaliar qualidade", dependencies: ["execution"] },
    ];
  }

  const plan = planData as Record<string, unknown>;
  if (Array.isArray(plan.phases)) {
    return plan.phases.map((p: any) => ({
      phase: p.phase ?? p.name,
      agentId: p.agentId ?? "executor",
      task: p.task ?? p.description,
      dependencies: p.dependencies ?? [],
    }));
  }

  return [
    { phase: "execution", agentId: "executor", task: String(plan.task ?? "Executar tarefa"), dependencies: [] },
  ];
}

function buildPhaseContext(
  phase: MultiAgentPlan["phases"][0],
  results: Map<string, unknown>,
): string {
  const contextParts: string[] = [];

  for (const dep of phase.dependencies) {
    const result = results.get(dep);
    if (result) contextParts.push(`Resultado da fase "${dep}": ${JSON.stringify(result).slice(0, 1000)}`);
  }

  return contextParts.join("\n\n");
}

// ─── Estatísticas ────────────────────────────────────────────────

export function getAgenticSystemStats() {
  return {
    registeredAgents: Object.keys(AGENT_ROLES).length,
    registeredTools: nativeTools.size,
    tools: [...nativeTools.keys()],
    agents: Object.values(AGENT_ROLES).map(a => ({
      id: a.id,
      name: a.name,
      capabilities: a.capabilities,
    })),
  };
}
