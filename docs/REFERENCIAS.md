# Biblioteca de Referências

O painel **Referências** é a biblioteca global do Studio JBC para ativos que devem orientar os agentes durante o planejamento audiovisual. Cada item recebe metadados de categoria, finalidade para o agente, tamanho e data de inclusão; os bytes do arquivo são armazenados no S3 do workspace.

## Limites e formatos

| Categoria | Extensões aceitas | Uso esperado pelos agentes |
| --- | --- | --- |
| Áudio | `.mp3`, `.wav` | Ritmo, energia, clima musical, locução e desenho sonoro. |
| Vídeo | `.mp4`, `.mov`, `.webm` | Linguagem de câmera, edição, interpretação e movimento. |
| Imagem | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` | Persona, paleta, figurino, cenário e enquadramento. |
| Texto | `.txt` | Referência narrativa, briefing e diálogos. |
| Documento | `.pdf`, `.doc`, `.docx` | Guias de marca, roteiro, escopo e requisitos de produção. |

O tamanho máximo por item é **50 MB**. O cliente evita a seleção de arquivos acima do limite e o backend repete a validação sobre os bytes decodificados antes do armazenamento; assim, o limite não depende somente da interface.

## Fluxo de agentes

1. O usuário envia o ativo e descreve como ele deve orientar os agentes, por exemplo `ritmo e música` ou `identidade visual`.
2. O backend armazena o arquivo em S3 e registra `name`, `category`, `agentUse`, `purpose`, URL segura e tamanho em `reference_assets`.
3. Ao iniciar o planejamento de um projeto, o agente recebe o inventário textual de referências globais do usuário, incluindo finalidade e categoria, para refletir essas direções no roteiro, nas cenas, nos prompts e no storyboard.
4. A consulta `references.agentContext` permite ao Orchestra ou a conectores autorizados recuperar somente os metadados de contexto necessários para uma etapa de produção.

> Arquivos de referência não são executados. A biblioteca trata todos os documentos e mídias enviados como dados de contexto, não como instruções de sistema ou código confiável.
