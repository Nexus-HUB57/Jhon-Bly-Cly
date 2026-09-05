# myvideos — Arquitetura do Organismo Autônomo

## Visão Geral

A plataforma **myvideos** é um organismo independente e autônomo para geração audiovisual end-to-end, operando com **zero dependências externas de tokens ou cotas**. Todo o processamento de inferência é realizado pelo motor nativo, que gerencia um registry de modelos open-source com **15+ bilhões de parâmetros** distribuídos entre LLMs, modelos de difusão para imagem, modelos de vídeo, TTS e embeddings.

## Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────┐
│                   UI (Next.js 16)                    │
│  Dashboard │ Studio │ Galeria │ Player │ Modelos    │
├─────────────────────────────────────────────────────┤
│              API Routes (App Router)                 │
│  /api/projects  /api/generate/*  /api/inference      │
├─────────────────────────────────────────────────────┤
│           Orquestração Agéntica (TAOR)               │
│  Orchestrator → Planner → Director → Creator        │
│  → Reviewer → Composer → Healer                     │
├─────────────────────────────────────────────────────┤
│         Motor de Inferência Nativo                   │
│  Model Registry │ ONNX Runtime │ WebGPU │ FFmpeg    │
├─────────────────────────────────────────────────────┤
│         Persistência & Armazenamento                 │
│  Prisma + SQLite │ Filesystem (gerado/)             │
└─────────────────────────────────────────────────────┘
```

## Motor de Inferência Nativo (`NativeInferenceEngine`)

O motor centraliza toda a inferência AI em um único ponto de entrada, eliminando dependências diretas de APIs externas:

### Registry de Modelos (9 modelos, 15.0B parâmetros)

| Categoria | Modelo | Parâmetros | Backend | Capacidades |
|-----------|--------|-----------|---------|-------------|
| LLM | Phi-3.5 Mini Instruct | 3.8B | ONNX | planejamento, roteirização |
| LLM | Gemma 2 2B IT | 2B | ONNX | direção criativa, QA |
| LLM | Llama 3.2 1B | 1B | ONNX | roteamento, classificação |
| Image | Stable Diffusion Turbo | 815M | ONNX | text-to-image (fast) |
| Image | SDXL Turbo | 3.5B | ONNX | text-to-image (cinematic) |
| Video | AnimateDiff | 1.5B | ONNX | image-to-video |
| Video | CogVideoX-2B | 2B | ONNX | text-to-video |
| Audio | Bark Small | 400M | ONNX | TTS multilíngue |
| Embedding | all-MiniLM-L6-v2 | 22M | ONNX | RAG, semantic search |

### Fluxo de Inferência

```
request → NativeInferenceEngine.infer() → route by category
  → LLM: phi-3.5 / gemma-2 / llama-3.2
  → Image: sd-turbo / sdxl-turbo
  → Video: animatediff / cogvideox
  → Audio: bark-small
  → Embedding: minilm-l6
→ response with latency, tokens, parameters metrics
```

## Orquestração Agéntica (TAOR Loop)

O pipeline segue o padrão **Think → Act → Observe → Repeat** com 6 agentes especialistas:

1. **Orchestrator** — Coordena o pipeline, decide próximo agente, monitora progresso
2. **Planner** — Analisa briefing, cria plano de produção com cenas e durações
3. **Director** — Enriquece prompts visuais com composição, iluminação, paleta
4. **Creator** — Executa geração de imagens via motor nativo para cada cena
5. **Reviewer** — Avalia qualidade (prompt adherence, consistência, artefatos)
6. **Composer** — Compila vídeo final com FFmpeg (transições, color grading, muxing)
7. **Healer** — Auto-cura de cenas reprovadas (máximo 3 tentativas)

## Banco de Dados (Prisma + SQLite)

### Tabelas Core
- `Project` — Projetos audiovisuais com briefing, estilo, status
- `VisualScene` — Cenas com prompts, imagens, vídeos, qualidade
- `AudioTrack` — Trilhas de áudio com TTS, música, SFX
- `Composition` — Sincronização áudio-vídeo
- `GenerationLog` — Log auditável de todas as operações
- `WisdomMemory` — Auto-sabedoria do sistema (RAG)

### Tabelas de Inferência
- `ModelRegistry` — Registry de modelos nativos com status
- `InferenceSession` — Sessões de inferência com métricas
- `AgentState` — Estado dos agentes autônomos
- `PipelineExecution` — Execuções do pipeline com steps

## Autonomia

| Aspecto | Status |
|---------|--------|
| Gestão de projetos | 100% nativa |
| Planejamento audiovisual | Motor nativo (LLM próprio) |
| Geração de imagens | Motor nativo (SD/SDXL) |
| Geração de vídeo | Motor nativo (AnimateDiff/CogVideoX) |
| Geração de áudio | Motor nativo (Bark) |
| Composição final | FFmpeg nativo |
| Armazenamento | Filesystem local |
| Banco de dados | SQLite local |
| Tokens/cotas externas | Zero |
| APIs externas | Zero |

## Endpoints

- `GET/POST /api/inference` — Status do motor e execução de inferência
- `GET/POST /api/projects` — CRUD de projetos
- `POST /api/generate/image` — Geração de imagem via motor nativo
- `POST /api/generate/video` — Geração de vídeo via motor nativo
- `POST /api/generate/audio` — Geração de áudio via motor nativo
- `POST /api/projects/[id]/generate` — Pipeline end-to-end
