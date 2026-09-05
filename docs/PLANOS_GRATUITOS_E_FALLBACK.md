# Planos gratuitos e fallback governado

## Escopo de avaliação

Esta análise classifica opções oficialmente documentadas para um fallback sem cobrança no Studio. Ela não confirma a elegibilidade de nenhuma conta, não consulta saldos de chaves, não habilita projetos e não autoriza chamadas de provedores. O 9router continua restrito a seleção e proposta auditável.

## Evidências iniciais

| Provedor ativo | Modalidade gratuita oficialmente documentada | Limite ou condição relevante | Elegibilidade atual no Studio |
| --- | --- | --- | --- |
| Google Gemini | A documentação informa que contas novas começam no **Free Tier**, com acesso a determinados modelos dentro dos limites de taxa do plano; a página de preços relaciona tokens de entrada e saída gratuitos para modelos selecionados. [1][2] | Limites são por projeto e modelo, podem variar e a utilização no plano gratuito pode ser usada para melhorar produtos. Recursos de geração de vídeo apresentados na tabela não possuem disponibilidade no Free Tier. [2][3] | **Candidato apenas para planejamento, análise de referências ou texto**, caso a chave do projeto realmente pertença ao Free Tier e a aprovação humana permita uma chamada. Não é substituto gratuito comprovado para o vídeo KTD. |
| OpenAI | A documentação de cobrança pré-paga prevê que créditos gratuitos existentes são consumidos antes dos créditos comprados; não assegura concessão de créditos gratuitos para cada conta. [4] | Quando o crédito pré-pago se esgota, a API devolve erro de cobrança. A assinatura ChatGPT é separada da cobrança da API. [4][5] | **Não classificar como plano gratuito garantido**. Só poderá ser selecionado se o proprietário confirmar saldo promocional ou outro direito de uso válido, sem testar credenciais. |
| MiniMax | O painel oficial da conta verificou saldo efetivo de US$ 0,00; a documentação associa o erro 1008 a saldo insuficiente e direciona a Billing/Balance. [6] | O H3 cobra a saída de vídeo por segundo; em 768P, a tarifa publicada é US$ 0,08/s. Áudio de entrada é gratuito e as primeiras cinco imagens de entrada são gratuitas, mas isso não elimina a cobrança da saída. [10] | **Indisponível para nova tentativa KTD** enquanto o proprietário não recarregar a conta. Não é fallback gratuito de vídeo. |
| Z.AI | A tabela de preços lista alguns modelos de texto e visão como `Free`, mas a geração de vídeo listada possui preço por vídeo. [7] | O contrato veda usar a franquia do GLM Coding Plan para acesso API de propósito geral, aplicativos próprios, bots ou websites sem acordo específico. A API usage bundle continua em pay-as-you-go após o esgotamento. [8][9] | **Não selecionar automaticamente para vídeo.** Pode ser candidato a texto/visão somente após confirmação de que a chave pertence à API geral, que o modelo gratuito está disponível e que a chamada é aprovada. |
| Llama e Evomap | A modalidade aplicável depende do host/contrato configurado; Evomap requer contrato oficial OAuth/gateway antes de chamadas autenticadas. | Não há evidência suficiente para inferir um plano gratuito universal, tokens disponíveis ou adequação para vídeo. | **Fora do fallback automático** até confirmação documental e aprovação humana. |

> A expressão “gratuito” será tratada como uma condição verificável por provedor, conta, projeto, modelo e limite. Ela não significa que o Studio pode reutilizar chaves, criar contas, mudar planos, ativar cobrança ou encadear tentativas de geração.

O MiniMax também disponibiliza alertas e recarga automática no painel de cobrança. Esses recursos dependem de um limite e de um meio de pagamento configurados pelo proprietário; o JBC não os habilita, não armazena informação de pagamento e não tenta recompor saldo. [11]

## Referências

[1]: https://ai.google.dev/gemini-api/docs/billing "Google AI for Developers — Billing"
[2]: https://ai.google.dev/gemini-api/docs/pricing "Google AI for Developers — Gemini Developer API pricing"
[3]: https://ai.google.dev/gemini-api/docs/rate-limits "Google AI for Developers — Rate limits"
[4]: https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing "OpenAI Help — Setting up and managing prepaid API billing"
[5]: https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform "OpenAI Help — Managing billing for ChatGPT and the API platform"
[6]: https://platform.minimax.io/docs/api-reference/errorcode "MiniMax API Docs — Error Codes"
[7]: https://docs.z.ai/guides/overview/pricing "Z.AI Developer Document — Pricing"
[8]: https://docs.z.ai/legal-agreement/subscription-terms "Z.AI Developer Document — Subscriptions, Fees, and Payment"
[9]: https://docs.z.ai/api-reference/introduction "Z.AI Developer Document — API Introduction"
[10]: https://platform.minimax.io/docs/guides/pricing-paygo "MiniMax API Docs — Pay as You Go"
[11]: https://platform.minimax.io/docs/faq/about-account "MiniMax API Docs — About Account"
