# Provedores externos do JBCx19

## Z.AI

A Z.AI expõe uma API REST compatível com o padrão de chat da OpenAI. O endpoint geral documentado é `https://api.z.ai/api/paas/v4`, e a autenticação ocorre por `Authorization: Bearer <API key oficial>`. O conector deverá registrar a chave somente como segredo de servidor e pode usar o modelo configurado pelo proprietário. [1] [2]

## Alibaba Cloud Model Studio

Para workloads de modelo, o Alibaba Cloud Model Studio fornece uma API key própria do workspace, que deve ser criada no console e armazenada como variável protegida. A plataforma também oferece interfaces compatíveis com OpenAI e Anthropic, cujos endpoints variam por região. Para APIs gerais da Alibaba Cloud, a autenticação pode exigir AccessKey ID e AccessKey secret com assinatura ACS3-HMAC-SHA256; esse par não será solicitado nem usado até que um serviço e uma região sejam definidos pelo proprietário. [3] [4]

## Política comum

Cada provedor só será ativado com uma credencial oficial inserida no armazenamento protegido do projeto. Repositórios públicos, exemplos de configuração e valores encontrados em código não são fontes de credenciais para o JBCx19.

## Estado de ativação atual

O conjunto ativo e validado do JBCx19 é **MiniMax, OpenAI, Llama, Z.AI e Google AI Studio**. Os conectores de Alibaba Cloud Model Studio, DigitalOcean e Evomap foram preservados em estado **inativo**; eles não participam de chamadas, testes de runtime ou fluxos de agentes até receberem uma credencial oficial validada. Esse estado não remove variáveis protegidas, nem altera artefatos existentes do workspace.

## Referências

[1] [Z.AI API reference — Introduction](https://docs.z.ai/api-reference/introduction)

[2] [Z.AI HTTP API calls](https://docs.z.ai/guides/develop/http/introduction)

[3] [Alibaba Cloud Model Studio — Obtain an API key](https://www.alibabacloud.com/help/en/model-studio/get-api-key)

[4] [Alibaba Cloud SDK — V3 request structure and signature](https://www.alibabacloud.com/help/en/sdk/product-overview/v3-request-structure-and-signature)
