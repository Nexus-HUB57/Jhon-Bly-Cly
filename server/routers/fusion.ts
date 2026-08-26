import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createFusionSyncEvent, listFusionConnectorProfiles, recordFusionSyncDelivery, stageFusionConnector } from "../db";
import { deliverFusionSyncToNexusOrchestra } from "../orchestra";
import { createFusionSyncEnvelope, FUSION_CONNECTORS, FUSION_REPOSITORIES, FUSION_RISK_LEVELS, FUSION_ROUTES, getFusionConnector, isFusionConnectorEligible, summarizeFusionCatalog } from "../../shared/fusionCatalog";
import { protectedProcedure, router } from "../_core/trpc";

export const fusionRouter = router({
  catalog: protectedProcedure
    .input(z.object({ route: z.enum(FUSION_ROUTES).optional(), risk: z.enum(FUSION_RISK_LEVELS).optional() }).optional())
    .query(({ input }) => {
      const filtered = FUSION_REPOSITORIES.filter(item => (!input?.route || item.route === input.route) && (!input?.risk || item.risk === input.risk));
      return { items: filtered, summary: summarizeFusionCatalog(FUSION_REPOSITORIES) };
    }),
  syncEnvelope: protectedProcedure.query(() => createFusionSyncEnvelope()),
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
});
