# Processamento de tokens sem cobrança automática

## Contrato operacional

O Studio JBC agora mantém uma matriz declarativa de processamento de tokens para as sete APIs sincronizadas pelo proprietário e para o Ollama local. A matriz define o limite máximo por requisição, a data de reset em UTC, o escopo de uso e a necessidade de aprovação humana. Ela não consulta saldo, não habilita contas e não transforma a presença de uma variável protegida em prova de quota gratuita.

| Grupo | Estado no Studio | Tratamento |
| --- | --- | --- |
| OpenAI, Llama, Z.AI e Google AI Studio | Cota diária declarada, ainda não confirmada pelo runtime | Podem aparecer em uma proposta de planejamento, texto ou análise de referências; a chamada exige contrato, quota e aprovação. |
| Alibaba Model Studio, DigitalOcean e Evomap | Quota desconhecida ou contrato pendente | Permanecem fora de execução; uma proposta não os ativa nem troca credenciais. |
| Ollama local | Sem quota de provedor | É gratuito somente quando o proprietário fornece host, processo e modelo locais; o JBC não instala, inicia ou hospeda o runtime automaticamente. |
| MiniMax-H3 | Não elegível para fallback gratuito de vídeo | O vídeo continua sujeito à cobrança do provedor; saldo insuficiente gera escalada governada, não reexecução. |

## Contadores e governança

O limite por requisição é uma barreira local de segurança. A data de quota usa UTC para evitar divergência de fuso. Enquanto o limite diário real for `null`, uma função de reserva não aprova consumo: o sistema só pode criar uma proposta informativa e aguardar confirmação autorizada de uso. O offset de seleção altera a ordem dos candidatos de forma determinística, mas o resultado é marcado como `proposalOnly` e inclui a exigência de revisão humana.

> A política de tokenização controla o que o JBC pode propor; ela não cria saldo, não promete acesso gratuito e não executa qualquer provedor.

A geração audiovisual permanece no backend JBC quando o conector MiniMax estiver disponível. A política de tokens atende planejamento e análise textual; ela não converte tokens gratuitos em um motor local de vídeo e não substitui um runtime de mídia autorizado.
