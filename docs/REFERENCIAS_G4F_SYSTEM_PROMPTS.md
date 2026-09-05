# Inventário seguro de referências adicionais

## Escopo

Foram clonadas uma única vez as referências públicas `xtekky/gpt4free` e `asgeirtj/system_prompts_leaks`. A solicitação repetia `xtekky/gpt4free`; a fonte foi mantida uma única vez no inventário para evitar duplicação de código, licença e superfície de risco. Nenhum artefato foi executado e nenhuma dependência foi instalada.

| Referência | Commit observado | Arquivos rastreados | Licença localizada | Diretórios raiz observados |
| --- | --- | ---: | --- | --- |
| `xtekky/gpt4free` | `5362ba5d` | 382 | `LICENSE` | `.github`, `docker`, `docs`, `etc`, `g4f-go`, `g4f`, `generated_media`, `models`, `projects`, `scripts` |
| `asgeirtj/system_prompts_leaks` | `a7d0a26` | 395 | `LICENSE` | `.github`, `Anthropic`, `Cursor`, `DeepSeek`, `GLM`, `Google`, `Kimi`, `Meta`, `Microsoft`, `Misc`, `Mistral`, `Notion`, `OpenAI`, `OpenCode`, `Perplexity`, `Pi`, `Qwen`, `assets`, `xAI` |

## Classificação para o JBC

`gpt4free` é tratado como referência de arquitetura de adaptadores e roteamento, não como fonte autorizada para contornar autenticação, quotas, CAPTCHAs, políticas de uso ou cobrança. O inventário encontrou sete caminhos rastreados cujo nome sugere configuração sensível; eles não foram abertos, copiados, importados ou classificados por conteúdo.

`system_prompts_leaks` é tratado exclusivamente como evidência de risco e como referência para reconhecer fronteiras de prompt, não como biblioteca de prompts. Seu conteúdo não é incorporado ao JBC, não é reproduzido, não é usado para extrair instruções internas e não é transformado em ferramenta executável.

> Nenhum número de tokens gratuitos, saldo, modelo, endpoint ou capacidade de geração foi inferido a partir dos nomes dos repositórios. Credenciais existentes no ambiente continuam pertencendo ao cofre e não foram consultadas.

## Regra de incorporação

Somente contratos públicos, metadados de licença e padrões de interface que passem por revisão podem ser traduzidos para o catálogo governado do JBC. O resultado deve permanecer declarativo: o 9router pode propor uma rota, mas não executa adaptadores, troca tokens, cria contas, instala dependências ou sincroniza plataformas externas automaticamente.

## Referências

[1]: https://github.com/xtekky/gpt4free "xtekky/gpt4free"
[2]: https://github.com/asgeirtj/system_prompts_leaks "asgeirtj/system_prompts_leaks"

## Confirmação pública das referências

A página pública do `gpt4free` descreve uma coleção de provedores e interfaces para modelos de linguagem e mídia, incluindo suporte multi-provedor, clientes e API compatível; a própria página declara licença GPLv3 e ausência de garantia [1]. Isso reforça que uma eventual reutilização de código exigiria compatibilidade GPLv3 e revisão independente de cada dependência, não uma cópia direta para o webapp.

A página pública de `system_prompts_leaks` se descreve como uma coleção de prompts de sistema extraídos e capturados literalmente, organizada por fornecedores e ferramentas [2]. Por esse caráter, o JBC não abre, reproduz, indexa ou transforma seus prompts em instruções, skills ou ferramentas. O repositório permanece apenas como referência de risco e de fronteiras de prompt.

> A descrição pública de um projeto não comprova que seus provedores sejam gratuitos, autorizados para produção, compatíveis com o JBC ou seguros para fallback. O catálogo interno continua declarativo e exige contrato, licença, quota e aprovação separados.

[1]: https://github.com/xtekky/gpt4free "Repositório público xtekky/gpt4free"
[2]: https://github.com/asgeirtj/system_prompts_leaks "Repositório público asgeirtj/system_prompts_leaks"
