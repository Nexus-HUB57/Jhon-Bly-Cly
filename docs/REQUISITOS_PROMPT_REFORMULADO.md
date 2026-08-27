# Requisitos extraídos do PromptAIVideo reformulado

## Interpretação técnica

O arquivo recebido descreve uma visão de plataforma audiovisual com planejamento multimodal, keyframes, áudio, montagem, qualidade, memória e fallback. As referências a um agente de 408B parâmetros, 128 especialistas, 1 milhão de tokens, 777 fontes, GPUs e alta disponibilidade são **objetivos ou exemplos de arquitetura**; elas não comprovam que esses modelos, pesos, licenças, cotas ou infraestrutura estejam presentes no JBC atual.

| Requisito do prompt | Estado no JBC | Ajuste viável agora |
| --- | --- | --- |
| Projetos de 8 segundos a 5 minutos | A duração do projeto já admite 8–300 segundos; a geração de um clipe do provedor é limitada a 4–15 segundos. | Representar a duração longa como sequência planejada de clipes, sem prometer renderização de cinco minutos em uma única chamada. |
| Roteiro, cenas, câmera e prompts de produção | Há plano manual revisável, cena e RAG de referências. | Acrescentar contratos de keyframe, plano de áudio, EDL de montagem e gate de qualidade como dados revisáveis. |
| Storyboard e keyframes | Há geração de imagem de referência vinculada a cenas. | Registrar keyframes planejados e o estado de revisão; somente gerar imagem quando o operador acionar essa capacidade autorizada. |
| Áudio, Foley, lip-sync e masterização | Referências de áudio são aceitas; não existe motor interno de pós-produção. | Criar um plano de áudio e uma especificação de sincronização, sem alegar geração, muxing ou lip-sync não executados. |
| QA técnico e artístico | Há resultado e histórico de falhas, mas não um contrato estruturado de avaliação. | Criar uma avaliação humana/auditável com critérios técnicos, artísticos e perceptivos, sem fabricar métricas ou “assistir” a vídeo inexistente. |
| Edição, transições, cor e exportação | O Studio exporta manifesto de produção; não possui runtime de composição de vídeo. | Criar uma EDL de composição proposta que requer aprovação e runtime de mídia compatível antes de renderizar. |
| Fallback e autocura | O 9router seleciona propostas auditáveis; não executa adaptadores. | Registrar proposta de recuperação sem troca de provedor, reenvio de tarefa ou consumo de saldo automático. |
| RAG e memória | Memória e recuperação de referências persistem no Studio. | Associar planos de produção e avaliações à memória como evidências, mantendo revisão humana. |

## Limites não implementáveis por simples fusão de código

| Elemento do prompt | Razão para não executar diretamente |
| --- | --- |
| Varredura de tokens, chaves ou credenciais em repositórios e na internet | Viola o isolamento de segredos e a política de uso exclusivo do cofre. |
| Rodízio de contas, troca automática de token ou tentativa em cascata | Pode gerar custo, abuso de contas e contornar limites do provedor. O Studio só pode propor uma alternativa e aguardar aprovação. |
| Autoedição de código, commit, deploy ou instalação de ferramentas por agentes | Exige privilégio e revisão humana; não é permitido como comportamento autônomo do aplicativo. |
| Kubernetes, microVMs, Redis, GPU, modelos de difusão, FFmpeg/MoviePy ou LoRA no webapp | Exigem infraestrutura, recursos, dependências e licenças que não existem no runtime web atual. |
| Métricas de qualidade ou desempenho declaradas sem medição | Devem ser reportadas apenas depois de execução e avaliação verificáveis. |

> O ajuste correto é transformar as etapas criativas em **contratos internos auditáveis**. A execução de mídia continua explicitamente separada da proposta, e uma entrega só pode ser marcada como concluída quando houver artefato real, URL validada e resultado do provedor ou runtime autorizado.

## Próxima implementação proposta

O escopo interno será um contrato de produção por cena com quatro artefatos: **keyframe planejado**, **plano de áudio**, **decisão de montagem** e **avaliação de qualidade**. Todos começam em estado de proposta ou revisão humana; nenhum cria mídia, chama modelo, alterna provedor ou ativa cobrança sem procedimento explícito já existente no Studio.
