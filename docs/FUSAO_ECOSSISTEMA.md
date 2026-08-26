# Fusão modular do ecossistema

Esta fusão não incorpora nem executa automaticamente os repositórios avaliados. Ela transforma cada fonte em uma **capacidade catalogada**, com licença, commit, rota de integração, risco, proteção e status de conector. O inventário completo, incluindo os commits locais clonados, está em [`fusion-repositories.tsv`](fusion-repositories.tsv).

## Decisão de arquitetura

| Camada | Função no Jhon Bly Cly | Regra operacional |
| --- | --- | --- |
| Catálogo | Exibe finalidade, licença, risco e commit das fontes. | Não importa dependências externas. |
| Adaptador | Prepara contratos para capacidades elegíveis, como mídia MiniMax e padrões de harness. | Não executa código remoto. |
| Conector seguro | Persiste a intenção do usuário de configurar uma fonte elegível. | Mantém status `aguardando credencial`; não armazena segredos. |
| Outbox de fusão | Persiste o envelope `ecosystem.fusion.catalog.synchronized` e tenta entregá-lo ao Nexus_Orchestra. | A falha de entrega é auditável e não bloqueia o workspace. |
| Bloqueio | Recusa fontes de prompts internos/vazados e rotas que possam contornar provedores. | Não copia, indexa, apresenta ou utiliza o conteúdo. |

> **Princípio de segurança:** a fusão reaproveita apenas metadados e padrões arquiteturais revisados. Ela não transforma repositórios clonados em dependências de produção.

## Fontes com rota de adaptação

| Fonte | Capacidade aproveitada | Rota no produto |
| --- | --- | --- |
| [DeepSeek Harness][1] | Organização de extensões e harness em TypeScript. | Padrões para catálogo modular, sem execução dinâmica. |
| [MiniMax MCP][2] | Geração de vídeo, imagem, voz e consulta de tarefas, conforme documentação do projeto. | Perfil BYOK preparado; credencial e host dependem do usuário. |
| [Ollama][3] | Runtime local de modelos abertos. | Perfil de infraestrutura própria, fora do deploy web padrão. |
| [OpenManus][4] | Referência de arquitetura de agentes. | Documentação de planner/executor, sem importar o runtime. |

As fontes com licença não especificada, status arquivado, infraestrutura pesada ou finalidade de referência permanecem no catálogo, mas não são dependências do aplicativo. Fontes que se apresentam como coleções de instruções internas ou acessos alternativos a provedores são classificadas como **bloqueadas** e não entram no runtime.

## Fluxo de sincronização com o Nexus_Orchestra

O botão **Sincronizar** constrói um envelope sem credenciais. O servidor grava o envelope em `fusion_sync_events` antes de tentar a entrega. Se `NEXUS_ORCHESTRA_WEBHOOK_URL` e `NEXUS_ORCHESTRA_WEBHOOK_SECRET` forem configuradas, o envelope é enviado via HTTPS com assinatura HMAC SHA-256. Sem endpoint, o evento recebe o estado `falha` acompanhado de uma explicação, preservando a auditoria.

```json
{
  "source": "jhon-bly-cly-video",
  "schemaVersion": "1.0",
  "eventName": "ecosystem.fusion.catalog.synchronized",
  "summary": {
    "total": 19,
    "safeToAdapt": 2
  }
}
```

## Ativação responsável de conectores

O perfil MiniMax é o único conector audiovisual BYOK preparado nesta entrega. Ele **não está ativo** e não recebe um valor de API key até que o proprietário forneça uma credencial oficial. A infraestrutura Ollama também permanece apenas preparada: exige host persistente e recursos externos. Nenhuma variável de ambiente é criada com dados fictícios.

| Perfil | Estado inicial | Pré-requisito para ativação |
| --- | --- | --- |
| MiniMax Media | `não configurado` / `aguardando credencial` | API key e host oficial compatíveis com a região escolhida. |
| Ollama Local Runtime | `não configurado` / `aguardando credencial` | Host persistente acessível e modelo instalado sob responsabilidade do proprietário. |
| DeepSeek Harness Patterns | `não configurado` / `aguardando credencial` | Aprovação de arquitetura antes de qualquer adaptação de padrão. |
| Fontes de prompts internos | `bloqueado` | Não aplicável. |

## Referências

[1] [DeepSeek Harness — repositório oficial](https://github.com/deepseek-ai/deepseek-harness)

[2] [MiniMax MCP — repositório oficial](https://github.com/MiniMax-AI/MiniMax-MCP)

[3] [Ollama — repositório oficial](https://github.com/ollama/ollama)

[4] [OpenManus — repositório oficial](https://github.com/FoundationAgents/OpenManus)
