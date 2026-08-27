import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Blocks, CheckCircle2, Copy, ExternalLink, FileWarning, KeyRound, Layers3, Loader2, Send, Server, ShieldCheck, ShieldOff, Waypoints } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const routeMeta = {
  catálogo: { label: "Catálogo", className: "bg-slate-100 text-slate-700" },
  adaptador: { label: "Adaptador", className: "bg-cyan-50 text-cyan-800" },
  referência: { label: "Referência", className: "bg-blue-50 text-blue-800" },
  bloqueado: { label: "Bloqueado", className: "bg-rose-50 text-rose-800" },
};

export default function EcosystemFusion() {
  const [route, setRoute] = useState<"todos" | "catálogo" | "adaptador" | "referência" | "bloqueado">("todos");
  const { data, isLoading, error } = trpc.fusion.catalog.useQuery(route === "todos" ? undefined : { route });
  const { data: adapterRegistry } = trpc.fusion.adapters.useQuery();
  const { data: providerRuntime } = trpc.fusion.providers.useQuery();
  const { data: connectors = [], isLoading: connectorsLoading } = trpc.fusion.connectors.useQuery();
  const envelope = trpc.fusion.syncEnvelope.useQuery(undefined, { enabled: false });
  const utils = trpc.useUtils();
  const [copied, setCopied] = useState(false);
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const stageConnector = trpc.fusion.stageConnector.useMutation({
    onSuccess: async result => {
      await utils.fusion.connectors.invalidate();
      toast.success(result.nextStep);
    },
    onError: mutationError => toast.error(mutationError.message),
  });
  const stageAdapter = trpc.fusion.stageAdapter.useMutation({
    onSuccess: async result => {
      await utils.fusion.adapters.invalidate();
      toast.success(result.nextStep);
    },
    onError: mutationError => toast.error(mutationError.message),
  });
  const sync = trpc.fusion.sync.useMutation({
    onSuccess: result => {
      if (result.deliveryStatus === "entregue") toast.success("Fusão sincronizada com o Nexus_Orchestra.");
      else toast.info(result.error ?? "Evento persistido; aguardando endpoint do Nexus_Orchestra.");
    },
    onError: mutationError => toast.error(mutationError.message),
  });

  async function copyEnvelope() {
    try {
      const result = await envelope.refetch();
      if (!result.data) throw new Error("Envelope indisponível.");
      await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      setCopied(true);
      toast.success("Envelope de sincronização copiado.");
      window.setTimeout(() => setCopied(false), 2_000);
    } catch (copyError) {
      toast.error(copyError instanceof Error ? copyError.message : "Não foi possível copiar o envelope.");
    }
  }

  if (isLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-600" /></div>;
  if (error || !data) return <div className="glass-panel mx-auto mt-12 max-w-xl p-8 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-amber-600" /><h1 className="mt-4 text-xl font-black">Catálogo indisponível</h1><p className="mt-2 text-sm text-slate-500">{error?.message ?? "Não foi possível carregar a fusão do ecossistema."}</p></div>;

  const { summary } = data;
  return <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
    <header className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/75 px-6 py-8 shadow-[0_20px_60px_rgba(42,81,136,0.08)] backdrop-blur-sm md:px-9 md:py-10">
      <div className="iso-surface iso-surface-blue -right-6 top-7 hidden md:block" />
      <div className="iso-surface iso-surface-coral bottom-0 right-32 hidden md:block" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl"><div className="flex items-center gap-2"><Blocks className="h-4 w-4 text-cyan-700" /><span className="eyebrow">FUSÃO MODULAR / NEXUS_ORCHESTRA</span></div><h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-4xl">Ecossistema integrado por capacidades, não por cópia cega.</h1><p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">Os repositórios são inventariados, classificados e conectados por contratos seguros. Código externo não é executado nem incorporado automaticamente.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" className="bg-white/80" onClick={copyEnvelope} disabled={envelope.isFetching}>{envelope.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : copied ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Copiado" : "Copiar envelope"}</Button><Button className="bg-slate-950 text-white hover:bg-slate-800" onClick={() => sync.mutate()} disabled={sync.isPending}>{sync.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Sincronizar</Button></div>
      </div>
    </header>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><FusionMetric label="Inventariados" value={summary.total} icon={Layers3} /><FusionMetric label="Adaptáveis" value={summary.safeToAdapt} icon={Waypoints} tone="cyan" /><FusionMetric label="Contratos JBCx19" value={adapterRegistry?.summary.total ?? 0} icon={Blocks} tone="blue" /><FusionMetric label="Referência" value={adapterRegistry?.summary.referenceOnly ?? 0} icon={FileWarning} tone="slate" /><FusionMetric label="Bloqueados" value={adapterRegistry?.summary.blocked ?? summary.blocked} icon={ShieldOff} tone="coral" /></div>

    <section className="glass-panel overflow-hidden"><div className="flex flex-col gap-2 border-b border-slate-200/70 p-5 md:flex-row md:items-end md:justify-between"><div><span className="eyebrow">RUNTIME DE PROVEDORES</span><h2 className="mt-1 text-xl font-black">Conectores liberados e preservados</h2><p className="mt-2 text-sm leading-6 text-slate-600">Somente provedores ativos podem ser acionados pelo backend. Os inativos são preservados como configuração, sem chamadas externas.</p></div><span className="text-xs font-bold text-slate-500">{providerRuntime?.summary.active ?? 0} ativos · {providerRuntime?.summary.inactive ?? 0} inativos</span></div><div className="divide-y divide-slate-100">{providerRuntime?.items.map(provider => <div key={provider.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{provider.name}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${provider.status === "ativo" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{provider.status}</span></div><p className="mt-1 text-sm text-slate-600">{provider.integration}</p><p className="mt-1 text-xs text-slate-500">{provider.rationale}</p></div><div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{provider.activation}</div></div>)}</div></section>

    <section className="glass-panel overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200/70 p-5 md:flex-row md:items-end md:justify-between"><div><span className="eyebrow">CONECTORES SEGUROS</span><h2 className="mt-1 text-xl font-black">Preparação sem expor credenciais</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">O registro JBCx19 consolida {adapterRegistry?.summary.total ?? 19} contratos públicos. Somente fontes elegíveis podem ser preparadas; a ativação permanece pendente até que a credencial oficial ou infraestrutura externa seja fornecida pelo proprietário.</p></div><span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500"><KeyRound className="h-4 w-4" />BYOK permanece no servidor</span></div>
      <div className="divide-y divide-slate-100">{connectorsLoading ? <div className="grid min-h-36 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-cyan-600" /></div> : connectors.map(connector => {
        const profileStatus = connector.profile?.status ?? (connector.configurationStatus === "bloqueado" ? "bloqueado" : "não configurado");
        const blocked = connector.configurationStatus === "bloqueado";
        return <article key={connector.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${blocked ? "bg-rose-50 text-rose-700" : "bg-cyan-50 text-cyan-700"}`}>{blocked ? <ShieldOff className="h-4 w-4" /> : <Server className="h-4 w-4" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{connector.name}</h3><ConnectorStatus status={profileStatus} /></div><p className="mt-1 text-sm leading-6 text-slate-600">{connector.rationale}</p><p className="mt-2 text-xs leading-5 text-slate-500">{connector.guardrail}</p><div className="mt-2 flex flex-wrap gap-1.5">{connector.capabilities.map(capability => <span key={capability} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{capability}</span>)}</div></div></div><Button variant={blocked ? "outline" : "default"} className={blocked ? "border-rose-200 text-rose-700" : "bg-slate-950 text-white hover:bg-slate-800"} disabled={blocked || stageConnector.isPending} onClick={() => stageConnector.mutate({ connectorId: connector.id })}>{blocked ? "Integração bloqueada" : stageConnector.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}{blocked ? null : connector.credentialMode === "BYOK" ? "Preparar BYOK" : "Preparar infraestrutura"}</Button></article>;
      })}</div>
    </section>

    <section className="glass-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200/70 p-5 md:flex-row md:items-end md:justify-between"><div><span className="eyebrow">MATRIZ DE ATIVAÇÃO JBCX19</span><h2 className="mt-1 text-xl font-black">Contratos e estado por adaptador</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cada fonte possui um contrato público, uma exigência de ativação e um bloqueio explícito quando a execução não é permitida.</p></div><span className="text-xs font-bold text-slate-500">{adapterRegistry?.summary.configurable ?? 0} prontos para configurar</span></div>
      <div className="max-h-[680px] divide-y divide-slate-100 overflow-auto">{adapterRegistry?.items.map(adapter => {
        const profileStatus = adapter.profile?.status ?? (adapter.status === "bloqueado" ? "bloqueado" : "não configurado");
        const blocked = adapter.activationMode === "bloqueado";
        return <article key={adapter.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-mono text-sm font-black text-slate-900">{adapter.repository}</h3><ConnectorStatus status={profileStatus} /><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">{adapter.activationMode}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{adapter.contract}</p><div className="mt-3 grid gap-2 md:grid-cols-2"><FusionField label="Ativação" value={adapter.activationRequirement} /><FusionField label="Proteção" value={adapter.guardrail} /></div></div><Button variant={blocked ? "outline" : "default"} className={blocked ? "border-rose-200 text-rose-700" : "shrink-0 bg-slate-950 text-white hover:bg-slate-800"} disabled={blocked || stageAdapter.isPending} onClick={() => stageAdapter.mutate({ adapterId: adapter.id })}>{blocked ? "Bloqueado" : stageAdapter.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}{blocked ? null : "Preparar"}</Button></article>;
      })}</div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[0.74fr_1.26fr]">
      <div className="glass-panel p-6"><span className="eyebrow">POLÍTICA DE FUSÃO</span><h2 className="mt-2 text-xl font-black tracking-tight">Quatro camadas para manter controle.</h2><div className="mt-6 space-y-4"><Policy icon={ShieldCheck} title="Adaptar com revisão" copy="Padrões de harness e MCP com licenças claras podem orientar conectores e contratos, sem execução dinâmica." tone="cyan" /><Policy icon={Layers3} title="Catalogar, não embutir" copy="Modelos, listas de recursos e prompts sem licença assertiva ficam disponíveis como metadados de decisão." tone="blue" /><Policy icon={KeyRound} title="Segredos oficiais, nunca coletados" copy="Scripts de coleta, classificação, cópia ou reutilização de tokens encontrados em repositórios são proibidos; só segredos oficiais ativam conectores." tone="cyan" /><Policy icon={ShieldOff} title="Bloquear conteúdo sensível" copy="Fontes de prompts internos, vazamentos ou rotas que contornem provedores são explicitamente excluídas do runtime." tone="coral" /></div><div className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-4"><p className="font-mono text-xs leading-6 text-cyan-100">event: ecosystem.fusion.catalog.synchronized<br />schema: 1.0<br />delivery: pronto para orquestração</p></div></div>
      <div className="glass-panel overflow-hidden"><div className="border-b border-slate-200/70 p-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">CATÁLOGO DE CAPACIDADES</span><h2 className="mt-1 text-xl font-black">{items.length} fontes no filtro atual</h2></div><Tabs value={route} onValueChange={value => setRoute(value as typeof route)}><TabsList className="h-auto flex-wrap justify-start gap-1 rounded-xl bg-slate-100/80 p-1"><TabsTrigger value="todos" className="rounded-lg px-2.5 py-1.5 text-xs font-bold">Todos</TabsTrigger><TabsTrigger value="adaptador" className="rounded-lg px-2.5 py-1.5 text-xs font-bold">Adaptar</TabsTrigger><TabsTrigger value="catálogo" className="rounded-lg px-2.5 py-1.5 text-xs font-bold">Catálogo</TabsTrigger><TabsTrigger value="referência" className="rounded-lg px-2.5 py-1.5 text-xs font-bold">Referência</TabsTrigger><TabsTrigger value="bloqueado" className="rounded-lg px-2.5 py-1.5 text-xs font-bold">Bloqueados</TabsTrigger></TabsList></Tabs></div></div><div className="max-h-[680px] overflow-auto">{items.map(item => <article key={item.repository} className="border-b border-slate-100 p-5 last:border-0"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-mono text-sm font-black text-slate-900">{item.repository}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${routeMeta[item.route].className}`}>{routeMeta[item.route].label}</span><RiskPill risk={item.risk} /></div><p className="mt-2 text-sm leading-6 text-slate-600">{item.purpose}</p></div><a href={item.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${item.repository} no GitHub`} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-cyan-700"><ExternalLink className="h-4 w-4" /></a></div><div className="mt-4 grid gap-3 md:grid-cols-2"><FusionField label="Integração" value={item.integration} /><FusionField label="Proteção" value={item.guardrail} /></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>Licença: <b className="text-slate-700">{item.license}</b></span><span>Linguagem: <b className="text-slate-700">{item.language}</b></span><span>Commit: <b className="font-mono text-slate-700">{item.commit}</b></span></div></article>)}</div></div>
    </section>
  </div>;
}

function FusionMetric({ label, value, icon: Icon, tone = "slate" }: { label: string; value: number; icon: typeof Layers3; tone?: "slate" | "cyan" | "blue" | "coral" }) {
  return <div className={`stat-card stat-card-${tone}`}><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">{label}</span><Icon className="h-4 w-4 text-slate-500" /></div><strong className="mt-5 block text-3xl font-black tracking-tight text-slate-950">{String(value).padStart(2, "0")}</strong></div>;
}

function Policy({ icon: Icon, title, copy, tone }: { icon: typeof ShieldCheck; title: string; copy: string; tone: "cyan" | "blue" | "coral" }) {
  const toneClasses = { cyan: "bg-cyan-50 text-cyan-700", blue: "bg-blue-50 text-blue-700", coral: "bg-rose-50 text-rose-700" };
  return <div className="flex gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}><Icon className="h-4 w-4" /></div><div><h3 className="text-sm font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p></div></div>;
}

function RiskPill({ risk }: { risk: string }) {
  const styles: Record<string, string> = { baixo: "bg-emerald-50 text-emerald-700", médio: "bg-amber-50 text-amber-700", alto: "bg-orange-50 text-orange-700", bloqueado: "bg-rose-50 text-rose-700" };
  return <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${styles[risk] ?? styles.médio}`}>{risk}</span>;
}

function ConnectorStatus({ status }: { status: string }) {
  const styles: Record<string, string> = { "não configurado": "bg-slate-100 text-slate-600", "aguardando credencial": "bg-amber-50 text-amber-700", ativo: "bg-emerald-50 text-emerald-700", bloqueado: "bg-rose-50 text-rose-700" };
  return <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${styles[status] ?? styles["não configurado"]}`}>{status}</span>;
}

function FusionField({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50/80 p-3"><span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</span><p className="mt-1 text-xs leading-5 text-slate-600">{value}</p></div>;
}
