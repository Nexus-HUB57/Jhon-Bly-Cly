# Arquitetura de produção auditável

## Decisão de desenho

O ajuste do PromptAIVideo será implementado como um pacote de produção por cena. O pacote é persistido, pertence ao usuário e contém o planejamento de keyframe, áudio, montagem e qualidade. Ele não representa um arquivo renderizado, não contém credenciais e não inicia uma chamada de modelo.

| Campo | Propósito | Regra de segurança |
| --- | --- | --- |
| `keyframePlan` | Descreve a âncora visual, o enquadramento e a intenção de movimento. | Um plano não é uma imagem gerada; a geração continua em ação explícita e separada. |
| `audioPlan` | Relaciona duração, fonte autorizada e intenção de sincronização. | Não produz, corta, mixa ou reutiliza áudio sem ação e ativo autorizados. |
| `editDecisionList` | Registra transição, ritmo e orientação de cor a aplicar futuramente. | Não executa FFmpeg, MoviePy, GStreamer ou efeitos. |
| `qualityGate` | Lista critérios técnicos, artísticos e perceptivos para revisão humana. | Não inventa métricas de VLM, PSNR, SSIM, análise de frames ou aprovação automática. |
| `status` e `reviewNote` | Mantêm o pacote em rascunho, revisão, aprovado ou rejeitado. | A aprovação é humana e não muda o estado do vídeo nem aciona renderização. |

## Fluxo controlado

1. O operador cria o rascunho do pacote a partir de uma cena já existente.
2. O Studio armazena o plano e publica um evento de auditoria.
3. O operador revisa, edita e marca o pacote como aprovado ou rejeitado.
4. Uma solicitação de imagem, vídeo ou composição continua sendo uma operação distinta, com o provedor/runtime e a autorização apropriados.

Essa separação transforma o roteiro em dados de produção e cria a base para um runtime futuro, sem fingir que o navegador ou o backend atual renderizou a entrega final.
