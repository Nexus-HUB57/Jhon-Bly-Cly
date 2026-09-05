import { IsometricMark } from "@/components/IsometricMark";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import type { TaskStatus } from "@shared/video";
import { ArrowUpRight, Clapperboard, Clock3, Film, FolderOpen, Languages, LayoutPanelTop, Loader2, Plus, Sparkles, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const initialForm = { name: "", briefing: "", format: "16:9" as "16:9" | "9:16" | "1:1" | "4:5" | "custom", durationSeconds: 30, language: "Português (Brasil)", objective: "", creativeDirection: "" };

export default function Home() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: projects = [], isLoading } = trpc.video.projects.list.useQuery();
  const [form, setForm] = useState(initialForm);
  const [open, setOpen] = useState(false);
  const create = trpc.video.projects.create.useMutation({
    onSuccess: async ({ projectId }) => { await utils.video.projects.list.invalidate(); toast.success("Projeto criado como rascunho."); setOpen(false); setForm(initialForm); setLocation(`/projects/${projectId}`); },
    onError: error => toast.error(error.message),
  });
  const activeCount = useMemo(() => projects.filter(project => !["concluído", "com falha"].includes(project.status)).length, [projects]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-10">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/75 px-6 py-8 shadow-[0_20px_60px_rgba(42,81,136,0.08)] backdrop-blur-sm md:px-9 md:py-10">
        <div className="iso-surface iso-surface-cyan -right-6 top-7 hidden md:block" /><div className="iso-surface iso-surface-coral bottom-0 right-32 hidden md:block" /><div className="iso-line absolute right-0 top-0 hidden h-full w-2/5 md:block" />
        <div className="relative max-w-3xl"><div className="flex items-center gap-3"><IsometricMark /><span className="eyebrow">JHON BLY CLY / VIDEO STUDIO</span></div><h1 className="mt-5 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">Da ideia à decisão de produção, com cada etapa visível.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">Estruture briefs, transforme-os em roteiro e storyboard, revise direções e acompanhe cada evento de geração com o Nexus_Orchestra.</p><div className="mt-7"><CreateProjectDialog form={form} setForm={setForm} open={open} setOpen={setOpen} onSubmit={() => create.mutate(form)} pending={create.isPending} /></div></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={FolderOpen} label="Projetos" value={String(projects.length).padStart(2, "0")} note="catálogo do workspace" /><Stat icon={Workflow} label="Em andamento" value={String(activeCount).padStart(2, "0")} note="operações ativas" accent="cyan" /><Stat icon={Clapperboard} label="Pipeline" value="06" note="estados controlados" accent="coral" /><Stat icon={LayoutPanelTop} label="Integração" value="E" note="eventos rastreáveis" accent="blue" /></section>

      <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">SEUS PROJETOS</span><h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">Mesa de produção</h2></div><p className="max-w-sm text-sm text-slate-500">Escolha um projeto para revisar roteiro, storyboard, ativos e eventos.</p></div>{isLoading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-cyan-600" /></div> : projects.length ? <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{projects.map(project => <button key={project.id} className="project-card group text-left" onClick={() => setLocation(`/projects/${project.id}`)}><div className="flex items-start justify-between gap-3"><div className="project-card-icon"><Film className="h-5 w-5" /></div><StatusPill status={project.status as TaskStatus} /></div><h3 className="mt-7 line-clamp-2 text-xl font-black tracking-tight text-slate-900">{project.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{project.objective}</p><div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{project.durationSeconds}s</span><span className="flex items-center gap-1.5">{project.format}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span></div></button>)}</div> : <EmptyWorkspace onCreate={() => setOpen(true)} />}</section>
    </div>
  );
}

