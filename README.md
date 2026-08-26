# Jhon Bly Cly Video Studio

O **Jhon Bly Cly Video Studio** é um workspace autenticado para transformar briefings em um fluxo audiovisual revisável. A aplicação concentra o ciclo de planejamento, roteirização, cenas, storyboard, ativos, solicitação de geração, exportação e eventos de orquestração em uma única interface operacional.

## O que foi implementado

| Área | Entrega |
| --- | --- |
| Projetos | Criação, listagem e abertura de projetos com briefing, formato, duração, idioma, objetivo e direção criativa. |
| Planejamento por IA | Geração server-side de roteiro, resumo criativo, divisão de cenas e prompts editáveis para produção e storyboard. |
| Revisão | Edição de cenas, prompts, narrativa e orientação de câmera antes do pedido de geração. |
| Referências | Geração de imagens de referência por cena e visualização em storyboard. |
| Biblioteca | Upload seguro de arquivos, associação a projetos e cenas e consulta de ativos armazenados. |
| Execução | Histórico de execuções para planejamento, imagens, vídeo e exportação. |
| Exportação | Manifesto JSON de produção armazenado com todos os metadados do projeto. |
| Orquestração | Registro de eventos de domínio e adaptador opcional de entrega assinada para o Nexus_Orchestra. |

> Os estados de tarefa são restritos a: `rascunho`, `planejando`, `aguardando revisão`, `gerando`, `concluído` e `com falha`.

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

Sem uma URL configurada, o aplicativo preserva o evento e informa que a entrega externa aguarda configuração, sem interromper os fluxos internos. O arquivo original fornecido como referência de arquitetura foi preservado em [`docs/PromptAIVideo.txt`](docs/PromptAIVideo.txt).

## Fusão modular do ecossistema

O painel **Fusão** inventaria e classifica fontes externas por licença, risco e rota de integração. Ele expõe conectores preparados em modo seguro, preserva a intenção de configuração por usuário e gera um envelope auditável para o Nexus_Orchestra. Fontes de prompts internos/vazados, rotas de acesso não autorizado ou dependências sem compatibilidade confirmada permanecem bloqueadas. Consulte [`docs/FUSAO_ECOSSISTEMA.md`](docs/FUSAO_ECOSSISTEMA.md) para a matriz de decisões e o contrato de sincronização.
