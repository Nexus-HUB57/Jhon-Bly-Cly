import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AudioLines, CheckCircle2, Clapperboard, FileText, FileUp, ImageIcon, Loader2, Search, ShieldCheck, Sparkles, UploadCloud, Video } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const MAX_REFERENCE_BYTES = 50 * 1024 * 1024;
const accept = ".mp3,.wav,.mp4,.mov,.webm,.jpg,.jpeg,.png,.webp,.gif,.txt,.pdf,.doc,.docx";
const categories = ["todas", "imagem", "áudio", "vídeo", "documento", "texto"] as const;

type Category = Exclude<(typeof categories)[number], "todas">;

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function CategoryIcon({ category }: { category: Category }) {
  const Icon = category === "imagem" ? ImageIcon : category === "áudio" ? AudioLines : category === "vídeo" ? Video : FileText;
  return <Icon className="h-4 w-4" />;
}

export default function References() {
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const { data: references = [], isLoading } = trpc.references.list.useQuery();
  const upload = trpc.references.upload.useMutation({
    onSuccess: async () => {
      await utils.references.list.invalidate();
      toast.success("Referência armazenada e disponível para os agentes.");
      setSelectedFile(null);
      setPurpose("");
      setIndexText("");
      setAgentUse("referência criativa");
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: error => toast.error(error.message),
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [purpose, setPurpose] = useState("");
  const [indexText, setIndexText] = useState("");
  const [agentUse, setAgentUse] = useState("referência criativa");
  const [filter, setFilter] = useState<(typeof categories)[number]>("todas");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => references.filter(reference => (filter === "todas" || reference.category === filter) && `${reference.name} ${reference.agentUse} ${reference.purpose ?? ""}`.toLowerCase().includes(query.toLowerCase())), [references, filter, query]);

  function onSelectFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_REFERENCE_BYTES) {
      toast.error("Escolha um arquivo de até 50 MB.");
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !accept.includes(`.${extension}`)) {
      toast.error("Formato não permitido para a biblioteca de Referências.");
      return;
    }
    setSelectedFile(file);
  }

  async function submitUpload() {
    if (!selectedFile) {
      toast.error("Selecione um arquivo de referência.");
      return;
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Não foi possível ler o arquivo selecionado."));
      reader.readAsDataURL(selectedFile);
    });
    upload.mutate({ name: selectedFile.name, mimeType: selectedFile.type || "application/octet-stream", base64, agentUse, purpose: purpose || undefined, indexText: indexText || undefined });
  }

  return <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
    <header className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/75 px-6 py-8 shadow-[0_20px_60px_rgba(42,81,136,0.08)] backdrop-blur-sm md:px-9 md:py-10"><div className="iso-surface iso-surface-cyan -right-6 top-7 hidden md:block" /><div className="iso-surface iso-surface-coral bottom-0 right-32 hidden md:block" /><div className="relative max-w-3xl"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-700" /><span className="eyebrow">BIBLIOTECA PARA AGENTES</span></div><h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">Referências que dão contexto à criação audiovisual.</h1><p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">Centralize áudio, vídeo, imagem, documentos e textos para que os agentes interpretem a intenção criativa antes do planejamento e da produção.</p></div></header>

    <section className="grid gap-5 xl:grid-cols-[0.74fr_1.26fr]">
      <div className="glass-panel p-6"><span className="eyebrow">NOVA REFERÊNCIA</span><h2 className="mt-2 text-xl font-black tracking-tight">Enviar ativo de contexto</h2><p className="mt-2 text-sm leading-6 text-slate-600">Arquivos de até <b>50 MB</b>, guardados com segurança e vinculados ao seu workspace.</p>
        <Label htmlFor="reference-file" className="mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300 bg-cyan-50/40 p-5 text-center transition-colors hover:bg-cyan-50"><UploadCloud className="mb-3 h-7 w-7 text-cyan-700" /><span className="text-sm font-bold text-cyan-800">{selectedFile ? selectedFile.name : "Selecionar arquivo"}</span><small className="mt-1 text-xs text-slate-500">MP3, WAV, MP4, MOV, JPG, PNG, TXT, PDF, DOC e DOCX · até 50 MB</small><input ref={inputRef} id="reference-file" type="file" className="sr-only" accept={accept} onChange={event => onSelectFile(event.target.files?.[0])} /></Label>
        {selectedFile && <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-cyan-700"><FileUp className="h-4 w-4" /></div><div className="min-w-0"><b className="block truncate text-sm">{selectedFile.name}</b><small className="text-xs text-slate-500">{formatBytes(selectedFile.size)}</small></div><CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" /></div>}
        <div className="mt-5"><Label>Como os agentes devem usar</Label><Select value={agentUse} onValueChange={setAgentUse}><SelectTrigger className="mt-2 bg-white/80"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="referência criativa">Referência criativa</SelectItem><SelectItem value="identidade visual">Identidade visual</SelectItem><SelectItem value="ritmo e música">Ritmo e música</SelectItem><SelectItem value="roteiro e narrativa">Roteiro e narrativa</SelectItem><SelectItem value="técnica de produção">Técnica de produção</SelectItem></SelectContent></Select></div>
        <div className="mt-5"><Label htmlFor="reference-purpose">Finalidade <span className="font-normal text-slate-400">(opcional)</span></Label><Textarea id="reference-purpose" className="mt-2 min-h-24 bg-white/80" value={purpose} onChange={event => setPurpose(event.target.value)} placeholder="Ex.: preservar o tom de voz, a progressão musical ou a luz do ambiente." /></div>
        <div className="mt-5"><Label htmlFor="reference-index-text">Extrato para memória <span className="font-normal text-slate-400">(opcional para PDF, DOC e DOCX)</span></Label><Textarea id="reference-index-text" className="mt-2 min-h-24 bg-white/80" value={indexText} onChange={event => setIndexText(event.target.value)} maxLength={12000} placeholder="Cole um resumo ou trecho curado para recuperação contextual. O arquivo binário não é executado nem interpretado automaticamente." /></div>
        <Button className="mt-5 w-full bg-slate-950 text-white hover:bg-slate-800" onClick={submitUpload} disabled={!selectedFile || upload.isPending}>{upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}{upload.isPending ? "Armazenando referência…" : "Adicionar à biblioteca"}</Button>
        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />O arquivo fica no armazenamento privado do workspace; os agentes recebem metadados e contexto de uso pelo backend.</div>
      </div>

      <div className="glass-panel overflow-hidden"><div className="border-b border-slate-200/70 p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><span className="eyebrow">ACERVO DO WORKSPACE</span><h2 className="mt-1 text-xl font-black">{references.length} referências disponíveis</h2></div><div className="relative w-full lg:w-72"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input aria-label="Buscar referências" className="bg-white pl-9" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por arquivo ou uso" /></div></div><div className="mt-4 flex flex-wrap gap-2">{categories.map(category => <Button key={category} size="sm" variant={filter === category ? "default" : "outline"} className={filter === category ? "bg-slate-950 text-white" : "bg-white"} onClick={() => setFilter(category)}>{category === "todas" ? "Todas" : category}</Button>)}</div></div>
        {isLoading ? <div className="grid min-h-72 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-cyan-600" /></div> : filtered.length ? <div className="divide-y divide-slate-100">{filtered.map(reference => <article key={reference.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><CategoryIcon category={reference.category as Category} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black">{reference.name}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">{reference.category}</span></div><p className="mt-1 text-sm text-slate-600">{reference.agentUse}{reference.purpose ? ` · ${reference.purpose}` : ""}</p><small className="mt-1 block text-xs text-slate-400">{formatBytes(reference.byteSize)} · {new Date(reference.createdAt).toLocaleString("pt-BR")}</small></div><a href={reference.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-cyan-700 hover:text-cyan-900">Abrir</a></article>)}</div> : <div className="grid min-h-72 place-items-center p-8 text-center"><div><FileText className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-4 font-bold">Nenhuma referência neste filtro.</p><p className="mt-1 text-sm text-slate-500">Adicione um ativo para disponibilizá-lo ao contexto dos agentes.</p></div></div>}
      </div>
    </section>
  </div>;
}
