# Validação de disponibilidade privada

## Evidência atual

Em 27 de agosto de 2026, após o último reinício do servidor de desenvolvimento, a rota local do Studio respondeu HTTP `200`. A contagem limitada dos logs posteriores ao reinício identificou **zero** `ReferenceError`, `TypeError` ou erro não tratado no console do navegador e **zero** erros operacionais no log do servidor. Logs de rede não foram lidos nesta verificação.

| Sinal | Resultado | Interpretação |
| --- | --- | --- |
| Servidor de desenvolvimento | Ativo | O ambiente privado responde localmente. |
| Preview do Studio | Disponível | Pode ser usado para desenvolvimento e revisão autenticada. |
| Domínio público | Ausente por decisão do proprietário | Não é uma falha de disponibilidade do ambiente privado. |
| Heartbeat de produção | Não registrado | Continua bloqueado porque requer domínio publicado acessível. |

> A ausência de um domínio público não autoriza republicação, criação de tarefa agendada ou mudança de hospedagem. Essas ações permanecem condicionadas a uma nova autorização explícita do proprietário.

## Smoke autenticado das rotas afetadas

Após o reinício, `/orchestration` carregou o dashboard, o 9router, a matriz de sete APIs e o quadro de processamento de tokens. Em seguida, `/projects/1` carregou o projeto KTD, suas oito execuções históricas e a aba **Pacote de produção**, sem criar pacote, iniciar geração ou acionar integração. A referência `PRODUCTION_PACKAGE_STATUSES is not defined` não reapareceu no console pós-reinício; o erro registrado anteriormente foi causado pela versão intermediária do módulo de esquema antes da importação explícita e permanece apenas como histórico no log antigo.
