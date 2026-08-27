# Pendências end-to-end

O Studio permanece operacional no ambiente de desenvolvimento. As pendências abaixo não autorizam execução automática e foram separadas pelo insumo necessário para conclusão.

| Condição | Itens relacionados | Próxima ação segura |
| --- | --- | --- |
| Saldo do provedor de vídeo | 25, 26, 117 | O proprietário regulariza o saldo MiniMax; o operador então retoma o projeto KTD e reenvia a prova de 8 segundos usando somente as referências já aprovadas. |
| Credenciais e contratos externos | 59, 60, 110, 111, 112 | Fornecer somente pelo cofre os valores oficiais que faltarem e, para Evomap, confirmar o contrato de gateway aplicável ou concluir OAuth/PKCE de menor escopo. |
| Publicação suspensa por decisão do proprietário | 67, 70, 76, 114, 118 | Manter o ciclo manual disponível. Criar Heartbeat apenas após nova autorização de publicação e domínio acessível. |
| Correções internas verificáveis | 85, 89, 115 | Continuar testando regressões catalogadas, manter o smoke autenticado e sincronizar apenas alterações aditivas. |

> O 9router pode selecionar e alternar prioridades entre os 19 adaptadores, mas seu resultado permanece uma proposta auditável. Ele não ativa conectores, não executa repositórios, não usa credenciais e não efetua chamadas externas.
