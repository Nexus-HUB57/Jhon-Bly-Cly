# Escalada governada por saldo insuficiente

## Evento de origem

A escalada é elegível somente quando a tentativa MiniMax-H3 falhar com a classificação explícita de saldo insuficiente. Erros de rede, autenticação, formato, planejamento ou qualidade não criam fallback por saldo.

| Etapa | Resultado automático permitido | Efeito proibido |
| --- | --- | --- |
| Classificação | Identificar o código/mensagem de saldo insuficiente no backend. | Expor a mensagem bruta, credencial ou detalhes internos ao cliente. |
| Nexus_Orchestra | Criar evidência local no outbox com entrega pendente. | Enviar evento a um endpoint externo automaticamente. |
| 9router | Criar proposta rotacionada e excluir o adaptador MiniMax que acabou de falhar. | Ativar conector, testar saldo de outra conta, trocar token ou chamar adaptador. |
| Revisão | Exibir a proposta e o limite de execução no projeto. | Reenviar vídeo ou iniciar cobrança em consequência da aprovação. |

## Idempotência e limite de escopo

Cada `runId` tem no máximo uma proposta de escalada. Uma nova tentativa manual que também falhe poderá gerar sua própria evidência, mas não existe reexecução automática. Se nenhum adaptador alternativo estiver elegível no catálogo, o resultado da proposta registra essa ausência e permanece em revisão humana.

> A escalada automatiza somente o **registro da decisão pendente**. Ela não automatiza o uso de créditos, a sincronização externa, a execução de agentes nem a geração de mídia.
