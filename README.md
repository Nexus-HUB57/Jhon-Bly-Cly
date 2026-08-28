# Jhon Bly Cly Video Studio

O **Jhon Bly Cly Video Studio** é um workspace autenticado para transformar briefings em um fluxo audiovisual revisável. A aplicação concentra o ciclo de planejamento, roteirização, cenas, storyboard, ativos, solicitação de geração, exportação e eventos de orquestração em uma única interface operacional.

## O que foi implementado

| Área | Entrega |
| --- | --- |
| Projetos | Criação, listagem e abertura de projetos com briefing, formato, duração, idioma, objetivo e direção criativa. |
| Planejamento por IA | Geração server-side de roteiro, resumo criativo, divisão de cenas e prompts editáveis para produção e storyboard. |
| Revisão | Edição de cenas, prompts, narrativa e orientação de câmera antes do pedido de geração. |
| Referências | Biblioteca global de áudio, vídeo, imagem, texto e documentos, com limite de 50 MB por arquivo e metadados auditáveis. |
| Biblioteca | Upload seguro em S3, associação a projetos e cenas e consulta de ativos armazenados. |
| Execução | Histórico de execuções para planejamento, imagens, vídeo e exportação. |
| Exportação | Manifesto JSON de produção armazenado com todos os metadados do projeto. |
| Orquestração | Registro de eventos de domínio, 9router em modo de proposta e adaptador opcional de entrega assinada para o Nexus_Orchestra. |

> Os estados de tarefa são restritos a: `rascunho`, `planejando`, `aguardando revisão`, `gerando`, `concluído` e `com falha`.

## Adaptador audiovisual autorizado

O adaptador server-side autorizado para vídeo é o **MiniMax-H3**, acessado exclusivamente pelo backend JBC. Ele valida duração, formato, URLs HTTP(S) das referências, limites de imagens e duração dos áudios antes de criar uma tarefa. A consulta de andamento ocorre pelo backend e os resultados são persistidos como ativos e eventos auditáveis.

A credencial oficial é lida somente do armazenamento protegido do ambiente (`MINIMAX_API_KEY`); seu valor nunca deve ser gravado no código, no README, em commits ou em logs. A configuração do conector MiniMax na sessão permanece pendente de confirmação administrativa. Habilitar o conector não equivale a confirmar saldo, gratuidade ou autorização para cobrança.

O adaptador não executa repositórios de terceiros, não usa prompts expostos, não faz varredura de tokens, não alterna credenciais e não repete tarefas automaticamente. O 9router pode registrar uma proposta de alternativa, mas atualmente o catálogo possui apenas um candidato audiovisual compatível; agentes de planejamento ou referências não são tratados como geradores de vídeo.

## Próxima tarefa prioritária

A prioridade imediata indicada pelo `todo.md` é **planejar e revisar o projeto KTD Reels no próprio backend JBC**, levando-o de `rascunho` para `aguardando revisão`. Somente depois dessa revisão e da confirmação de disponibilidade contratual do MiniMax poderá ser avaliada uma única tentativa de vídeo de 8 segundos. Se o saldo continuar insuficiente, o Studio deve registrar a falha e a proposta governada, sem cobrança, reenvio ou fallback em cascata.

## Governança e segurança

Toda ação externa é limitada, autenticada, auditável e condicionada à aprovação humana. O registro de uma proposta 9router não executa adaptadores. Publicação e Heartbeat permanecem separados da geração audiovisual e não são habilitados por este README.

O blueprint de núcleos de bind, o inventário de referências públicas e a validação da tentativa KTD estão em [`docs/BLUEPRINT_NUCLEOS_BIND.md`](docs/BLUEPRINT_NUCLEOS_BIND.md), [`docs/REFERENCIAS_G4F_SYSTEM_PROMPTS.md`](docs/REFERENCIAS_G4F_SYSTEM_PROMPTS.md) e [`docs/VALIDACAO_TENTATIVA_KTD.md`](docs/VALIDACAO_TENTATIVA_KTD.md). O arquivo original fornecido como referência de arquitetura foi preservado em [`docs/PromptAIVideo.txt`](docs/PromptAIVideo.txt).

## Desenvolvimento local

Instale as dependências e execute o servidor de desenvolvimento com os comandos abaixo.

```bash
pnpm install
pnpm dev
```

As verificações implementadas podem ser executadas com:

```bash
pnpm check
pnpm test
pnpm build
```

## Integração com o Nexus_Orchestra

O workspace persiste os eventos antes de qualquer tentativa de envio. Para ativar a entrega para um receptor HTTP do Nexus_Orchestra, configure as variáveis protegidas abaixo. O contrato completo está em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

| Variável | Finalidade |
| --- | --- |
| `NEXUS_ORCHESTRA_WEBHOOK_URL` | Endpoint HTTPS que recebe eventos do workspace. |
| `NEXUS_ORCHESTRA_WEBHOOK_SECRET` | Segredo compartilhado para assinatura HMAC SHA-256. |

Sem uma URL configurada, o aplicativo preserva o evento e informa que a entrega externa aguarda configuração, sem interromper os fluxos internos.

## Fusão modular do ecossistema

O painel **Fusão** inventaria e classifica fontes externas por licença, risco e rota de integração. Ele expõe conectores preparados em modo seguro, preserva a intenção de configuração por usuário e gera um envelope auditável para o Nexus_Orchestra. Fontes de prompts internos/vazados, rotas de acesso não autorizado ou dependências sem compatibilidade confirmada permanecem bloqueadas. Consulte [`docs/FUSAO_ECOSSISTEMA.md`](docs/FUSAO_ECOSSISTEMA.md) para a matriz de decisões e o contrato de sincronização.

## Referências para agentes

O painel **Referências** mantém uma biblioteca global de áudio, vídeo, imagem, texto e documentos de até 50 MB por arquivo. Os itens ficam em S3, recebem metadados de uso e são incluídos como contexto no planejamento audiovisual. Consulte [`docs/REFERENCIAS.md`](docs/REFERENCIAS.md) para os formatos aceitos e o fluxo de uso pelos agentes.
