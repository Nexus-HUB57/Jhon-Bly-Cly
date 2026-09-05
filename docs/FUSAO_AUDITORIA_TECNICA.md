# Auditoria técnica da fusão do ecossistema

## Escopo e método

Foram clonados **19 repositórios** em uma área isolada, com profundidade mínima de histórico. A verificação foi **passiva**: foram inspecionados commit, estado Git, licença declarada, estrutura de diretórios e manifestos de dependência. Nenhum instalador, script, binário, servidor, modelo ou código de terceiros foi executado durante a auditoria.

> Todos os clones estavam em estado Git `clean` no momento do inventário. A fusão no Studio JBC representa metadados, contratos, testes e adaptadores explícitos; ela não adiciona automaticamente esses repositórios ao runtime de produção.

## Inventário end to end

| Fonte | Commit auditado | Evidências estáticas | Destino na fusão |
| --- | --- | --- | --- |
| FoundationAgents/OpenManus | `3309bf4` | `Dockerfile`, `requirements.txt`, `LICENSE`, documentação multilíngue | Referência de arquitetura de agentes. |
| songguoxs/gpt4o-image-prompts | `c282b67` | `README.md` | Catálogo conceitual de padrões visuais; sem redistribuição de prompts. |
| openinterpreter/openinterpreter | `5b07159` | `Cargo.toml`, `pyproject.toml`, `package.json`, `Dockerfile` | Referência bloqueada para execução local arbitrária. |
| MoonshotAI/Kimi-K3 | `3cb39df` | `LICENSE`, `README.md` | Registro de modelo; sem peso ou runtime incorporado. |
| FareedKhan-dev/kimi-k3-in-c | `117e9d2` | `Makefile`, `pyproject.toml`, `LICENSE` | Referência experimental fora do deploy web. |
| unslothai/unsloth | `177a57b` | `pyproject.toml`, `package.json`, licenças | Treino/inferência futura apenas em infraestrutura dedicada. |
| openai/plugins-quickstart | `0763ac2` | `requirements.txt`, `LICENSE`, arquivado | Referência histórica de manifesto; não é dependência ativa. |
| asgeirtj/system_prompts_leaks | `c5ff66a` | conteúdo de prompts internos declarado | Bloqueado; não copiado, indexado ou exibido. |
| xtekky/gpt4free | `5362ba5` | `Dockerfile`, `go.mod`, requisitos Python | Bloqueado por risco de conformidade de provedores. |
| xai-org/grok-1 | `7050ed2` | `pyproject.toml`, requisitos, licença | Referência de modelo; sem inferência no webapp. |
| xai-org/grok-build | `77cd7eb` | `Cargo.toml`, `LICENSE` | Referência de harness e telemetria. |
| anthropics/claude-code | `005c5da` | `Dockerfile`, documentação e licença declarada | Catálogo de capacidade; sem CLI ou instruções internas. |
| shareAI-lab/learn-claude-code | `0dcafa2` | `requirements.txt`, `package.json`, licença | Referência didática de loop agentic. |
| Alishahryar1/free-claude-code | `ecaf236` | `pyproject.toml`, licença | Bloqueado por risco de acesso não autorizado a provedores. |
| hesreallyhim/awesome-claude-code | `b15421c` | requisitos, Makefile, documentos curados | Fonte de descoberta, com revisão individual obrigatória. |
| deepseek-ai/deepseek-harness | `b150a55` | `package.json`, licença, estrutura TypeScript | Padrões adaptáveis de plugin e harness. |
| MiniMax-AI/MiniMax-MCP | `0856b9a` | `pyproject.toml`, licença e documentação MCP | Adaptador audiovisual BYOK preparado no Studio JBC. |
| ollama/ollama | `91cf995` | `go.mod`, `Dockerfile`, licença | Perfil de infraestrutura própria fora do deploy web. |
| x1xhlol/system-prompts-and-models-of-ai-tools | `1e4203a` | conteúdo de prompts internos declarado | Bloqueado; não copiado, indexado ou exibido. |

## Evidências de integração no Studio JBC

| Camada | Arquivos do produto | Validação |
| --- | --- | --- |
| Catálogo de fontes e risco | `shared/fusionCatalog.ts`, `server/routers/fusion.ts` | Rotas protegidas para listar, filtrar e gerar envelope. |
| Conectores seguros | `fusion_connector_profiles`, `fusion.ts` | Perfis com estados de configuração; bloqueios aplicados no servidor. |
| Sincronização | `fusion_sync_events`, `server/orchestra.ts` | Outbox persistente e tentativa de webhook HMAC opcional. |
| Interface | `client/src/pages/EcosystemFusion.tsx` | Catálogo, filtros, conectores BYOK e botão de sincronização. |
| Proteção contra fontes sensíveis | `server/fusion-catalog.test.ts`, `server/fusion.router.test.ts` | Testes impedem preparar conectores bloqueados. |

## Resultado da auditoria

A fusão é **modular e rastreável**, não uma mesclagem de bases de código incompatíveis. As fontes aptas são limitadas a contratos e padrões revisados. Fontes com licença não especificada, runtime de alto custo, acesso local arbitrário ou conteúdo interno/vazado permanecem em referência, aguardando infraestrutura própria, ou bloqueadas.

## Referências

[1] [Inventário de repositórios e commits](fusion-repositories.tsv)

[2] [Arquitetura da fusão modular](FUSAO_ECOSSISTEMA.md)
