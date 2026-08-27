# Orquestração governada do JBC

## Princípios inegociáveis

O JBC trata memória como evidência recuperável, não como instrução executável. Cada ciclo deve ser idempotente, limitado por orçamento e taxa, gravado em auditoria e capaz de ser interrompido. A síntese por LLM pode criar **propostas**, porém alterações de código, credenciais, conectores, publicações e ações externas exigem uma aprovação explícita.

| Controle | Aplicação |
| --- | --- |
| Memória persistente | Documentos, resumos, fontes, versões e escopo de acesso ficam no banco. |
| Recuperação contextual | O agente recebe somente referências permitidas, relevantes e versionadas. |
| Evolução governada | O ciclo cria observações, diagnósticos e propostas; ele não se autoaltera. |
| Segurança | Assinatura HMAC, autenticação de rota, rate limit, idempotência e logs estruturados. |
| Resiliência | Limites de lote, tentativas com recuo, estado de falha e mecanismo de pausa. |

## Modos de execução possíveis

| Modo | Funcionamento | Melhor para |
| --- | --- | --- |
| Ciclo periódico governado | O sistema recebe eventos e executa síntese/avaliação em janelas configuráveis; cada execução termina e persiste o estado. | RAG, consolidação de referências, propostas de melhoria e automações com frequência moderada. |
| Operador contínuo | Um processo único e persistente mantém fila e conexões ativas para eventos de baixa latência. | Polling subminuto, filas contínuas e integrações que exigem resposta 24 horas. |

O segundo modo usa uma instância gerenciada 24/7 com recursos fixos de 1 vCPU e 512 MB. Ele tem custo por uso, com teto estimado de computação de aproximadamente US$ 37,50/mês em uso integral, abatidos os US$ 10 mensais de crédito de uso; tráfego de saída e volume são cobrados à parte. A alternativa periódica é a escolha mais leve quando não há exigência de baixa latência.

## Contrato periódico aprovado

O modo aprovado para o JBC é o **ciclo periódico governado**. A rota agendada apenas seleciona trabalho elegível, executa uma única iteração e encerra. A recorrência será configurada após a publicação de um checkpoint, e o identificador da tarefa ficará persistido no banco; o corpo da requisição não será aceito como fonte de identidade da tarefa.

| Limite | Regra inicial |
| --- | --- |
| Frequência | Uma execução de consolidação por janela configurada, com intervalo mínimo entre ciclos. |
| Concorrência | Apenas um ciclo ativo por escopo de usuário. |
| Lote | Recuperação limitada de evidências e referências por ciclo. |
| Ações | O LLM observa, resume e propõe. Conectores, código, credenciais, publicação e operações externas permanecem bloqueados até aprovação humana. |
| Interrupção | O estado `pausado` impede novas execuções; uma falha fecha o ciclo com diagnóstico auditável. |

## Contrato de eventos do Nexus

O JBC exporá `POST /api/orchestra/events` exclusivamente para envelopes assinados. A carga precisa conter identificador de evento, tipo, instante de emissão e dados. O servidor verifica a assinatura HMAC, rejeita mensagens antigas, valida o formato, remove campos sensíveis do registro e armazena o identificador de idempotência antes de encaminhar o conteúdo para a trilha de auditoria.

> O material recebido do Nexus, de conectores ou de referências é sempre tratado como dado não confiável. Ele nunca habilita varredura de segredos, execução dinâmica de comandos, instalação automática ou alteração autônoma do código.

## Evidências de validação

Em 26 de agosto de 2026, a rota protegida `/orchestration` foi aberta com a sessão autenticada do administrador. A tela carregou o dashboard, os cinco provedores ativos, os três provedores mantidos inativos e os adaptadores catalogados, além de mostrar o estado de agendamento pendente de publicação.

Uma execução manual do ciclo também foi deliberadamente contida quando a síntese LLM retornou indisponibilidade por cota. O run terminou em `com falha`, sem acionar efeitos externos; a interface passou a exibir uma mensagem de recuperação segura. Esse resultado confirma a contenção do fluxo, mas não substitui uma síntese bem-sucedida quando o provedor estiver disponível.

