# Provedores externos do JBCx19

## Z.AI

A Z.AI expõe uma API REST compatível com o padrão de chat da OpenAI. O endpoint geral documentado é `https://api.z.ai/api/paas/v4`, e a autenticação ocorre por `Authorization: Bearer <API key oficial>`. O conector deverá registrar a chave somente como segredo de servidor e pode usar o modelo configurado pelo proprietário. [1] [2]

## Alibaba Cloud Model Studio

Para workloads de modelo, o Alibaba Cloud Model Studio fornece uma API key própria do workspace, que deve ser criada no console e armazenada como variável protegida. A plataforma também oferece interfaces compatíveis com OpenAI e Anthropic, cujos endpoints variam por região. Para APIs gerais da Alibaba Cloud, a autenticação pode exigir AccessKey ID e AccessKey secret com assinatura ACS3-HMAC-SHA256; esse par não será solicitado nem usado até que um serviço e uma região sejam definidos pelo proprietário. [3] [4]

## Política comum

Cada provedor só será ativado com uma credencial oficial inserida no armazenamento protegido do projeto. Repositórios públicos, exemplos de configuração e valores encontrados em código não são fontes de credenciais para o JBCx19.

## Estado de ativação atual

O conjunto ativo autorizado do JBCx19 é **MiniMax, OpenAI, Llama, Z.AI, Google AI Studio e Evomap**. Alibaba Cloud Model Studio e DigitalOcean permanecem **inativos**. A ativação do Evomap foi autorizada pelo proprietário e sua credencial permanece exclusivamente no cofre protegido; o valor não é exposto no código, na interface, nos logs ou nesta documentação.

O estado `ativo` do registro Evomap significa que o Studio pode apresentar o provedor como elegível por um contrato server-side controlado. Isso não habilita ciclos autônomos, publicação externa, registro de nós, uso de ferramentas remotas ou consumo de créditos. Os endpoints de dados documentados pelo Evomap exigem OAuth 2.0 com PKCE e escopos aprovados; por isso, a chave de conta registrada no cofre não é usada como substituta de um access token OAuth no catálogo de dados. Uma integração funcional futura dependerá do contrato oficial do gateway correspondente ou de uma autorização OAuth específica com o menor escopo necessário. [5]

## Referências

[1] [Z.AI API reference — Introduction](https://docs.z.ai/api-reference/introduction)

[2] [Z.AI HTTP API calls](https://docs.z.ai/guides/develop/http/introduction)

[3] [Alibaba Cloud Model Studio — Obtain an API key](https://www.alibabacloud.com/help/en/model-studio/get-api-key)

[4] [Alibaba Cloud SDK — V3 request structure and signature](https://www.alibabacloud.com/help/en/sdk/product-overview/v3-request-structure-and-signature)

[5] [EvoMap — API Overview](https://evomap.ai/dev/docs/40-api-overview)
