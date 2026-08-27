import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import type { TaskStatus } from "@shared/video";
import { ArrowLeft, Bot, CheckCircle2, ChevronRight, Clapperboard, Download, FileUp, ImagePlus, Loader2, Play, Save, Sparkles, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

type SceneDraft = {
  title: string;
  narrative: string;
  camera: string;
  visualPrompt: string;
  productionPrompt: string;
  storyboardPrompt: string;
};

const emptyDraft: SceneDraft = { title: "", narrative: "", camera: "", visualPrompt: "", productionPrompt: "", storyboardPrompt: "" };

function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-panel ${className}`}>{children}</section>;
}

export default function ProjectWorkspace() {
  const [, params] = useRoute("/projects/:id");
  const [, setLocation] = useLocation();
  const projectId = Number(params?.id);
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.video.projects.get.useQuery({ projectId }, { enabled: Number.isFinite(projectId) && projectId > 0 });
  const [selectedSceneId, setSelectedSceneId] = useState<number | null>(null);
  const [draft, setDraft] = useState<SceneDraft>(emptyDraft);
  const [isUploading, setIsUploading] = useState(false);
  const selectedScene = useMemo(() => data?.scenes.find(scene => scene.id === selectedSceneId) ?? data?.scenes[0], [data?.scenes, selectedSceneId]);

  useEffect(() => {
    if (!selectedScene) return;
    setSelectedSceneId(selectedScene.id);
    setDraft({
      title: selectedScene.title,
      narrative: selectedScene.narrative,
      camera: selectedScene.camera ?? "",
      visualPrompt: selectedScene.visualPrompt,
      productionPrompt: selectedScene.productionPrompt,
      storyboardPrompt: selectedScene.storyboardPrompt,
    });
  }, [selectedScene?.id]);

  const refresh = () => utils.video.projects.get.invalidate({ projectId });
  const plan = trpc.video.projects.plan.useMutation({ onSuccess: async result => { toast.success(`${result.scenesCreated} cenas prontas para revisão.`); await refresh(); }, onError: error => toast.error(error.message) });
  const manualPlan = trpc.video.projects.createManualPlan.useMutation({ onSuccess: async () => { toast.success("Plano manual pronto para revisão."); await refresh(); }, onError: error => toast.error(error.message) });
  const requestGeneration = trpc.video.projects.requestVideoGeneration.useMutation({ onSuccess: async () => { toast.success("Geração encaminhada e registrada no orquestrador."); await refresh(); }, onError: async error => { toast.error(error.message); await refresh(); } });
  const pollGeneration = trpc.video.projects.pollVideoGeneration.useMutation({ onSuccess: async result => { toast.success(result.terminal ? `Atualização concluída: ${result.status}.` : "O provedor ainda está processando o vídeo."); await refresh(); }, onError: error => toast.error(error.message) });
  const retryFailed = trpc.video.projects.retryFailed.useMutation({ onSuccess: async () => { toast.success("Projeto retomado como rascunho. Revise o plano antes de gerar novamente."); await refresh(); }, onError: error => toast.error(error.message) });
  const saveScene = trpc.video.scenes.update.useMutation({ onSuccess: async () => { toast.success("Cena atualizada."); await refresh(); }, onError: error => toast.error(error.message) });
  const referenceImage = trpc.video.scenes.generateReference.useMutation({ onSuccess: async () => { toast.success("Imagem de referência gerada."); await refresh(); }, onError: error => toast.error(error.message) });
  const exportManifest = trpc.video.exports.manifest.useMutation({ onSuccess: async result => { toast.success("Manifesto de produção exportado."); window.open(result.url, "_blank", "noopener,noreferrer"); await refresh(); }, onError: error => toast.error(error.message) });
  const upload = trpc.video.assets.upload.useMutation({ onSuccess: async () => { toast.success("Ativo armazenado e associado ao projeto."); await refresh(); }, onError: error => toast.error(error.message) });

  async function onUpload(file: File | undefined) {
    if (!file || !data) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Escolha um arquivo de até 10 MB."); return; }
    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
        reader.readAsDataURL(file);
      });
      await upload.mutateAsync({ projectId, sceneId: selectedScene?.id, name: file.name, mimeType: file.type || "application/octet-stream", base64 });
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-600" /></div>;
  if (error || !data) return <GlassPanel className="mx-auto mt-12 max-w-xl p-8 text-center"><p className="text-lg font-bold">Não foi possível abrir este projeto.</p><Button className="mt-5" onClick={() => setLocation("/")}>Voltar aos projetos</Button></GlassPanel>;

  const { project, scenes, assets, events, runs } = data;
  const isPlanning = plan.isPending || project.status === "planejando";
  const isGenerating = requestGeneration.isPending || project.status === "gerando";
  const activeVideoRun = runs.find(run => run.runType === "vídeo" && run.status === "gerando");
  const videoReferences = assets.flatMap(asset => {
    if (asset.mimeType.startsWith("image/")) return [{ assetId: asset.id }];
    if (asset.mimeType === "audio/mpeg" || asset.mimeType === "audio/wav" || asset.mimeType === "audio/x-wav") return [{ assetId: asset.id, audioDurationSeconds: 8 }];
    return [];
  });
  const createKtdProofPlan = () => manualPlan.mutate({
    projectId,
    creativeSummary: "Vídeo de prova de oito segundos, em tomada única de estúdio, com referência visual de persona e pulso sonoro de apoio.",
    script: "Uma performance curta em estúdio apresenta a persona de referência com presença comercial, textura de luz e ritmo controlado em uma única tomada de oito segundos.",
    scene: {
      title: "Performance de estúdio — vídeo de prova",
      durationSeconds: 8,
      narrative: "A persona de referência encara a câmera em estúdio contemporâneo, com postura confiante e movimento sutil, comunicando autoridade comercial sem fala obrigatória.",
      camera: "Plano médio fechado, dolly-in lento e estável, profundidade de campo suave, luz de recorte azul e coral sobre fundo neutro.",
      visualPrompt: "Live action editorial de estúdio. Preservar a identidade visual da pessoa presente na imagem de referência, expressão confiante, iluminação cinematográfica teal, azul e coral, movimento natural, sem texto na tela.",
      productionPrompt: "Tomada única de oito segundos em 16:9. Use a imagem como referência de personagem e o trecho de áudio de oito segundos como referência de ritmo. Não gerar logotipos, legendas, marcas d'água ou dados pessoais.",
      storyboardPrompt: "Frame inicial com a persona centralizada em estúdio; aproximação suave até meio busto; luz lateral colorida discreta e atmosfera musical editorial.",
    },
  });

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-cyan-700"><ArrowLeft className="h-4 w-4" /> Projetos</Link>
          <div className="flex flex-wrap items-center gap-3"><h1 className="max-w-3xl text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">{project.name}</h1><StatusPill status={project.status as TaskStatus} /></div>
          <p className="max-w-3xl text-sm leading-6 text-slate-500">{project.objective} <span className="mx-2 text-slate-300">/</span> {project.format} <span className="mx-2 text-slate-300">/</span> {project.durationSeconds}s <span className="mx-2 text-slate-300">/</span> {project.language}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-white/80" onClick={() => exportManifest.mutate({ projectId })} disabled={exportManifest.isPending}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
          {project.status === "com falha" && <Button variant="outline" className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100" onClick={() => retryFailed.mutate({ projectId })} disabled={retryFailed.isPending}>{retryFailed.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Workflow className="mr-2 h-4 w-4" />}Retomar projeto</Button>}
          {activeVideoRun && <Button variant="outline" className="bg-white/80" onClick={() => pollGeneration.mutate({ projectId, runId: activeVideoRun.id })} disabled={pollGeneration.isPending}>{pollGeneration.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Workflow className="mr-2 h-4 w-4" />}Atualizar resultado</Button>}
          <Button className="bg-slate-950 text-white hover:bg-slate-800" onClick={() => requestGeneration.mutate({ projectId, duration: 8, references: videoReferences })} disabled={isGenerating || !scenes.length}><Play className="mr-2 h-4 w-4" /> {isGenerating ? "Gerando" : "Gerar vídeo"}</Button>
        </div>
      </header>

      <div className="project-metric-grid">
        <div className="metric-card"><span>Cenas previstas</span><strong>{scenes.length || "—"}</strong><small>roteiro e storyboard</small></div>
        <div className="metric-card metric-card-cyan"><span>Ativos vinculados</span><strong>{assets.length}</strong><small>biblioteca segura</small></div>
        <div className="metric-card metric-card-coral"><span>Eventos do Nexus</span><strong>{events.length}</strong><small>histórico sincronizável</small></div>
        <div className="metric-card metric-card-blue"><span>Execuções</span><strong>{runs.length}</strong><small>auditoria operacional</small></div>
      </div>

      <Tabs defaultValue="review" className="space-y-5">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-white/70 p-1.5 shadow-sm ring-1 ring-slate-200/70">
          <TabsTrigger value="review" className="rounded-xl px-4 py-2.5 font-bold">Revisão</TabsTrigger>
          <TabsTrigger value="storyboard" className="rounded-xl px-4 py-2.5 font-bold">Storyboard</TabsTrigger>
          <TabsTrigger value="assets" className="rounded-xl px-4 py-2.5 font-bold">Ativos</TabsTrigger>
          <TabsTrigger value="results" className="rounded-xl px-4 py-2.5 font-bold">Resultados</TabsTrigger>
          <TabsTrigger value="orchestra" className="rounded-xl px-4 py-2.5 font-bold">Nexus_Orchestra</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-0 space-y-5">
          {!project.script ? (
            <GlassPanel className="relative overflow-hidden p-8 md:p-11"><div className="iso-surface iso-surface-cyan -right-12 -top-10" /><div className="relative max-w-2xl"><span className="eyebrow">PLANEJAMENTO ASSISTIDO</span><h2 className="mt-3 text-2xl font-black tracking-[-0.03em] md:text-3xl">Transforme o briefing em uma produção revisável.</h2><p className="mt-3 leading-7 text-slate-600">O agente gera roteiro, divisão de cenas, linguagem de câmera e prompts de produção. Nada é gerado em vídeo antes da sua revisão.</p><div className="mt-6 flex flex-wrap gap-3"><Button className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={() => plan.mutate({ projectId })} disabled={isPlanning}>{isPlanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{isPlanning ? "Planejando" : "Criar roteiro e cenas"}</Button><Button variant="outline" className="bg-white/85" onClick={createKtdProofPlan} disabled={manualPlan.isPending || isPlanning}>{manualPlan.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Workflow className="mr-2 h-4 w-4" />}Preparar vídeo de prova</Button></div></div></GlassPanel>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.3fr]">
              <GlassPanel className="overflow-hidden"><div className="border-b border-slate-200/70 p-5"><span className="eyebrow">ROTEIRO</span><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{project.script}</p></div><div className="p-3"><p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Cenas</p>{scenes.map(scene => <button key={scene.id} onClick={() => setSelectedSceneId(scene.id)} className={`scene-row w-full ${selectedScene?.id === scene.id ? "scene-row-active" : ""}`}><span className="scene-number">{String(scene.sceneNumber).padStart(2, "0")}</span><span className="min-w-0 flex-1 text-left"><b className="block truncate">{scene.title}</b><small>{scene.durationSeconds}s · {scene.camera || "câmera em revisão"}</small></span><StatusPill status={scene.status as TaskStatus} /><ChevronRight className="h-4 w-4 text-slate-400" /></button>)}</div></GlassPanel>
              <GlassPanel className="p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div><span className="eyebrow">CENA {selectedScene?.sceneNumber}</span><h2 className="mt-1 text-xl font-black tracking-tight">{selectedScene?.title}</h2></div><Button variant="outline" size="sm" onClick={() => selectedScene && referenceImage.mutate({ sceneId: selectedScene.id })} disabled={!selectedScene || referenceImage.isPending}>{referenceImage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}Referência</Button></div>
                <div className="mt-6 grid gap-5"><div><Label htmlFor="scene-title">Título</Label><Input id="scene-title" className="mt-2 bg-white/80" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></div><div><Label htmlFor="narrative">Ação e narrativa</Label><Textarea id="narrative" className="mt-2 min-h-25 bg-white/80" value={draft.narrative} onChange={e => setDraft({ ...draft, narrative: e.target.value })} /></div><div className="grid gap-5 md:grid-cols-2"><div><Label htmlFor="camera">Câmera</Label><Textarea id="camera" className="mt-2 min-h-24 bg-white/80" value={draft.camera} onChange={e => setDraft({ ...draft, camera: e.target.value })} /></div><div><Label htmlFor="visual-prompt">Prompt visual</Label><Textarea id="visual-prompt" className="mt-2 min-h-24 bg-white/80" value={draft.visualPrompt} onChange={e => setDraft({ ...draft, visualPrompt: e.target.value })} /></div></div><div><Label htmlFor="production-prompt">Prompt de produção</Label><Textarea id="production-prompt" className="mt-2 min-h-28 bg-white/80" value={draft.productionPrompt} onChange={e => setDraft({ ...draft, productionPrompt: e.target.value })} /></div><Button className="justify-self-end bg-slate-950 text-white hover:bg-slate-800" onClick={() => selectedScene && saveScene.mutate({ sceneId: selectedScene.id, data: draft })} disabled={!selectedScene || saveScene.isPending}>{saveScene.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar cena</Button></div>
              </GlassPanel>
            </div>
          )}
        </TabsContent>

        <TabsContent value="storyboard" className="mt-0"><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{scenes.length ? scenes.map(scene => <GlassPanel key={scene.id} className="overflow-hidden"><div className="storyboard-frame">{scene.referenceImageUrl ? <img src={scene.referenceImageUrl} alt={`Referência visual da cena ${scene.sceneNumber}`} /> : <><div className="iso-surface iso-surface-blue left-7 top-7" /><div className="iso-surface iso-surface-coral bottom-9 right-10" /><Clapperboard className="relative h-7 w-7 text-slate-500" /></>}</div><div className="p-5"><div className="flex items-center justify-between gap-3"><span className="eyebrow">CENA {String(scene.sceneNumber).padStart(2, "0")}</span><StatusPill status={scene.status as TaskStatus} /></div><h3 className="mt-2 font-black">{scene.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{scene.narrative}</p><Button variant="ghost" className="mt-3 h-auto px-0 text-cyan-700 hover:bg-transparent hover:text-cyan-900" onClick={() => { setSelectedSceneId(scene.id); document.querySelector<HTMLButtonElement>('[data-slot="tabs-trigger"][value="review"]')?.click(); }}>Revisar cena <ChevronRight className="ml-1 h-4 w-4" /></Button></div></GlassPanel>) : <GlassPanel className="col-span-full p-9 text-center"><p className="font-bold">O storyboard aparecerá após o planejamento.</p></GlassPanel>}</div></TabsContent>

        <TabsContent value="assets" className="mt-0"><div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]"><GlassPanel className="p-6"><span className="eyebrow">BIBLIOTECA SEGURA</span><h2 className="mt-2 text-xl font-black">Arquivos de referência</h2><p className="mt-2 text-sm leading-6 text-slate-600">Envie imagens, documentos ou mídia de apoio. O arquivo é armazenado no projeto e pode ser associado à cena ativa.</p><div className="mt-6 flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300 bg-cyan-50/40 p-5 text-center"><FileUp className="mb-3 h-6 w-6 text-cyan-700" /><Label htmlFor="asset-file" className="text-sm font-bold text-cyan-800">{isUploading ? "Armazenando ativo…" : "Selecionar arquivo"}</Label><small className="mt-1 text-xs text-slate-500">até 10 MB</small><Input id="asset-file" type="file" className="mt-4 max-w-sm cursor-pointer bg-white/90 text-sm" disabled={isUploading} onChange={event => onUpload(event.target.files?.[0])} /></div></GlassPanel><GlassPanel className="p-3">{assets.length ? <div className="divide-y divide-slate-100">{assets.map(asset => <div key={asset.id} className="flex items-center gap-3 p-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><FileUp className="h-4 w-4" /></div><div className="min-w-0 flex-1"><b className="block truncate text-sm">{asset.name}</b><small className="text-xs text-slate-500">{asset.kind} · {asset.mimeType}</small></div><a href={asset.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-cyan-700">Abrir</a></div>)}</div> : <div className="grid min-h-64 place-items-center text-center text-sm text-slate-500">Nenhum ativo associado a este projeto.</div>}</GlassPanel></div></TabsContent>

        <TabsContent value="results" className="mt-0"><ResultsPanel status={project.status as TaskStatus} runs={runs} assets={assets} onExport={() => exportManifest.mutate({ projectId })} exporting={exportManifest.isPending} onPoll={activeVideoRun ? () => pollGeneration.mutate({ projectId, runId: activeVideoRun.id }) : undefined} polling={pollGeneration.isPending} /></TabsContent>

        <TabsContent value="orchestra" className="mt-0"><div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"><GlassPanel className="overflow-hidden p-6"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-200"><Bot className="h-5 w-5" /></div><div><span className="eyebrow">ORQUESTRAÇÃO</span><h2 className="font-black">Nexus_Orchestra</h2></div></div><p className="mt-5 text-sm leading-6 text-slate-600">Cada alteração relevante gera um evento persistido. Quando um endpoint autorizado for configurado, o adaptador envia o envelope assinado e mantém o resultado de entrega no histórico.</p><div className="mt-5 rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-6 text-cyan-100">source: jhon-bly-cly-video<br />schemaVersion: 1.0<br />event delivery: auditável</div><div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Outbox transacional habilitado</div></GlassPanel><GlassPanel className="overflow-hidden"><div className="border-b border-slate-200/70 px-5 py-4"><span className="eyebrow">LINHA DE EVENTOS</span></div>{events.length ? <div className="max-h-[420px] overflow-auto">{events.map(event => <div key={event.id} className="flex gap-4 border-b border-slate-100 p-5 last:border-0"><div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-50 text-cyan-700"><Workflow className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><b className="font-mono text-xs text-slate-800">{event.eventName}</b><span className={`text-xs font-bold ${event.deliveryStatus === "entregue" ? "text-emerald-700" : "text-amber-700"}`}>{event.deliveryStatus}</span></div><p className="mt-1 text-sm text-slate-500">{new Date(event.occurredAt).toLocaleString("pt-BR")}</p>{event.deliveryError && <p className="mt-2 text-xs text-amber-700">{event.deliveryError}</p>}</div></div>)}</div> : <div className="grid min-h-72 place-items-center p-8 text-center text-sm text-slate-500">Os eventos de planejamento, cenas, ativos e geração aparecerão aqui.</div>}</GlassPanel></div></TabsContent>
      </Tabs>
    </div>
  );
}

function ResultsPanel({ status, runs, assets, onExport, exporting, onPoll, polling }: { status: TaskStatus; runs: Array<{ id: number; runType: string; status: string; output: unknown; errorMessage: string | null; startedAt: Date; finishedAt: Date | null }>; assets: Array<{ id: number; name: string; kind: string; mimeType: string; url: string; createdAt: Date }>; onExport: () => void; exporting: boolean; onPoll?: () => void; polling: boolean }) {
  const deliveries = assets.filter(asset => asset.kind === "resultado de vídeo" || asset.kind === "exportação");
  return <div className="space-y-5"><GlassPanel className="relative overflow-hidden p-6"><div className="iso-surface iso-surface-blue -right-8 -top-10" /><div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><span className="eyebrow">RESULTADOS E ENTREGAS</span><h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">Acompanhe os retornos da produção.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">O painel consolida os pedidos processados, arquivos de vídeo que retornarem pelo orquestrador e manifestos exportados do projeto.</p></div><Button className="bg-slate-950 text-white hover:bg-slate-800" onClick={onExport} disabled={exporting}>{exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Exportar manifesto</Button></div>{status === "gerando" && <div role="status" className="relative mt-5 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 text-sm text-cyan-900"><b className="font-black">Pedido de vídeo em andamento.</b> A solicitação foi registrada e encaminhada para a orquestração. Quando o provedor devolver um resultado, o ativo final ficará disponível nesta área.</div>}</GlassPanel><div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]"><GlassPanel className="overflow-hidden"><div className="border-b border-slate-200/70 p-5"><span className="eyebrow">EXECUÇÕES</span></div>{runs.length ? <div className="divide-y divide-slate-100">{runs.map(run => <div key={run.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><b className="text-sm capitalize">{run.runType.replace("_", " ")}</b><p className="mt-1 text-xs text-slate-500">{new Date(run.startedAt).toLocaleString("pt-BR")}</p></div><StatusPill status={run.status as TaskStatus} /></div>{run.errorMessage && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700">{run.errorMessage}</p>}{run.output ? <p className="mt-3 line-clamp-2 font-mono text-xs leading-5 text-slate-500">{JSON.stringify(run.output)}</p> : null}</div>)}</div> : <div className="grid min-h-60 place-items-center p-8 text-center text-sm text-slate-500">Ainda não há execuções registradas.</div>}</GlassPanel><GlassPanel className="overflow-hidden"><div className="border-b border-slate-200/70 p-5"><span className="eyebrow">ENTREGAS DISPONÍVEIS</span></div>{deliveries.length ? <div className="divide-y divide-slate-100">{deliveries.map(asset => <div key={asset.id} className="flex items-center gap-3 p-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Download className="h-4 w-4" /></div><div className="min-w-0 flex-1"><b className="block truncate text-sm">{asset.name}</b><small className="block pt-1 text-xs text-slate-500">{asset.kind} · {asset.mimeType}</small></div><a href={asset.url} target="_blank" rel="noreferrer" className="text-xs font-black text-cyan-700">Abrir</a></div>)}</div> : <div className="grid min-h-60 place-items-center p-8 text-center"><div><p className="font-bold text-slate-700">Nenhum resultado final disponível.</p><p className="mt-2 text-sm leading-6 text-slate-500">Exporte um manifesto agora ou aguarde a conclusão da geração orquestrada.</p></div></div>}</GlassPanel></div></div>;
}