O smoke test autenticado também exercitou, em modo de desenvolvimento, a falha visual do dashboard. A página exibiu a mensagem de indisponibilidade e o botão **Tentar novamente**; ao acioná-lo, a rota removeu a condição de teste e retornou à visualização normal autenticada. A simulação é restrita ao modo de desenvolvimento e não integra o build de produção.

O mesmo mecanismo de teste exibiu, na sessão autenticada, a mensagem de indisponibilidade da consulta de provedores sem ocultar os adaptadores já carregados. A tela apresentou sua ação de nova tentativa; a validação interativa completa continuará no próximo ciclo de revisão visual.

Na validação interativa, a ação **Tentar novamente** do cartão de provedores removeu a condição de falha de desenvolvimento e restaurou a lista com cinco provedores ativos e três inativos. Nenhuma configuração de provedor foi alterada durante o teste.

Por fim, a consulta de adaptadores foi submetida ao mesmo cenário autenticado de falha no modo de desenvolvimento. A mensagem de erro e a ação de nova tentativa foram exibidas; o acionamento restaurou a lista catalogada de adaptadores. Esse exercício não alterou perfis, credenciais, hosts ou permissões.

## Pulse interno protegido: maturidade operacional

O **Pulse interno protegido** é um painel administrativo de governança. Ele consolida evidências, memórias curadas e propostas revisadas em um indicador de maturidade operacional entre 0 e 100. O indicador possui os níveis `observação`, `orientação`, `proposta` e `revisão`; contudo, o teto técnico de autonomia permanece em **proposta**. Assim, maior experiência só melhora a qualidade das recomendações e da triagem de contexto. Ela não permite ativar conectores, executar ferramentas, alterar código, configurar credenciais, acessar recursos remotos ou publicar versões sem aprovação humana.

As designações Nexus Sidian, Obsidian Vault, 9router, 9remote, MarketplaceHub e Agent Apps são registradas como **contratos de catálogo**. Elas ficam inativas, sem endpoint e sem permissão de execução até que o proprietário forneça documentação oficial, método de autenticação, escopo de dados e aprovação administrativa. O painel registra somente propostas e auditorias; nenhum arquivo local, token, conector, aplicativo GitHub ou ferramenta externa é lido, instalado ou invocado por essa camada.

Durante a validação autenticada do painel, o Pulse interno exibiu índice de maturidade em `observação`, teto em `observação`, os seis contratos de catálogo como inativos e os quatro papéis do Core. Planner, Executor, Monitor e Optimizer mostraram explicitamente seus limites: recuperação de contexto, intenção auditável, observação de estado e sugestão de melhoria, respectivamente; em nenhum caso houve permissão de execução externa.

No mesmo teste visual, os contratos 9router, 9remote, Agent Apps e MarketplaceHub exibiram risco alto e o estado `catálogo`. As únicas ações expostas foram solicitar revisão e registrar proposta; nenhuma oferecia ativação, acesso remoto, instalação ou chamada externa.

O smoke test autenticado também acionou os controles de Planner e Executor. O Planner registrou uma recuperação contextual com zero evidências, mantendo o estado `aguardando evidências`. O Executor registrou a intenção de avaliar o contrato do Nexus Sidian; a operação ficou `bloqueada` e confirmou visualmente que nenhuma chamada externa foi executada. Ambos os registros passaram a constar na trilha auditável com papel, evento, status, horário e contagem de evidências.

Na sequência, Monitor registrou uma inspeção manual com estado `observando`, e Optimizer registrou uma observação de melhoria com estado `aguardando revisão`. A trilha passou a conter os quatro papéis, todos com zero efeitos externos, sem alteração de código, credenciais, conectores ou políticas. Essa execução usa somente o armazenamento autenticado do Studio e não habilita autonomia irrestrita.
