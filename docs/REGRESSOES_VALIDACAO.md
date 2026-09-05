# Registro de Regressões e Validação

Este registro separa **falhas de desenvolvimento transitórias**, limites operacionais de terceiros e defeitos funcionais reproduzíveis. Nenhuma entrada deve ser tratada como concluída sem uma evidência associada.

| ID | Sinal observado | Classificação | Ação corretiva | Evidência de validação | Estado |
| --- | --- | --- | --- | --- | --- |
| REG-001 | A consulta tRPC recebeu HTML e o cliente reportou `Unexpected token '<'` durante reload do ambiente de desenvolvimento. | Transiente de ciclo de desenvolvimento. | Reinício completo do servidor e recarregamento da sessão autenticada; não houve alteração de contrato de API porque o problema não se repetiu em processo limpo. | Após o reinício, a página `/orchestration` carregou dashboard, catálogo, telemetria e histórico sem erro de cliente; os logs posteriores ao reinício não contêm erro ativo de navegador. | Validado sem reprodução. |
| REG-002 | Módulos HMR relataram exports ausentes enquanto arquivos de política e persistência eram editados em sequência. | Cache transitório do HMR, não regressão persistente. | Reinício completo após concluir os contratos; checagem TypeScript e build completos. | `pnpm test`, `pnpm check` e `pnpm build` aprovados; a sessão autenticada exibiu Planner, Executor, Monitor e Optimizer com telemetria persistida. | Validado sem reprodução. |
| REG-003 | A síntese do ciclo retornou indisponibilidade por limite de uso do serviço LLM. | Limite operacional externo, não defeito de código. | O ciclo registra falha auditável, preserva o bloqueio de efeitos externos e a interface apresenta mensagem segura, sem rejeição não tratada. | Smoke manual registrou a falha com estado auditável; nenhum conector, segredo ou chamada externa foi ativado. | Mitigado; depende da disponibilidade do provedor para nova síntese. |

> A validação não afirma ausência absoluta de defeitos futuros. Ela comprova que os sinais acima foram tratados ou não puderam ser reproduzidos no ciclo limpo, com testes automatizados e smoke autenticado documentados.
