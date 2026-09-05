# Autenticação segura do JBCx19

## Escopo da auditoria

O inventário JBCx19 verificou somente **mecanismos públicos de autenticação**: nomes de variáveis de ambiente, campos de configuração, documentação de OAuth, URLs de host e contratos de cliente. Nenhum valor de token, chave, cookie, senha ou arquivo de credencial foi lido, copiado, exibido ou reutilizado.

> Repositório aberto descreve uma implementação; ele não concede uma conta, uma chave de produção ou autorização para chamar um serviço em nome de terceiros.

### Proibição de coleta de tokens de repositórios

Scripts que façam **coleta, classificação, redaction, cópia, reutilização ou injeção** de tokens, Bearer strings, chaves de API ou prompts internos encontrados em repositórios não pertencem ao JBCx19 e são proibidos. Mesmo quando um valor aparenta ser exemplo, teste ou credencial exposta, ele é tratado como dado não confiável e não pode ser usado para autenticar conectores. A ativação ocorre unicamente por segredo oficial inserido no armazenamento protegido do projeto, OAuth concluído ou host explicitamente autorizado pelo proprietário.

## Matriz de ativação

| Grupo de fontes | Mecanismo público identificado | Estado no JBCx19 | Ativação permitida |
| --- | --- | --- | --- |
| MiniMax MCP | Chave de API e host do provedor. | Preparado. | Credencial oficial do proprietário por secret protegido. |
| Ollama | Endpoint HTTP de host próprio. | Preparado. | Host autorizado com política de rede e modelo instalado. |
| Harnesses de agentes | Configuração de cliente, telemetria e contratos de plugin. | Referência. | Revisão manual; não executa runtime externo automaticamente. |
| Modelos e runtimes pesados | Hosts, IDs de modelos e requisitos de infraestrutura. | Referência. | Infraestrutura própria e análise de licença. |
| Plugins e manifestos | Manifestos e especificações de capacidade. | Catálogo. | Seleção explícita de adaptador e autorização do operador. |
| Fontes de prompts internos, vazados ou acesso alternativo | Potenciais nomes de autenticação são tratados como dados não confiáveis. | Bloqueado. | Nunca permitido. |

## Regras de proteção

1. Um conector só muda de `aguardando credencial` para ativo após uma credencial oficial, um fluxo OAuth concluído ou um host explicitamente autorizado.
2. Segredos ficam em armazenamento protegido do projeto; não são incluídos em Git, logs, eventos do Orchestra ou respostas do agente.
3. O JBCx19 registra a intenção de ativação e o resultado de entrega, mas não grava o valor do segredo na base de dados de domínio.
4. Código-fonte é protegido por controle de acesso do repositório, permissões do ambiente e checkpoints versionados. Senhas compartilhadas em mensagens não são gravadas como chaves criptográficas no código.

## Adaptador audiovisual MiniMax-H3

O backend implementa o contrato público `POST /v2/video_generation` e prepara a consulta de tarefas em `GET /v2/query/video_generation/{task_id}`. A chamada exige `Authorization: Bearer <API key oficial>` no servidor e nunca encaminha a chave ao navegador. O adaptador aceita vídeo de **4 a 15 segundos**, portanto o experimento KTD de 8 segundos está dentro do intervalo suportado. Referências de imagem, vídeo e áudio poderão ser encaminhadas ao provedor em evolução posterior do adaptador, respeitando os limites de mídia do contrato oficial. [3] [4]

Quando `MINIMAX_API_KEY` não está configurada, a rota do Studio JBC cria somente um evento de pré-condição e informa que a credencial oficial é necessária; nenhuma chamada externa é feita. Quando configurada, o sistema registra `task_id`, execução e evento de orquestração de forma auditável, sem gravar a chave nos registros de domínio.

## Conectores validados

As credenciais protegidas de **MiniMax**, **OpenAI** e **Llama** foram verificadas por consultas leves autenticadas, sem imprimir valores. Cada verificação falha de forma explícita quando a URL do endpoint é inválida ou quando o provedor rejeita a autorização.

## Referências

[1] [Auditoria técnica dos 19 repositórios](FUSAO_AUDITORIA_TECNICA.md)

[2] [Arquitetura modular e política de bloqueio](FUSAO_ECOSSISTEMA.md)

[3] [MiniMax — criação de tarefa de geração de vídeo V2](https://platform.minimax.io/docs/api-reference/video-generation-v2-create)

[4] [MiniMax — consulta de tarefa de geração de vídeo V2](https://platform.minimax.io/docs/api-reference/video-generation-v2-query)
