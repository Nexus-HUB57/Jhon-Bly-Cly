# Validação do caminho de saldo MiniMax

## Contexto

Em 27/08/2026, foi registrada no painel de Orquestração uma proposta 9router para a condição de saldo da prova KTD. A seleção retornou o adaptador de mídia generativa `MiniMax-AI/MiniMax-MCP`, em risco médio, como candidato único. O registro é uma intenção auditável e não executou uma chamada ao provedor, cobrança ou geração de vídeo.

## Método oficial identificado

A documentação da MiniMax direciona o operador de conta para **Account > Billing > Balance** para consultar, recarregar e configurar alertas de saldo. Ela associa o código `1008` a `insufficient balance` e instrui verificar o saldo da conta. A documentação também separa a chave pay-as-you-go da Subscription Key de Token Plan e informa que, quando necessário, os recursos são gerenciados na área de Billing/Balance.[1][2][3]

| Item | Evidência | Decisão no Studio |
| --- | --- | --- |
| Falha anterior | O provedor retornou `1008`, que a documentação classifica como saldo insuficiente. | Preservar a falha real do KTD; não repeti-la automaticamente. |
| Consulta de saldo | As páginas oficiais encontradas apontam à área autenticada **Billing > Balance**. | Não inventar endpoint de saldo nem reutilizar segredo em uma chamada não documentada. |
| Proposta 9router | Seleciona e registra prioridade de mídia generativa. | Manter em `proposta` / `aguardando revisão`; não concede execução. |
| Próxima operação | Uma tentativa KTD depende de saldo efetivamente disponível. | Solicitar confirmação humana da disponibilidade e autorização explícita para **uma** chamada pelo backend JBC. |

> A proposta do roteador não substitui a confirmação de saldo na conta MiniMax e não concede autorização para cobrança. A geração continua limitada ao corte de áudio aprovado de aproximadamente oito segundos e às referências já vinculadas ao projeto.

## Resultado da verificação autenticada

A área oficial **Balance** da conta MiniMax foi aberta em sessão autenticada, sem modificação de configurações. O painel exibiu saldo efetivo de **US$ 0,00**, com caixa, voucher, crédito e pendências também zerados. Portanto, a condição necessária para nova tentativa do KTD não está atendida. Nenhuma opção de recarga, alerta ou recarga automática foi selecionada.

| Decisão | Motivo |
| --- | --- |
| Não reenviar o KTD | Uma nova solicitação reproduziria a falha `1008` por saldo insuficiente. |
| Não habilitar recarga automática | Isso modificaria cobrança e meio de pagamento, fora do escopo da proposta registrada. |
| Aguardar recarga pelo proprietário | Após o saldo ficar disponível, o Studio poderá registrar a autorização e executar uma única tentativa pelo backend JBC. |

## Referências

[1]: https://platform.minimax.io/docs/faq/about-account "MiniMax API Docs — About Account"
[2]: https://platform.minimax.io/docs/api-reference/errorcode "MiniMax API Docs — Error Codes"
[3]: https://platform.minimax.io/docs/guides/quickstart-preparation "MiniMax API Docs — Prerequisites"
