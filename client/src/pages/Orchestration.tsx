import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Activity, BrainCircuit, CirclePause, Coins, Play, ShieldCheck, Sparkles, Webhook, Workflow } from "lucide-react";
import { TOKEN_QUOTA_PROFILES } from "@shared/tokenQuotaPolicy";
import { useMemo, useState } from "react";

function formatDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleString("pt-BR") : "Ainda não registrado";
}

function statusTone(status: string) {
  if (status === "com falha" || status === "rejeitada") return "destructive" as const;
  if (status === "aguardando revisão" || status === "pendente") return "secondary" as const;
  return "outline" as const;
}

export default function Orchestration() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [previewFailure, setPreviewFailure] = useState<"dashboard" | "providers" | "adapters" | null>(() => {
    if (!import.meta.env.DEV) return null;
    const value = new URLSearchParams(window.location.search).get("orchestrationPreview");
    return value === "dashboard-error" ? "dashboard" : value === "providers-error" ? "providers" : value === "adapters-error" ? "adapters" : null;
  });
  const dashboardQuery = trpc.orchestration.dashboard.useQuery();
  const providersQuery = trpc.fusion.providers.useQuery();
  const adaptersQuery = trpc.fusion.adapters.useQuery();
  const { data, isLoading } = dashboardQuery;
  const providers = providersQuery.data;
  const adapters = adaptersQuery.data;
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryContent, setMemoryContent] = useState("");
  const [pauseReason, setPauseReason] = useState("Revisão humana solicitada");
  const [actionError, setActionError] = useState<string | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [coreMessage, setCoreMessage] = useState<string | null>(null);
  const [routeCapability, setRouteCapability] = useState<"planejamento e orquestração" | "pesquisa e referência" | "mídia generativa" | "arquitetura e telemetria" | "infraestrutura de modelo">("planejamento e orquestração");
  const [routeRisk, setRouteRisk] = useState<"baixo" | "médio" | "alto">("médio");
  const [routeRequest, setRouteRequest] = useState("Organizar uma proposta criativa revisável para o projeto atual.");
  const routeInput = useMemo(() => ({ capability: routeCapability, maxRisk: routeRisk, request: routeRequest.trim() }), [routeCapability, routeRisk, routeRequest]);
  const routerPreview = trpc.fusion.routerPreview.useQuery(routeInput, { enabled: routeInput.request.length >= 3 });

  const retryQuery = (kind: "dashboard" | "providers" | "adapters") => {
    setPreviewFailure(null);
    if (import.meta.env.DEV) {
      const url = new URL(window.location.href);
      url.searchParams.delete("orchestrationPreview");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    }
    if (kind === "dashboard") return dashboardQuery.refetch();
    if (kind === "providers") return providersQuery.refetch();
    return adaptersQuery.refetch();
  };

  const refresh = () => utils.orchestration.dashboard.invalidate();
  const resume = trpc.orchestration.resume.useMutation({ onSuccess: refresh });
  const pause = trpc.orchestration.pause.useMutation({ onSuccess: refresh });
  const runOnce = trpc.orchestration.runOnce.useMutation({ onSuccess: refresh });
  const registerSchedule = trpc.orchestration.registerPeriodicSchedule.useMutation({
    onSuccess: result => {
      setScheduleMessage(`Agendamento ${result.created ? "registrado" : "atualizado"} com segurança.`);
      refresh();
    },
  });
  const saveMemory = trpc.orchestration.saveMemory.useMutation({
    onSuccess: () => {
      setMemoryTitle("");
      setMemoryContent("");
      refresh();
    },
  });
  const review = trpc.orchestration.reviewProposal.useMutation({ onSuccess: refresh });
  const reviewMemory = trpc.orchestration.reviewMemory.useMutation({ onSuccess: refresh, onError: error => setActionError(error.message) });
  const stageCatalogEntry = trpc.orchestration.stageCatalogEntry.useMutation({ onSuccess: refresh, onError: error => setActionError(error.message) });
  const proposeCatalogAction = trpc.orchestration.proposeCatalogAction.useMutation({ onSuccess: refresh, onError: error => setActionError(error.message) });
  const retrieveMemory = trpc.orchestration.plannerRetrieve.useMutation({ onSuccess: refresh, onError: error => setActionError(error.message) });
  const observeCoreRole = trpc.orchestration.observeCoreRole.useMutation({ onSuccess: refresh, onError: error => setActionError(error.message) });
  const proposeGovernedRoute = trpc.fusion.proposeGovernedRoute.useMutation({
    onSuccess: async result => {
      setActionError(null);
      setCoreMessage(`9router registrou a alternância ${result.plan.rotationOffset} com ${result.plan.eligibleCount} candidato(s) para revisão; nenhuma execução externa ocorreu.`);
      await Promise.all([refresh(), utils.fusion.routerPreview.invalidate()]);
    },
    onError: error => setActionError(error.message),
  });

  const activateAndRun = async () => {
    try {
      setActionError(null);
      if (data?.cycle.status === "pausado") await resume.mutateAsync({});
      await runOnce.mutateAsync();
    } catch {
      setActionError("A síntese do ciclo não está disponível no momento. A falha foi registrada com segurança; revise a disponibilidade do provedor e tente novamente depois.");
    }
  };

  const activateSchedule = async () => {
    try {
      setActionError(null);
      setScheduleMessage(null);
      await registerSchedule.mutateAsync({ cron: data?.cycle.scheduleCron ?? "0 0 */6 * * *" });
    } catch {
      setScheduleMessage("O agendamento só pode ser registrado após a publicação do checkpoint. Nenhuma tarefa foi criada.");
    }
  };

  const operateCoreRole = async (roleId: "planner" | "executor" | "monitor" | "optimizer") => {
    try {
      setActionError(null);
      if (roleId === "planner") {
        const results = await retrieveMemory.mutateAsync({ query: "contexto criativo do workspace" });
        setCoreMessage(`Planner registrou uma recuperação auditável com ${results.length} evidência(s).`);
        return;
      }
      if (roleId === "executor") {
        const entry = data?.catalog[0];
        if (!entry) return;
        const result = await proposeCatalogAction.mutateAsync({ catalogEntryId: entry.id, action: "avaliar contrato", requestSummary: `Intenção auditável para ${entry.name}; nenhuma integração foi executada.` });
        setCoreMessage(`Executor registrou uma intenção com estado ${result.status}; nenhuma chamada externa ocorreu.`);
        return;
      }
      await observeCoreRole.mutateAsync({ roleId, summary: roleId === "monitor" ? "Inspeção manual dos limites e estados do ciclo." : "Observação para melhoria gradual submetida à revisão humana." });
      setCoreMessage(`${roleId === "monitor" ? "Monitor" : "Optimizer"} registrou telemetria sem alterar código, credenciais ou conectores.`);
    } catch {
      setActionError("Não foi possível registrar a telemetria do papel selecionado. Nenhuma ação externa foi executada.");
    }
  };

  if (isLoading || !data || previewFailure === "dashboard") {
    if (dashboardQuery.isError || previewFailure === "dashboard") {
      return <main className="studio-grid flex min-h-full items-center justify-center p-6"><Card className="w-full max-w-lg glass-panel"><CardHeader><CardTitle>Não foi possível carregar a orquestração</CardTitle><CardDescription>O estado persistido não foi consultado. Nenhuma execução foi iniciada.</CardDescription></CardHeader><CardContent><Button onClick={() => retryQuery("dashboard")}>Tentar novamente</Button></CardContent></Card></main>;
    }
    return <div className="p-6 text-sm text-muted-foreground">Carregando o controle de orquestração…</div>;
  }

  const isBusy = resume.isPending || pause.isPending || runOnce.isPending;

  return (
    <main className="studio-grid min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-panel overflow-hidden p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/3 translate-x-1/3 rounded-full bg-cyan-300/35 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-primary"><BrainCircuit className="h-4 w-4" /> Núcleo governado</div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Orquestração criativa com memória revisável</h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">Cada execução é única, limitada e auditável. Agentes sintetizam evidências em propostas; conectores, credenciais, código e chamadas externas continuam sob aprovação humana.</p>
              {actionError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{actionError}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusTone(data.cycle.status)} className="px-3 py-1.5 text-sm">{data.cycle.status}</Badge>
              <Button onClick={activateAndRun} disabled={isBusy || data.cycle.status === "em execução"} className="gap-2"><Play className="h-4 w-4" />{isBusy ? "Processando…" : "Executar um ciclo"}</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-cyan-200/80 bg-white/75 shadow-sm"><CardHeader className="pb-3"><CardDescription>Memórias persistentes</CardDescription><CardTitle className="text-3xl">{data.memories.length}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Recuperação lexical com escopo do workspace.</CardContent></Card>
          <Card className="border-blue-200/80 bg-white/75 shadow-sm"><CardHeader className="pb-3"><CardDescription>Execuções recentes</CardDescription><CardTitle className="text-3xl">{data.runs.length}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Máximo de uma execução ativa por usuário.</CardContent></Card>
          <Card className="border-orange-200/80 bg-white/75 shadow-sm"><CardHeader className="pb-3"><CardDescription>Propostas pendentes</CardDescription><CardTitle className="text-3xl">{data.proposals.filter(item => item.status === "pendente").length}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Nenhuma proposta é executada automaticamente.</CardContent></Card>
          <Card className="border-teal-200/80 bg-white/75 shadow-sm"><CardHeader className="pb-3"><CardDescription>Eventos recebidos</CardDescription><CardTitle className="text-3xl">{data.inbox.length}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Endpoint assinado e idempotente do Nexus.</CardContent></Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="glass-panel border-violet-200/80">
            <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-violet-700" /> Pulse interno protegido</CardTitle><CardDescription>Maturidade operacional baseada em evidências curadas e revisões; não representa senciência nem libera ações autônomas.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="flex items-end justify-between rounded-xl bg-violet-50/70 p-4"><div><p className="text-xs font-bold uppercase tracking-wide text-violet-700">Índice de maturidade</p><p className="mt-1 text-4xl font-black">{data.maturity.score}</p></div><Badge variant="secondary">{data.maturity.level}</Badge></div><div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-muted/60 p-3"><b className="block text-base">{data.maturity.evidenceCount}</b>evidências</div><div className="rounded-lg bg-muted/60 p-3"><b className="block text-base">{data.maturity.reviewedMemoryCount}</b>memórias curadas</div><div className="rounded-lg bg-muted/60 p-3"><b className="block text-base">{data.maturity.approvedProposalCount}</b>revisões</div></div><p className="rounded-lg border border-violet-200 bg-white/70 p-3 text-xs text-muted-foreground">Teto atual: <strong>{data.maturity.autonomyCeiling}</strong>. Qualquer conexão, chamada externa, credencial ou mudança de código exige aprovação humana.</p></CardContent>
          </Card>
          <Card className="glass-panel">
            <CardHeader><CardTitle>Memória, roteamento e ferramentas</CardTitle><CardDescription>Os contratos solicitados ficam inativos por padrão. Registrar uma proposta nunca executa integrações externas.</CardDescription></CardHeader>
            <CardContent className="space-y-3">{data.catalog.map(entry => <div key={entry.id} className="rounded-xl border bg-white/70 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{entry.name}</p><p className="mt-1 text-xs text-muted-foreground">{entry.kind} · risco {entry.riskLevel}</p></div><Badge variant={entry.status === "bloqueado" ? "destructive" : entry.status === "ativado" ? "outline" : "secondary"}>{entry.status}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{entry.guardrail}</p><div className="mt-3 flex flex-wrap gap-2">{user?.role === "admin" && entry.status === "catálogo" ? <Button size="sm" variant="outline" onClick={() => stageCatalogEntry.mutate({ entryId: entry.id, status: "aguardando aprovação" })} disabled={stageCatalogEntry.isPending}>Solicitar revisão</Button> : null}<Button size="sm" variant="ghost" onClick={() => proposeCatalogAction.mutate({ catalogEntryId: entry.id, action: "avaliar contrato", requestSummary: `Solicitação de avaliação auditável para ${entry.name}.` })} disabled={proposeCatalogAction.isPending}>Registrar proposta</Button></div></div>)}</CardContent>
          </Card>
        </section>

        <section>
          <Card className="glass-panel border-cyan-200/80">
            <CardHeader><CardTitle className="flex items-center gap-2"><Workflow className="h-5 w-5 text-cyan-700" /> 9router · alternância governada</CardTitle><CardDescription>Selecione a finalidade. O Studio ordena somente os adaptadores elegíveis entre as 19 fontes e registra uma proposta revisável; esta tela nunca executa agentes, repositórios, ferramentas, conectores ou chamadas externas.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1.5 text-sm font-medium">Capacidade
                  <select value={routeCapability} onChange={event => setRouteCapability(event.target.value as typeof routeCapability)} className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="planejamento e orquestração">Planejamento e orquestração</option>
                    <option value="pesquisa e referência">Pesquisa e referência</option>
                    <option value="mídia generativa">Mídia generativa</option>
                    <option value="arquitetura e telemetria">Arquitetura e telemetria</option>
                    <option value="infraestrutura de modelo">Infraestrutura de modelo</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium">Teto de risco
                  <select value={routeRisk} onChange={event => setRouteRisk(event.target.value as typeof routeRisk)} className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="baixo">Baixo</option>
                    <option value="médio">Médio</option>
                    <option value="alto">Alto</option>
                  </select>
                </label>
                <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-xs text-cyan-900"><b className="block">Controle obrigatório</b>Saída limitada a proposta e aprovação humana.</div>
              </div>
              <div><label htmlFor="router-request" className="text-sm font-medium">Pedido para roteamento</label><Textarea id="router-request" value={routeRequest} onChange={event => setRouteRequest(event.target.value)} maxLength={600} className="mt-1.5 min-h-22" /></div>
              {routerPreview.isError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Não foi possível calcular a prévia de rota. Nenhuma proposta foi registrada.</p> : null}
              {routerPreview.data ? <div className="rounded-xl border bg-white/70 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Prévia de alternância {routerPreview.data.rotationOffset}</p><Badge variant="secondary">{routerPreview.data.eligibleCount} elegível(is) de {routerPreview.data.totalAdapters}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{routerPreview.data.policy.note}</p><div className="mt-3 grid gap-2 lg:grid-cols-2">{routerPreview.data.candidates.length ? routerPreview.data.candidates.map(candidate => <div key={candidate.id} className="rounded-lg border bg-slate-50/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{candidate.rank}. {candidate.repository}</p><Badge variant="outline">risco {candidate.riskLevel}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{candidate.reason}</p></div>) : <p className="text-sm text-muted-foreground">Nenhum adaptador elegível atende a esta combinação. Amplie apenas o teto de risco que você deseja revisar.</p>}</div></div> : <p className="text-sm text-muted-foreground">Preencha pelo menos três caracteres para calcular uma prévia sem efeitos externos.</p>}
              <Button onClick={() => proposeGovernedRoute.mutate(routeInput)} disabled={proposeGovernedRoute.isPending || routeInput.request.length < 3 || !routerPreview.data} className="gap-2"><Workflow className="h-4 w-4" />{proposeGovernedRoute.isPending ? "Registrando proposta…" : "Registrar seleção para revisão"}</Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.coreRoles.map(role => <Card key={role.id} className="border-slate-200 bg-white/75 shadow-sm"><CardHeader className="pb-2"><div className="flex items-center justify-between gap-2"><CardTitle className="text-base">{role.name}</CardTitle><Badge variant={role.latestAudit ? statusTone(role.latestAudit.status) : "secondary"}>{role.latestAudit?.status ?? "sem telemetria"}</Badge></div><CardDescription className="min-h-10 text-xs">{role.description}</CardDescription></CardHeader><CardContent className="space-y-2"><p className="min-h-12 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{role.latestAudit ? `${role.latestAudit.eventName} · ${formatDate(role.latestAudit.createdAt)}` : role.boundary}</p><Button size="sm" variant="outline" className="w-full" onClick={() => operateCoreRole(role.id)} disabled={retrieveMemory.isPending || proposeCatalogAction.isPending || observeCoreRole.isPending}>Registrar telemetria</Button></CardContent></Card>)}</div>{coreMessage ? <p className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">{coreMessage}</p> : null}</section>

        <section><Card className="glass-panel"><CardHeader><CardTitle>Trilha auditável do Core</CardTitle><CardDescription>Histórico persistido de Planner, Executor, Monitor e Optimizer. Cada item informa evidências, status e instante; nenhum registro comprova execução externa.</CardDescription></CardHeader><CardContent className="space-y-2">{data.coreRoleAudit.length ? data.coreRoleAudit.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white/70 p-3"><div className="min-w-0"><p className="text-sm font-semibold">{item.roleId} · {item.eventName}</p><p className="truncate text-xs text-muted-foreground">{item.summary}</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span>{item.evidenceCount} evidência(s)</span><Badge variant={statusTone(item.status)}>{item.status}</Badge><span>{formatDate(item.createdAt)}</span></div></div>) : <p className="text-sm text-muted-foreground">Nenhum registro funcional do Core ainda. Use os controles acima para criar uma telemetria segura.</p>}</CardContent></Card></section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
          <Card className="glass-panel">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Controles de segurança</CardTitle><CardDescription>O ciclo só será disparado periodicamente após publicação e registro da tarefa agendada.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-muted/55 p-4 text-sm"><p className="font-bold">Última execução</p><p className="mt-1 text-muted-foreground">{formatDate(data.cycle.lastFinishedAt)}</p></div>
              <div className="rounded-xl bg-muted/55 p-4 text-sm"><p className="font-bold">Intervalo mínimo</p><p className="mt-1 text-muted-foreground">{data.cycle.minIntervalMinutes} minutos entre ciclos; até {data.cycle.maxEvidencePerCycle} evidências por ciclo.</p></div>
              <div className="rounded-xl bg-muted/55 p-4 text-sm"><p className="font-bold">Agendamento periódico</p><p className="mt-1 text-muted-foreground">{data.cycle.taskUid ? `Registrado (${data.cycle.scheduleCron})` : `Pendente de publicação (${data.cycle.scheduleCron})`}</p>{user?.role === "admin" ? <Button variant="link" className="mt-1 h-auto p-0" onClick={activateSchedule} disabled={registerSchedule.isPending}>{registerSchedule.isPending ? "Registrando…" : data.cycle.taskUid ? "Atualizar agendamento" : "Registrar após publicar"}</Button> : null}{scheduleMessage ? <p className="mt-2 text-xs text-muted-foreground">{scheduleMessage}</p> : null}</div>
              {data.cycle.pausedReason ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Pausado: {data.cycle.pausedReason}</p> : null}
              <div className="flex flex-col gap-2 sm:flex-row"><Input value={pauseReason} onChange={event => setPauseReason(event.target.value)} aria-label="Motivo da pausa" /><Button variant="outline" onClick={() => pause.mutate({ reason: pauseReason })} disabled={isBusy || pauseReason.trim().length < 3} className="gap-2"><CirclePause className="h-4 w-4" /> Pausar</Button></div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Registrar memória de trabalho</CardTitle><CardDescription>Adicione decisões, preferências e evidências curadas. Não envie credenciais, tokens ou segredos.</CardDescription></CardHeader>
            <CardContent className="space-y-3"><Input value={memoryTitle} onChange={event => setMemoryTitle(event.target.value)} placeholder="Título da memória" maxLength={255} /><Textarea value={memoryContent} onChange={event => setMemoryContent(event.target.value)} placeholder="Contexto criativo, decisão ou aprendizado verificável" className="min-h-28" maxLength={8000} /><Button onClick={() => saveMemory.mutate({ title: memoryTitle, content: memoryContent })} disabled={saveMemory.isPending || memoryTitle.trim().length < 3 || memoryContent.trim().length < 3}>{saveMemory.isPending ? "Registrando…" : "Salvar memória"}</Button></CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="glass-panel"><CardHeader><CardTitle>Propostas e revisão</CardTitle><CardDescription>As aprovações registram decisão; não acionam efeitos externos.</CardDescription></CardHeader><CardContent className="space-y-3">{data.proposals.length ? data.proposals.map(proposal => <div key={proposal.id} className="rounded-xl border bg-white/70 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold">{proposal.title}</p><p className="mt-1 text-sm text-muted-foreground">{proposal.rationale}</p></div><Badge variant={statusTone(proposal.status)}>{proposal.status}</Badge></div><p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm"><strong>Ação proposta:</strong> {proposal.proposedAction}</p>{user?.role === "admin" && proposal.status === "pendente" ? <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => review.mutate({ proposalId: proposal.id, status: "aprovada" })}>Aprovar registro</Button><Button size="sm" variant="outline" onClick={() => review.mutate({ proposalId: proposal.id, status: "rejeitada" })}>Rejeitar</Button></div> : null}</div>) : <p className="text-sm text-muted-foreground">Ainda não há propostas. Execute um ciclo após registrar referências ou memórias.</p>}</CardContent></Card>
          <Card className="glass-panel"><CardHeader><CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5 text-primary" /> Telemetria do Nexus</CardTitle><CardDescription>Somente envelopes assinados e dentro da janela temporal são armazenados.</CardDescription></CardHeader><CardContent className="space-y-3">{data.inbox.length ? data.inbox.map(event => <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white/70 p-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{event.eventName}</p><p className="truncate text-xs text-muted-foreground">{event.source} · {formatDate(event.receivedAt)}</p></div><Badge variant={statusTone(event.status)}>{event.status}</Badge></div>) : <p className="text-sm text-muted-foreground">Nenhum evento recebido ainda. Configure o endpoint do Nexus com assinatura HMAC antes de enviar eventos.</p>}</CardContent></Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="glass-panel"><CardHeader><CardTitle>Memória recente</CardTitle></CardHeader><CardContent className="space-y-2">{data.memories.length ? data.memories.map(memory => <div key={memory.id} className="rounded-lg border bg-white/70 p-3"><div className="flex items-start justify-between gap-2"><p className="font-semibold">{memory.title}</p><Badge variant="outline">confiança {memory.trustScore}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{memory.summary ?? memory.content}</p><div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{memory.retentionClass}{memory.reviewedAt ? " · curadoria registrada" : ""}</span>{user?.role === "admin" && memory.retentionClass !== "curada" ? <Button size="sm" variant="ghost" onClick={() => reviewMemory.mutate({ memoryId: memory.id, trustScore: 100, retentionClass: "curada" })} disabled={reviewMemory.isPending}>Curar</Button> : null}</div></div>) : <p className="text-sm text-muted-foreground">A memória crescerá a partir de notas curadas, referências e sínteses aprovadas.</p>}</CardContent></Card>
          <Card className="glass-panel"><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Execuções recentes</CardTitle></CardHeader><CardContent className="space-y-2">{data.runs.length ? data.runs.map(run => <div key={run.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white/70 p-3"><div><p className="text-sm font-semibold">{run.trigger} · {formatDate(run.startedAt)}</p><p className="text-xs text-muted-foreground">{run.evidenceCount} evidências · {run.retrievedCount} memórias recuperadas</p></div><Badge variant={statusTone(run.status)}>{run.status}</Badge></div>) : <p className="text-sm text-muted-foreground">Nenhum ciclo registrado ainda.</p>}</CardContent></Card>
        </section>

        <section>
          <Card className="glass-panel border-emerald-200/80"><CardHeader><CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-emerald-700" /> Processamento de tokens</CardTitle><CardDescription>As sete APIs sincronizadas e o Ollama local usam esta matriz declarativa. A cota diária real permanece desconhecida até uma resposta autorizada do provedor.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{TOKEN_QUOTA_PROFILES.map(profile => <div key={profile.providerId} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{profile.label}</p><Badge variant="secondary">{profile.mode === "local-sem-cota-de-provedor" ? "local" : profile.mode === "cota-diaria-declarada" ? "declarada" : "desconhecida"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">Até {profile.perRequestTokenLimit.toLocaleString("pt-BR")} tokens por requisição · reset {"UTC"}</p><p className="mt-2 text-xs text-muted-foreground">{profile.note}</p></div>)}</div><p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><strong>Governança:</strong> o orçamento não roteia, alterna, cobra ou chama provedores. Quando um limite é atingido, o JBC registra uma proposta 9router e aguarda aprovação humana.</p></CardContent></Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="glass-panel"><CardHeader><CardTitle>Runtime de provedores</CardTitle><CardDescription>Token sincronizado, contrato e disponibilidade são sinais distintos. A elegibilidade sem cobrança nunca inicia uma chamada.</CardDescription></CardHeader><CardContent className="space-y-2">{providersQuery.isError || previewFailure === "providers" ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Não foi possível consultar provedores. <Button variant="link" className="h-auto p-0 text-red-800" onClick={() => retryQuery("providers")}>Tentar novamente</Button></div> : providers?.items.map(provider => <div key={provider.id} className="rounded-lg border bg-white/70 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{provider.name}</p><p className="text-xs text-muted-foreground">{provider.id}</p></div><div className="flex gap-1"><Badge variant={provider.status === "ativo" ? "outline" : "secondary"}>{provider.status}</Badge><Badge variant={provider.freeFallbackStatus === "condicional" ? "outline" : "secondary"}>sem cobrança: {provider.freeFallbackStatus}</Badge></div></div><p className="mt-2 text-xs text-muted-foreground">Token: {provider.tokenSynchronization} · Contrato: {provider.contractStatus}</p><p className="mt-1 text-xs text-muted-foreground">{provider.freeFallbackNote}</p></div>) ?? <p className="text-sm text-muted-foreground">Carregando os provedores registrados…</p>}</CardContent></Card>
          <Card className="glass-panel"><CardHeader><CardTitle>Adaptadores JBCx19</CardTitle><CardDescription>Os contratos permanecem no catálogo até que sejam revisados e configurados com credencial oficial ou host autorizado.</CardDescription></CardHeader><CardContent className="space-y-2">{adaptersQuery.isError || previewFailure === "adapters" ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Não foi possível consultar adaptadores. <Button variant="link" className="h-auto p-0 text-red-800" onClick={() => retryQuery("adapters")}>Tentar novamente</Button></div> : adapters?.items.slice(0, 6).map(adapter => <div key={adapter.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white/70 p-3"><div><p className="text-sm font-semibold">{adapter.repository}</p><p className="text-xs text-muted-foreground">{adapter.activationMode}</p></div><Badge variant={adapter.profile?.status === "ativo" ? "outline" : "secondary"}>{adapter.profile?.status ?? "não configurado"}</Badge></div>) ?? <p className="text-sm text-muted-foreground">Carregando os adaptadores registrados…</p>}</CardContent></Card>
        </section>

        <section><Card className="glass-panel"><CardHeader><CardTitle>Auditoria de propostas de ferramentas</CardTitle><CardDescription>Registros de intenção; nenhuma entrada nesta lista executa rotas, ferramentas ou conectores.</CardDescription></CardHeader><CardContent className="space-y-2">{data.toolInvocations.length ? data.toolInvocations.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white/70 p-3"><div><p className="text-sm font-semibold">{item.action}</p><p className="text-xs text-muted-foreground">{item.requestSummary}</p></div><Badge variant={statusTone(item.status)}>{item.status}</Badge></div>) : <p className="text-sm text-muted-foreground">Nenhuma proposta de ferramenta registrada.</p>}</CardContent></Card></section>
      </div>
    </main>
  );
}
