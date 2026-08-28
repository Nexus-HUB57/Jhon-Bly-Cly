# Blueprint de núcleos de tokenização e bind

## Objetivo

O blueprint traduz padrões públicos de integração em cinco núcleos internos do JBC: ingestão de intenção, orçamento de tokens, política de custo e risco, bind governado pelo 9router e auditoria/outbox. A desfragmentação é contratual; ela não copia runtime, prompts, credenciais, bypasses ou dependências dos repositórios de referência.

| Núcleo | Função no JBC | Efeito permitido |
| --- | --- | --- |
| Ingestão de intenção | Normaliza finalidade e contexto mínimo. | Somente dados. |
| Orçamento | Aplica limite por requisição, janela UTC e quota declarada/desconhecida. | Somente dados; não consulta saldo sozinho. |
| Política | Bloqueia cobrança implícita, troca de credencial e quota não confirmada. | Somente proposta condicionada. |
| Bind governado | Relaciona capacidade, provedor declarado e prioridade do 9router. | Somente proposta determinística. |
| Auditoria/outbox | Registra decisão, motivo, revisão e estado de entrega. | Somente evidência; sem entrega externa automática. |

## Relação com as referências

O `gpt4free` foi utilizado apenas para observar a existência pública de abstrações multi-provedor e interfaces compatíveis. A página pública declara GPLv3; por isso não há código desse repositório incorporado ao JBC. O `system_prompts_leaks` foi mantido como fonte bloqueada de risco: sua finalidade pública é reunir prompts de sistema capturados, e nenhum conteúdo foi aberto, indexado, reproduzido ou transformado em instrução.

O contrato interno em `shared/bindBlueprint.ts` é deliberadamente neutro em relação a provedores. Cada proposta carrega `proposalOnly`, exige aprovação humana e fixa `mayCharge`, `mayRotateCredentials` e `mayExecuteProvider` como `false`. O painel expõe as cinco camadas para inspeção, mas não oferece um botão de execução.

> “Token sincronizado” descreve presença protegida no catálogo. Não significa saldo, quota diária, contrato funcional, permissão de produção ou autorização de chamada.

## Critérios de aceitação

A implementação é aceita quando a sequência das cinco camadas permanece estável, uma proposta inválida é rejeitada, uma proposta válida continua sem efeitos externos e o painel exibe a arquitetura sem habilitar ações executoras. A execução real de qualquer modelo, plataforma ou agente requer contrato oficial, host/credencial apropriados e aprovação humana separada.

## Referências

[1]: https://github.com/xtekky/gpt4free "xtekky/gpt4free"
[2]: https://github.com/asgeirtj/system_prompts_leaks "asgeirtj/system_prompts_leaks"
