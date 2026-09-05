import { FUSION_REPOSITORIES, type FusionRepository } from "./fusionCatalog";

export type AdapterActivationMode = "catálogo" | "credencial oficial" | "host autorizado" | "bloqueado";

export type Jbcx19Adapter = {
  id: string;
  repository: string;
  category: FusionRepository["category"];
  contract: string;
  activationMode: AdapterActivationMode;
  activationRequirement: string;
  executableInWebapp: boolean;
  status: "pronto para configurar" | "referência" | "bloqueado";
  guardrail: string;
};

function slug(repository: string) {
  return repository.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function adapterFor(repository: FusionRepository): Jbcx19Adapter {
  if (repository.route === "bloqueado") {
    return {
      id: slug(repository.repository), repository: repository.repository, category: repository.category,
      contract: "Nenhum contrato de execução é permitido.", activationMode: "bloqueado", activationRequirement: "Não aplicável.", executableInWebapp: false, status: "bloqueado", guardrail: repository.guardrail,
    };
  }
  if (repository.repository === "MiniMax-AI/MiniMax-MCP") {
    return {
      id: "minimax-native-media", repository: repository.repository, category: repository.category,
      contract: "Operações MCP/API de mídia para vídeo, imagem, voz e consulta de tarefas.", activationMode: "credencial oficial", activationRequirement: "API key oficial e host documentado pelo provedor.", executableInWebapp: true, status: "pronto para configurar", guardrail: repository.guardrail,
    };
  }
  if (repository.repository === "ollama/ollama") {
    return {
      id: "ollama-native-runtime", repository: repository.repository, category: repository.category,
      contract: "API HTTP local para inferência de modelos abertos.", activationMode: "host autorizado", activationRequirement: "URL de host próprio acessível ao JBC e política de acesso explícita.", executableInWebapp: false, status: "pronto para configurar", guardrail: repository.guardrail,
    };
  }
  if (repository.category === "harness" || repository.category === "agente") {
    return {
      id: slug(repository.repository), repository: repository.repository, category: repository.category,
      contract: "Contrato de tarefas, telemetria e extensões traduzido para eventos do Nexus_Orchestra.", activationMode: "catálogo", activationRequirement: "Revisão de arquitetura antes de qualquer adaptação de runtime.", executableInWebapp: false, status: "referência", guardrail: repository.guardrail,
    };
  }
  if (repository.category === "runtime" || repository.category === "modelo") {
    return {
      id: slug(repository.repository), repository: repository.repository, category: repository.category,
      contract: "Perfil de modelo ou runtime externo descrito no catálogo de capacidades.", activationMode: "host autorizado", activationRequirement: "Infraestrutura própria, compatibilidade de licença e autorização do operador.", executableInWebapp: false, status: "referência", guardrail: repository.guardrail,
    };
  }
  return {
    id: slug(repository.repository), repository: repository.repository, category: repository.category,
    contract: "Metadados e padrões públicos de integração disponíveis para planejamento e catálogo.", activationMode: "catálogo", activationRequirement: "Sem chamada externa até que um adaptador oficial seja selecionado e configurado.", executableInWebapp: false, status: "referência", guardrail: repository.guardrail,
  };
}

export const JBCX19_ADAPTERS = FUSION_REPOSITORIES.map(adapterFor);

export function summarizeJbcx19Adapters(adapters = JBCX19_ADAPTERS) {
  return {
    total: adapters.length,
    configurable: adapters.filter(adapter => adapter.status === "pronto para configurar").length,
    blocked: adapters.filter(adapter => adapter.status === "bloqueado").length,
    referenceOnly: adapters.filter(adapter => adapter.status === "referência").length,
  };
}
