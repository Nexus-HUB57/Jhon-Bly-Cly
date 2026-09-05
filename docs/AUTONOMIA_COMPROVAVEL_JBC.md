# Autonomia comprovável do JBC

## Escopo verificado

O JBC possui uma arquitetura própria de aplicação: interface React/TypeScript, backend Express/tRPC, banco de dados, armazenamento de ativos, estados auditáveis de projeto, controle de referências, planejamento manual, registro de runs e trilha do Nexus_Orchestra. A inspeção estática contabilizou **155 arquivos TypeScript/TSX** e **32 testes de servidor** no workspace. O catálogo de fusão também possui **19 repositórios de referência** locais e **98 manifestos `SKILL.md`** nesses repositórios; esse número não comprova, por si só, que os skills são compatíveis, licenciados para incorporação ou executáveis no runtime do JBC.

> Autonomia arquitetural significa que o JBC governa seu fluxo, seus dados, sua auditoria e suas decisões de aprovação. Ela não equivale a inferência de imagem ou vídeo local quando o código encaminha a geração para um serviço de modelo externo.

## Situação operacional atual

| Capacidade | Implementação atual comprovada | Dependência que permanece | Conclusão |
| --- | --- | --- | --- |
| Gestão de projetos, cenas, referências, runs e auditoria | Backend JBC, banco e armazenamento próprios. | Nenhuma dependência de modelo para registrar e revisar o fluxo. | **Interna ao Studio.** |
| Planejamento audiovisual | O Studio produz e revisa um plano, mantendo o estado e a trilha de auditoria. | O planejamento automático usa uma chamada de modelo; o plano manual continua disponível sem ela. | **Governado pelo JBC; inferência automática depende de modelo.** |
| Geração de imagem de referência | A rota chama o serviço de imagem configurado via Forge e armazena o resultado no storage do JBC. | Serviço de inferência de imagem externo ao runtime do app. | **Orquestração interna; inferência não é local.** |
| Vídeo KTD | O adaptador próprio do JBC valida referências, cria uma tarefa MiniMax-H3, persiste o `taskId` e faz polling manual. | API MiniMax, credencial e saldo disponível. | **Pipeline interno; geração de vídeo depende do provedor.** |
| 9router | Política pura, determinística e auditável que classifica referências e registra propostas. | Não executa adaptadores, não usa chaves e não produz mídia. | **Interno e governado, não é motor de inferência.** |

## Fusão dos 19 repositórios

O catálogo já incorpora de maneira segura os metadados dos 19 repositórios, classificando finalidade, licença, risco, rota permitida e guardrail. Apenas dois são classificados como padrões de adaptação, enquanto três permanecem bloqueados por conterem ou facilitarem conteúdo/rotas incompatíveis com as regras de segurança. Repositórios de runtime ou modelo requerem infraestrutura própria, recursos de computação e validação de licença antes de qualquer uso. Copiar árvores de arquivos indiscriminadamente não transforma um webapp em runtime de modelos, não concede direitos de redistribuição e introduziria risco de dependências conflitantes ou execução não revisada.

| Classe de referência | Tratamento no JBC | Exemplo de uso permitido |
| --- | --- | --- |
| Padrão arquitetural licenciado | Adaptação manual, estática e testada de conceitos. | Contratos de telemetria e catálogo de capacidades. |
| Runtime/modelo | Catálogo e requisitos de host; sem instalação no webapp. | Especificar uma futura infraestrutura própria após validação de recursos e licença. |
| MCP/API oficial | Adaptador server-side submetido a credencial, contrato e aprovação. | Criar uma tarefa de mídia pelo backend após o operador aprovar. |
| Conteúdo ou rota bloqueada | Não copiar, indexar, executar ou usar como fallback. | Nenhum. |

## Caminhos viáveis para maior independência

| Abordagem | Resultado | Custo e requisitos | Limite principal |
| --- | --- | --- | --- |
| **Autonomia de controle no JBC** | Manter no Studio as decisões, dados, políticas, auditoria e propostas de fallback. | Já compatível com o ambiente atual; não requer executar código de terceiros. | Não substitui inferência de mídia. |
| **Inferência própria em infraestrutura do proprietário** | Conectar o JBC a um host autorizado que execute modelos abertos com pesos e recursos licenciados. | Exige host persistente, capacidade compatível com os modelos, escolha de pesos/licenças e autenticação entre JBC e host. | O ambiente web gerenciado possui teto de 1 vCPU / 512 MB e não hospeda esse tipo de inferência pesada. |
| **Provedores externos aprovados como fallback** | Preservar o JBC como controlador e usar um provedor apenas para inferência específica autorizada. | Exige contrato oficial, credencial no cofre, saldo/cota e aprovação por operação. | Mantém dependência de serviço externo para a produção de mídia. |

A incorporação segura recomendada limita-se, nesta etapa, a uma **matriz interna de autonomia** e a contratos estáticos de decisão. A implementação de um runtime de geração de alta qualidade exige que o proprietário selecione o modelo aberto, confirme a licença dos pesos e disponibilize uma infraestrutura com recursos adequados; nenhum dos 19 repositórios fornece, por si só, esses três elementos ao JBC.

## Evidências internas

- `server/routers/video.ts` registra que a solicitação de vídeo usa `createMiniMaxVideoTask` e que imagens chamam o serviço configurado de imagem.
- `server/minimax.ts` define o cliente de vídeo MiniMax-H3 e exige provedor ativo e credencial protegida.
- `server/_core/imageGeneration.ts` encaminha a imagem para `ImageService/GenerateImage` e armazena somente o resultado no JBC.
- `shared/fusionCatalog.ts`, `shared/jbcx19Adapters.ts` e `shared/governedRouter.ts` classificam os 19 repositórios e restringem o 9router a proposta auditável.
