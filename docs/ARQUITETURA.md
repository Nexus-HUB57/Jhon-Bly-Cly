# Arquitetura do Jhon Bly Cly Video Studio

O **Jhon Bly Cly Video Studio** é um workspace autenticado que transforma um briefing em um conjunto revisável de artefatos de produção. O produto trata a geração como uma operação observável: cada projeto, cena, ativo, execução e evento é persistido. A interface conduz o usuário por briefing, planejamento, storyboard, revisão, solicitação de geração e exportação.

## Domínio e ciclo de produção

| Entidade | Responsabilidade | Persistência |
| --- | --- | --- |
| `video_projects` | Briefing, formato, duração, idioma, objetivo, roteiro e estado global. | Banco de dados relacional. |
| `video_scenes` | Cenas editáveis, prompts visual/de produção/storyboard, imagem de referência e estado individual. | Banco de dados relacional. |
| `generation_runs` | Auditoria de planejamento, imagens de referência, pedidos de vídeo e exportações. | Banco de dados relacional. |
| `project_assets` | Arquivos enviados, imagens geradas, resultados de vídeo e exportações. | Metadados no banco e arquivos no armazenamento de objetos. |
| `project_versions` | Captura do planejamento gerado para rastreabilidade. | Banco de dados relacional. |
| `orchestra_events` | Outbox transacional para integração e auditoria do Nexus_Orchestra. | Banco de dados relacional. |

> O ciclo operacional usa **exatamente** os seguintes estados: `rascunho`, `planejando`, `aguardando revisão`, `gerando`, `concluído` e `com falha`.

O planejamento usa um modelo de linguagem no servidor para retornar um roteiro estruturado, resumo criativo e cenas. O resultado só muda o projeto para `aguardando revisão` depois de persistir roteiro, cenas e versão. A geração de imagens de referência também é acionada no servidor e sua URL é associada à cena e à biblioteca de ativos.

## Contrato de eventos do Nexus_Orchestra

O Workspace implementa o padrão de **outbox transacional**. O evento é persistido primeiro. Em seguida, o adaptador tenta entregá-lo a um endpoint configurado. Dessa forma, a interface sempre mostra o fato operacional, inclusive quando o destino externo não está disponível.

```json
{
  "source": "jhon-bly-cly-video",
  "schemaVersion": "1.0",
  "event": {
    "id": 42,
    "eventName": "video.generation.requested",
    "projectId": 8,
    "sceneId": null,
    "entityType": "generation_run",
    "entityId": 91,
    "payload": { "status": "gerando" },
    "occurredAt": "2026-08-26T20:00:00.000Z"
  }
}
```

| Cabeçalho | Finalidade |
| --- | --- |
| `content-type: application/json` | Declara o envelope JSON. |
| `x-jhon-bly-cly-event` | Identifica o tipo de evento enviado. |
| `x-jhon-bly-cly-signature` | HMAC SHA-256 do corpo quando há segredo compartilhado configurado. |

Os nomes de eventos implementados incluem `video.project.created`, `video.project.updated`, `video.planning.started`, `video.planning.ready_for_review`, `video.planning.failed`, `video.scene.updated`, `video.reference_image.started`, `video.reference_image.ready`, `video.reference_image.failed`, `video.asset.uploaded`, `video.generation.requested` e `video.export.manifest_ready`.

## Ativação da sincronização

O repositório atual do Nexus_Orchestra não disponibiliza uma rota receptora para os eventos de projeto. Quando a rota for publicada, configure os valores abaixo na área segura de variáveis do aplicativo. Os valores nunca devem ser codificados ou enviados ao navegador.

| Variável | Uso |
| --- | --- |
| `NEXUS_ORCHESTRA_WEBHOOK_URL` | URL HTTPS do receptor de eventos. |
| `NEXUS_ORCHESTRA_WEBHOOK_SECRET` | Segredo compartilhado usado para assinar o corpo com HMAC SHA-256. |

Sem a URL, a plataforma mantém os eventos com estado de entrega `falha` e uma mensagem explicativa, sem interromper o planejamento, a revisão ou o armazenamento dos artefatos. Quando o receptor estiver disponível, o Nexus_Orchestra deve validar a assinatura e responder com um código HTTP de sucesso para que o evento seja marcado como `entregue`.

## Limites de execução

As chamadas de IA, a geração de imagem, o armazenamento e a entrega opcional do evento são executados pelo servidor durante a solicitação iniciada pelo usuário. A geração de vídeo é registrada como uma solicitação de orquestração e não tenta renderizar vídeo pesado dentro do processo web. Essa separação preserva a observabilidade no produto e deixa a execução especializada para o orquestrador configurado.
