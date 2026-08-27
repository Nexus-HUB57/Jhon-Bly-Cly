# Validação do 9router governado

Em sessão autenticada no ambiente de desenvolvimento, o painel de Orquestração exibiu a prévia da alternância 9router para a capacidade **planejamento e orquestração**, com teto de risco médio. A política apresentou seis candidatos elegíveis dentre os 19 adaptadores inventariados e indicou, de forma explícita, que a saída permanece em **proposta**.

Os seis candidatos apresentados foram `anthropics/claude-code`, `deepseek-ai/deepseek-harness`, `FoundationAgents/OpenManus`, `openinterpreter/openinterpreter`, `shareAI-lab/learn-claude-code` e `xai-org/grok-build`. Fontes classificadas como bloqueadas ficaram fora do ranking; a entrada 9remote permaneceu em catálogo e sem acesso remoto.

A interface apresentou também controles explícitos de capacidade, teto de risco e pedido de roteamento. A prévia mostrou a contagem de candidatos e o motivo de elegibilidade de cada um, sem exigir credencial, host ou ativação de qualquer adaptador.

Foi registrada uma única proposta pela ação **Registrar seleção para revisão**. A trilha do Planner recebeu o evento `Seleção 9router` com seis evidências e estado `aguardando revisão`; a auditoria de ferramentas recebeu `9router: seleção governada` com estado `proposta`. A prévia seguinte alternou a prioridade para iniciar por `deepseek-ai/deepseek-harness`, comprovando o avanço controlado do cursor de alternância. Nenhuma execução externa ocorreu.

> A prévia não executa adaptadores, repositórios, ferramentas, conectores nem chamadas externas. Ação posterior registra somente uma seleção auditável para revisão humana.

O painel também preservou os controles de ciclo, a telemetria por papéis e o estado dos provedores. O projeto KTD continuou disponível no ambiente de desenvolvimento; sua falha histórica de saldo do provedor de vídeo não foi ocultada ou reinterpretada como resultado produzido.
