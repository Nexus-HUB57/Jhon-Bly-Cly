/**
 * Página: Dashboard Autônomo myvideos
 * 
 * Visualiza o estado completo do sistema autônomo:
 * - Modelos nativos e seus estados
 * - Agentes AI e suas capacidades
 * - Pipeline de produção
 * - Saúde do sistema
 * - Estatísticas de uso
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Cpu,
  Brain,
  Video,
  Image,
  Mic,
  Database,
  Activity,
  Zap,
  Shield,
  Settings,
  Play,
  BarChart3,
  Server,
  HardDrive,
} from "lucide-react";

export function AutonomousDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const health = trpc.autonomous.health.useQuery();
  const manifest = trpc.autonomous.manifest.useQuery();
  const models = trpc.autonomous.models.useQuery();
  const agents = trpc.autonomous.agents.useQuery();
  const stats = trpc.autonomous.stats.useQuery();

  const healthData = health.data;
  const modelsData = models.data;
  const agentsData = agents.data;
  const statsData = stats.data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema Autônomo</h1>
          <p className="text-muted-foreground mt-1">
            Motor nativo myvideos — zero dependências externas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={healthData?.autonomous ? "default" : "destructive"}
            className="text-sm px-3 py-1"
          >
            {healthData?.autonomous ? "✦ AUTÔNOMO" : "⚠ MODO HÍBRIDO"}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {healthData?.totalParameters ?? "..."} parâmetros
          </Badge>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          icon={<Brain className="h-5 w-5" />}
          title="Modelos Nativos"
          value={healthData?.totalModels ?? 0}
          subtitle={`${healthData?.loadedModels ?? 0} carregados`}
          color="blue"
        />
        <StatusCard
          icon={<Zap className="h-5 w-5" />}
          title="Parâmetros"
          value={healthData?.totalParameters ?? "0"}
          subtitle="rodando nativamente"
          color="purple"
        />
        <StatusCard
          icon={<Cpu className="h-5 w-5" />}
          title="Agentes AI"
          value={agentsData?.registeredAgents ?? 0}
          subtitle={`${agentsData?.registeredTools ?? 0} ferramentas`}
          color="green"
        />
        <StatusCard
          icon={<Shield className="h-5 w-5" />}
          title="Dep. Externas"
          value={healthData?.externalDependencies?.length ?? 0}
          subtitle={healthData?.autonomous ? "zero ✓" : "ativas"}
          color={healthData?.autonomous ? "green" : "red"}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Arquitetura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" /> Arquitetura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ArchRow label="Paradigma" value="Agentic AI Nativo" />
                <ArchRow label="Modelos" value="ONNX Runtime Nativo" />
                <ArchRow label="Armazenamento" value="Filesystem Local" />
                <ArchRow label="Memória" value="Vetorial Semântica Nativa" />
                <ArchRow label="Auth" value="JWT Local" />
                <ArchRow label="Agentes" value="ReAct Multi-Agent" />
                <ArchRow label="Status" value={healthData?.status ?? "..."} />
              </CardContent>
            </Card>

            {/* Capacidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" /> Capacidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Geração de vídeo end-to-end",
                    "Geração de imagem HD",
                    "Raciocínio agentic",
                    "Memória semântica",
                    "STT + TTS nativos",
                    "Multi-agente",
                    "Auto-reflexão",
                    "Zero APIs externas",
                  ].map(cap => (
                    <Badge key={cap} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Models */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modelos Nativos ({modelsData?.registry?.length ?? 0})</CardTitle>
              <CardDescription>
                Todos rodando via ONNX Runtime — zero APIs externas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {modelsData?.registry?.map((model: any) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <ModelIcon modality={model.modality[0]} />
                      <div>
                        <p className="font-medium text-sm">{model.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {model.parameterLabel} • {model.backend}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {model.parameterLabel}
                      </Badge>
                      <Badge
                        variant={model.status === "carregado" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {model.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agentes AI ({agentsData?.agents?.length ?? 0})</CardTitle>
              <CardDescription>
                Sistema multi-agente com ReAct + Reflexion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agentsData?.agents?.map((agent: any) => (
                  <div
                    key={agent.id}
                    className="p-4 rounded-lg border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{agent.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {agent.id}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities?.map((cap: string) => (
                        <Badge key={cap} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" /> Pipeline de Produção Autônomo
              </CardTitle>
              <CardDescription>
                End-to-end: Briefing → Script → Keyframes → Vídeo → QA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PipelineStep
                step={1}
                title="Planejamento"
                agent="Planner"
                description="Analisa briefing, cria estrutura narrativa e plano de produção"
                status="ativo"
              />
              <PipelineStep
                step={2}
                title="Direção Criativa"
                agent="Creative"
                description="Desenvolve conceito visual, prompts e paleta de cores"
                status="ativo"
              />
              <PipelineStep
                step={3}
                title="Pesquisa"
                agent="Researcher"
                description="Busca referências na memória semântica e assets"
                status="ativo"
              />
              <PipelineStep
                step={4}
                title="Execução"
                agent="Executor"
                description="Gera keyframes, interpola frames, codifica vídeo"
                status="ativo"
              />
              <PipelineStep
                step={5}
                title="Avaliação"
                agent="Critic"
                description="Avalia qualidade, sugere iterações se necessário"
                status="ativo"
              />
              <PipelineStep
                step={6}
                title="Otimização"
                agent="Optimizer"
                description="Ajusta parâmetros, otimiza performance"
                status="ativo"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Motor LLM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sessões carregadas: {statsData?.llm?.loadedSessions ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Inferências totais: {statsData?.llm?.totalInferences ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" /> Storage Nativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Arquivos: {statsData?.storage?.totalFiles ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tamanho: {((statsData?.storage?.totalBytes ?? 0) / 1024 / 1024).toFixed(1)} MB
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function StatusCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  color: "blue" | "purple" | "green" | "red";
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-600",
    purple: "bg-purple-500/10 text-purple-600",
    green: "bg-green-500/10 text-green-600",
    red: "bg-red-500/10 text-red-600",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function ArchRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ModelIcon({ modality }: { modality: string }) {
  const icons: Record<string, React.ReactNode> = {
    text: <Brain className="h-4 w-4 text-blue-500" />,
    image: <Image className="h-4 w-4 text-purple-500" />,
    video: <Video className="h-4 w-4 text-green-500" />,
    audio: <Mic className="h-4 w-4 text-orange-500" />,
    multimodal: <Zap className="h-4 w-4 text-yellow-500" />,
  };
  return <>{icons[modality] ?? <Cpu className="h-4 w-4" />}</>;
}

function PipelineStep({
  step,
  title,
  agent,
  description,
  status,
}: {
  step: number;
  title: string;
  agent: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-lg border">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
        {step}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{title}</p>
          <Badge variant="outline" className="text-xs">{agent}</Badge>
          <Badge variant="secondary" className="text-xs">{status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
