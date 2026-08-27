import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createFusionSyncEvent, listFusionConnectorProfiles, recordFusionSyncDelivery, stageFusionConnector } from "../db";
import { deliverFusionSyncToNexusOrchestra } from "../orchestra";
import { createFusionSyncEnvelope, FUSION_CONNECTORS, FUSION_REPOSITORIES, FUSION_RISK_LEVELS, FUSION_ROUTES, getFusionConnector, isFusionConnectorEligible, summarizeFusionCatalog } from "../../shared/fusionCatalog";
import { JBCX19_ADAPTERS, summarizeJbcx19Adapters } from "../../shared/jbcx19Adapters";
import { buildGovernedRoutePlan, GOVERNED_ROUTER_CAPABILITIES, GOVERNED_ROUTER_RISKS } from "../../shared/governedRouter";
import { PROVIDER_RUNTIME_REGISTRY, summarizeProviderRuntime } from "../../shared/providerRuntime";
import { protectedProcedure, router } from "../_core/trpc";
import { countGovernedRouterProposals, createGovernedToolInvocation, listOrSeedGovernanceCatalog, recordCoreRoleAudit } from "../orchestrationDb";

const governedRouteInput = z.object({
  capability: z.enum(GOVERNED_ROUTER_CAPABILITIES),
  maxRisk: z.enum(GOVERNED_ROUTER_RISKS).default("médio"),
  request: z.string().trim().min(3).max(600),
});

export const fusionRouter = router({
  catalog: protectedProcedure
    .input(z.object({ route: z.enum(FUSION_ROUTES).optional(), risk: z.enum(FUSION_RISK_LEVELS).optional() }).optional())
    .query(({ input }) => {
      const filtered = FUSION_REPOSITORIES.filter(item => (!input?.route || item.route === input.route) && (!input?.risk || item.risk === input.risk));
      return { items: filtered, summary: summarizeFusionCatalog(FUSION_REPOSITORIES) };
    }),
  syncEnvelope: protectedProcedure.query(() => createFusionSyncEnvelope()),
  providers: protectedProcedure.query(() => ({ items: PROVIDER_RUNTIME_REGISTRY, summary: summarizeProviderRuntime() })),
  adapters: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await listFusionConnectorProfiles(ctx.user.id);
    return {
      items: JBCX19_ADAPTERS.map(adapter => ({ ...adapter, profile: profiles.find(profile => profile.connectorId === adapter.id) ?? null })),
      summary: summarizeJbcx19Adapters(),
    };
  }),
  routerPreview: protectedProcedure.input(governedRouteInput).query(async ({ ctx, input }) => {
    const rotationOffset = await countGovernedRouterProposals(ctx.user.id);
    return buildGovernedRoutePlan({ ...input, rotationOffset });
  }),
  proposeGovernedRoute: protectedProcedure.input(governedRouteInput).mutation(async ({ ctx, input }) => {
    const rotationOffset = await countGovernedRouterProposals(ctx.user.id);
    const plan = buildGovernedRoutePlan({ ...input, rotationOffset });
    const catalog = await listOrSeedGovernanceCatalog(ctx.user.id);
    const routerEntry = catalog.find(entry => entry.identifier === "9router");
    if (!routerEntry) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "A entrada 9router não está disponível no catálogo governado." });
    const selection = plan.candidates.map(candidate => candidate.id).join(", ") || "nenhum candidato elegível";
    const proposal = await createGovernedToolInvocation({
      userId: ctx.user.id,
      catalogEntryId: routerEntry.id,
      action: "9router: seleção governada",
      requestSummary: `Solicitação: ${input.request}. Capacidade: ${input.capability}. Teto de risco: ${input.maxRisk}. Alternância ${rotationOffset}. Candidatos: ${selection}.`,
      proposalOnly: true,
    });
    await recordCoreRoleAudit({
      userId: ctx.user.id,
      roleId: "planner",
      eventName: "Seleção 9router",
      status: "aguardando revisão",
      evidenceCount: plan.candidates.length,
      summary: `Alternância ${rotationOffset} registrada para ${input.capability}; nenhuma integração externa foi executada.`,
    });
    return { ...proposal, plan };
  }),
  sync: protectedProcedure.mutation(async ({ ctx }) => {
    const envelope = createFusionSyncEnvelope();
    const event = await createFusionSyncEvent(ctx.user.id, envelope.eventName, envelope);
    if (!event) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível persistir o evento de fusão." });
    const delivery = await deliverFusionSyncToNexusOrchestra(envelope);
    await recordFusionSyncDelivery(event.id, delivery.delivered, delivery.error);
    return { eventId: event.id, deliveryStatus: delivery.delivered ? "entregue" as const : "falha" as const, error: delivery.error ?? null };
  }),
  connectors: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await listFusionConnectorProfiles(ctx.user.id);
    return FUSION_CONNECTORS.map(connector => ({
      ...connector,
      profile: profiles.find(profile => profile.connectorId === connector.id) ?? null,
    }));
  }),
  stageConnector: protectedProcedure.input(z.object({ connectorId: z.string().min(1).max(120) })).mutation(async ({ ctx, input }) => {
    const connector = getFusionConnector(input.connectorId);
    if (!connector) throw new TRPCError({ code: "NOT_FOUND", message: "Conector não encontrado no catálogo." });
    if (!isFusionConnectorEligible(input.connectorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Este conector está bloqueado pelas políticas de segurança da fusão." });
    }
    await stageFusionConnector(ctx.user.id, input.connectorId);
    return {
      connectorId: connector.id,
      status: "aguardando credencial" as const,
      nextStep: connector.credentialMode === "BYOK" ? "Forneça a credencial oficial do provedor para concluir a ativação." : "Configure uma infraestrutura externa persistente antes de ativar este conector.",
    };
  }),
  stageAdapter: protectedProcedure.input(z.object({ adapterId: z.string().min(1).max(120) })).mutation(async ({ ctx, input }) => {
    const adapter = JBCX19_ADAPTERS.find(candidate => candidate.id === input.adapterId);
    if (!adapter) throw new TRPCError({ code: "NOT_FOUND", message: "Adaptador JBCx19 não encontrado." });
    if (adapter.activationMode === "bloqueado") throw new TRPCError({ code: "FORBIDDEN", message: "Este adaptador é bloqueado pela política de segurança do JBCx19." });
    await stageFusionConnector(ctx.user.id, adapter.id);
    const nextStep = adapter.activationMode === "credencial oficial"
      ? "Forneça a credencial oficial do provedor no formulário protegido."
      : adapter.activationMode === "host autorizado"
        ? "Informe um host autorizado e validado para este runtime."
        : "Revise o contrato público antes de promover este adaptador de catálogo para uma integração executável.";
    return { adapterId: adapter.id, status: "aguardando credencial" as const, nextStep };
  }),
});