function CreateProjectDialog({ form, setForm, open, setOpen, onSubmit, pending }: { form: typeof initialForm; setForm: React.Dispatch<React.SetStateAction<typeof initialForm>>; open: boolean; setOpen: (value: boolean) => void; onSubmit: () => void; pending: boolean }) {
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="bg-slate-950 text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"><Plus className="mr-2 h-4 w-4" /> Novo projeto</Button></DialogTrigger><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="text-2xl font-black tracking-tight">Criar projeto de vídeo</DialogTitle><DialogDescription>Comece pelo briefing. Você poderá revisar todos os artefatos antes de solicitar geração.</DialogDescription></DialogHeader><div className="grid gap-5 py-3"><div><Label htmlFor="name">Nome do projeto</Label><Input id="name" className="mt-2" placeholder="Ex.: Manifesto da nova coleção" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></div><div><Label htmlFor="briefing">Briefing</Label><Textarea id="briefing" className="mt-2 min-h-32" placeholder="Contexto, público, mensagem central e restrições de criação." value={form.briefing} onChange={event => setForm({ ...form, briefing: event.target.value })} /></div><div className="grid gap-5 sm:grid-cols-2"><div><Label>Formato</Label><Select value={form.format} onValueChange={value => setForm({ ...form, format: value as typeof form.format })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="16:9">16:9 · Paisagem</SelectItem><SelectItem value="9:16">9:16 · Vertical</SelectItem><SelectItem value="1:1">1:1 · Quadrado</SelectItem><SelectItem value="4:5">4:5 · Feed</SelectItem><SelectItem value="custom">Customizado</SelectItem></SelectContent></Select></div><div><Label htmlFor="duration">Duração (segundos)</Label><Input id="duration" className="mt-2" type="number" min={8} max={300} value={form.durationSeconds} onChange={event => setForm({ ...form, durationSeconds: Number(event.target.value) })} /></div></div><div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="language">Idioma</Label><div className="relative mt-2"><Languages className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input id="language" className="pl-9" value={form.language} onChange={event => setForm({ ...form, language: event.target.value })} /></div></div><div><Label htmlFor="objective">Objetivo</Label><Input id="objective" className="mt-2" placeholder="Ex.: Gerar reconhecimento de marca" value={form.objective} onChange={event => setForm({ ...form, objective: event.target.value })} /></div></div><div><Label htmlFor="direction">Direção criativa <span className="font-normal text-slate-400">(opcional)</span></Label><Textarea id="direction" className="mt-2 min-h-20" placeholder="Referências visuais, tom, câmera, ritmo, paleta ou elementos obrigatórios." value={form.creativeDirection} onChange={event => setForm({ ...form, creativeDirection: event.target.value })} /></div><Button className="w-full bg-cyan-600 text-white hover:bg-cyan-700" onClick={onSubmit} disabled={pending}>{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Criar rascunho</Button></div></DialogContent></Dialog>;
}

function Stat({ icon: Icon, label, value, note, accent = "slate" }: { icon: typeof FolderOpen; label: string; value: string; note: string; accent?: "slate" | "cyan" | "coral" | "blue" }) {
  return <div className={`stat-card stat-card-${accent}`}><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">{label}</span><Icon className="h-4 w-4 text-slate-500" /></div><strong className="mt-5 block text-3xl font-black tracking-tight text-slate-950">{value}</strong><small className="mt-1 block text-xs text-slate-500">{note}</small></div>;
}

function EmptyWorkspace({ onCreate }: { onCreate: () => void }) {
  return <div className="relative overflow-hidden rounded-[26px] border border-dashed border-slate-300 bg-white/60 px-7 py-12 text-center"><div className="iso-surface iso-surface-blue left-[20%] top-6 opacity-60" /><div className="iso-surface iso-surface-coral bottom-2 right-[20%] opacity-60" /><div className="relative mx-auto max-w-md"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><Film className="h-6 w-6" /></div><h3 className="mt-5 text-xl font-black">Seu estúdio está pronto para o primeiro briefing.</h3><p className="mt-2 text-sm leading-6 text-slate-500">Crie o projeto, estruture a intenção e deixe a produção acontecer de maneira revisável.</p><Button className="mt-6 bg-slate-950 text-white hover:bg-slate-800" onClick={onCreate}><Plus className="mr-2 h-4 w-4" /> Criar primeiro projeto</Button></div></div>;
}
