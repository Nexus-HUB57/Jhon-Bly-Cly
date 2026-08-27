import { int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { TASK_STATUSES } from "../shared/video";
import {
  IMPROVEMENT_PROPOSAL_STATUSES,
  MEMORY_SOURCE_TYPES,
  GOVERNANCE_CATALOG_KINDS,
  GOVERNANCE_CATALOG_STATUSES,
  CORE_ROLE_AUDIT_STATUSES,
  OPERATIONAL_MATURITY_LEVELS,
  ORCHESTRATION_CYCLE_STATUSES,
  ORCHESTRA_INBOX_STATUSES,
  TOOL_INVOCATION_STATUSES,
} from "../shared/orchestrationPolicy";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const videoProjects = mysqlTable("video_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  briefing: text("briefing").notNull(),
  format: varchar("format", { length: 24 }).notNull(),
  durationSeconds: int("durationSeconds").notNull(),
  language: varchar("language", { length: 80 }).notNull(),
  objective: text("objective").notNull(),
  creativeDirection: text("creativeDirection"),
  script: text("script"),
  creativeSummary: text("creativeSummary"),
  status: mysqlEnum("status", TASK_STATUSES).notNull().default("rascunho"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const videoScenes = mysqlTable("video_scenes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => videoProjects.id, { onDelete: "cascade" }),
  sceneNumber: int("sceneNumber").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  durationSeconds: int("durationSeconds").notNull(),
  narrative: text("narrative").notNull(),
  camera: text("camera"),
  visualPrompt: text("visualPrompt").notNull(),
  productionPrompt: text("productionPrompt").notNull(),
  storyboardPrompt: text("storyboardPrompt").notNull(),
  referenceImageUrl: varchar("referenceImageUrl", { length: 2048 }),
  generationConfig: json("generationConfig"),
  status: mysqlEnum("status", TASK_STATUSES).notNull().default("rascunho"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projectVersions = mysqlTable("project_versions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => videoProjects.id, { onDelete: "cascade" }),
  versionNumber: int("versionNumber").notNull(),
  versionType: varchar("versionType", { length: 64 }).notNull(),
  content: json("content").notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projectAssets = mysqlTable("project_assets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => videoProjects.id, { onDelete: "cascade" }),
  sceneId: int("sceneId").references(() => videoScenes.id, { onDelete: "set null" }),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 1024 }),
  url: varchar("url", { length: 2048 }).notNull(),
  mimeType: varchar("mimeType", { length: 160 }).notNull(),
  byteSize: int("byteSize").notNull().default(0),
  kind: mysqlEnum("kind", ["referência", "imagem gerada", "resultado de vídeo", "exportação"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const referenceAssets = mysqlTable("reference_assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 1024 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  mimeType: varchar("mimeType", { length: 160 }).notNull(),
  byteSize: int("byteSize").notNull(),
  category: mysqlEnum("category", ["imagem", "áudio", "vídeo", "documento", "texto"]).notNull(),
  agentUse: varchar("agentUse", { length: 120 }).notNull().default("referência criativa"),
  purpose: text("purpose"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const generationRuns = mysqlTable("generation_runs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => videoProjects.id, { onDelete: "cascade" }),
  sceneId: int("sceneId").references(() => videoScenes.id, { onDelete: "set null" }),
  runType: mysqlEnum("runType", ["planejamento", "imagem_referência", "vídeo", "exportação"]).notNull(),
  status: mysqlEnum("status", TASK_STATUSES).notNull().default("rascunho"),
  input: json("input").notNull(),
  output: json("output"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  finishedAt: timestamp("finishedAt"),
});

export const orchestraEvents = mysqlTable("orchestra_events", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => videoProjects.id, { onDelete: "cascade" }),
  sceneId: int("sceneId").references(() => videoScenes.id, { onDelete: "set null" }),
  eventName: varchar("eventName", { length: 160 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId").notNull(),
  payload: json("payload").notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pendente", "entregue", "falha"]).notNull().default("pendente"),
  deliveryAttempts: int("deliveryAttempts").notNull().default(0),
  deliveryError: text("deliveryError"),
  deliveredAt: timestamp("deliveredAt"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

export const fusionConnectorProfiles = mysqlTable("fusion_connector_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectorId: varchar("connectorId", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["não configurado", "aguardando credencial", "ativo", "bloqueado"]).notNull().default("não configurado"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("fusion_connector_profiles_user_connector_unique").on(table.userId, table.connectorId)]);

export const fusionSyncEvents = mysqlTable("fusion_sync_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventName: varchar("eventName", { length: 160 }).notNull(),
  payload: json("payload").notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pendente", "entregue", "falha"]).notNull().default("pendente"),
  deliveryAttempts: int("deliveryAttempts").notNull().default(0),
  deliveryError: text("deliveryError"),
  deliveredAt: timestamp("deliveredAt"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

export const knowledgeMemories = mysqlTable("knowledge_memories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: int("projectId").references(() => videoProjects.id, { onDelete: "set null" }),
  sourceType: mysqlEnum("sourceType", MEMORY_SOURCE_TYPES).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  tags: json("tags"),
  sourceReference: varchar("sourceReference", { length: 512 }),
  trustScore: int("trustScore").notNull().default(50),
  retentionClass: mysqlEnum("retentionClass", ["curta", "padrão", "curada"]).notNull().default("padrão"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const memoryRetrievals = mysqlTable("memory_retrievals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: int("projectId").references(() => videoProjects.id, { onDelete: "set null" }),
  query: text("query").notNull(),
  resultCount: int("resultCount").notNull().default(0),
  retrievedMemoryIds: json("retrievedMemoryIds").notNull(),
  retrievedEvidence: json("retrievedEvidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orchestrationCycles = mysqlTable("orchestration_cycles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ORCHESTRATION_CYCLE_STATUSES).notNull().default("pausado"),
  scheduleCron: varchar("scheduleCron", { length: 120 }).notNull().default("0 0 */6 * * *"),
  taskUid: varchar("taskUid", { length: 255 }),
  minIntervalMinutes: int("minIntervalMinutes").notNull().default(15),
  maxEvidencePerCycle: int("maxEvidencePerCycle").notNull().default(12),
  lastStartedAt: timestamp("lastStartedAt"),
  lastFinishedAt: timestamp("lastFinishedAt"),
  lastError: text("lastError"),
  pausedReason: text("pausedReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("orchestration_cycles_user_unique").on(table.userId), uniqueIndex("orchestration_cycles_task_unique").on(table.taskUid)]);

export const orchestrationCycleRuns = mysqlTable("orchestration_cycle_runs", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull().references(() => orchestrationCycles.id, { onDelete: "cascade" }),
  trigger: mysqlEnum("trigger", ["manual", "agendado", "evento"]).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 255 }).notNull(),
  status: mysqlEnum("status", ORCHESTRATION_CYCLE_STATUSES).notNull().default("pronto"),
  evidenceCount: int("evidenceCount").notNull().default(0),
  retrievedCount: int("retrievedCount").notNull().default(0),
  summary: text("summary"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  finishedAt: timestamp("finishedAt"),
}, table => [uniqueIndex("orchestration_cycle_runs_idempotency_unique").on(table.idempotencyKey)]);

export const improvementProposals = mysqlTable("improvement_proposals", {
  id: int("id").autoincrement().primaryKey(),
  cycleRunId: int("cycleRunId").notNull().references(() => orchestrationCycleRuns.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  rationale: text("rationale").notNull(),
  evidence: json("evidence").notNull(),
  proposedAction: text("proposedAction").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["baixo", "médio", "alto"]).notNull().default("médio"),
  status: mysqlEnum("status", IMPROVEMENT_PROPOSAL_STATUSES).notNull().default("pendente"),
  reviewedBy: int("reviewedBy").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orchestraInboxEvents = mysqlTable("orchestra_inbox_events", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 255 }).notNull(),
  eventName: varchar("eventName", { length: 160 }).notNull(),
  source: varchar("source", { length: 160 }).notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  payload: json("payload").notNull(),
  status: mysqlEnum("status", ORCHESTRA_INBOX_STATUSES).notNull().default("recebido"),
  verificationError: text("verificationError"),
}, table => [uniqueIndex("orchestra_inbox_events_event_unique").on(table.eventId)]);

export const operationalMaturityProfiles = mysqlTable("operational_maturity_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: int("score").notNull().default(0),
  level: mysqlEnum("level", OPERATIONAL_MATURITY_LEVELS).notNull().default("observação"),
  autonomyCeiling: mysqlEnum("autonomyCeiling", ["observação", "orientação", "proposta"]).notNull().default("observação"),
  evidenceCount: int("evidenceCount").notNull().default(0),
  approvedProposalCount: int("approvedProposalCount").notNull().default(0),
  reviewedMemoryCount: int("reviewedMemoryCount").notNull().default(0),
  protectedStorage: int("encryptedAtRest").notNull().default(1),
  lastCalculatedAt: timestamp("lastCalculatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("operational_maturity_profiles_user_unique").on(table.userId)]);

export const governanceCatalogEntries = mysqlTable("governance_catalog_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: mysqlEnum("kind", GOVERNANCE_CATALOG_KINDS).notNull(),
  identifier: varchar("identifier", { length: 160 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", GOVERNANCE_CATALOG_STATUSES).notNull().default("catálogo"),
  riskLevel: mysqlEnum("riskLevel", ["baixo", "médio", "alto"]).notNull().default("médio"),
  requiresHumanApproval: int("requiresHumanApproval").notNull().default(1),
  externalEndpoint: varchar("externalEndpoint", { length: 1024 }),
  purpose: text("purpose").notNull(),
  guardrail: text("guardrail").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("governance_catalog_user_identifier_unique").on(table.userId, table.identifier)]);

export const governedToolInvocations = mysqlTable("governed_tool_invocations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  catalogEntryId: int("catalogEntryId").references(() => governanceCatalogEntries.id, { onDelete: "set null" }),
  action: varchar("action", { length: 255 }).notNull(),
  status: mysqlEnum("status", TOOL_INVOCATION_STATUSES).notNull().default("proposta"),
  requestSummary: text("requestSummary").notNull(),
  resultSummary: text("resultSummary"),
  reviewedBy: int("reviewedBy").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const coreRoleAuditEvents = mysqlTable("core_role_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: mysqlEnum("roleId", ["planner", "executor", "monitor", "optimizer"]).notNull(),
  eventName: varchar("eventName", { length: 255 }).notNull(),
  status: mysqlEnum("status", CORE_ROLE_AUDIT_STATUSES).notNull(),
  evidenceCount: int("evidenceCount").notNull().default(0),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoProject = typeof videoProjects.$inferSelect;
export type InsertVideoProject = typeof videoProjects.$inferInsert;
export type VideoScene = typeof videoScenes.$inferSelect;
export type InsertVideoScene = typeof videoScenes.$inferInsert;
export type ProjectAsset = typeof projectAssets.$inferSelect;
export type ReferenceAsset = typeof referenceAssets.$inferSelect;
export type OrchestraEvent = typeof orchestraEvents.$inferSelect;
export type FusionConnectorProfile = typeof fusionConnectorProfiles.$inferSelect;
export type FusionSyncEvent = typeof fusionSyncEvents.$inferSelect;
export type KnowledgeMemory = typeof knowledgeMemories.$inferSelect;
export type OrchestrationCycle = typeof orchestrationCycles.$inferSelect;
export type OrchestrationCycleRun = typeof orchestrationCycleRuns.$inferSelect;
export type ImprovementProposal = typeof improvementProposals.$inferSelect;
export type OrchestraInboxEvent = typeof orchestraInboxEvents.$inferSelect;
export type OperationalMaturityProfile = typeof operationalMaturityProfiles.$inferSelect;
export type GovernanceCatalogEntry = typeof governanceCatalogEntries.$inferSelect;
export type GovernedToolInvocation = typeof governedToolInvocations.$inferSelect;
export type CoreRoleAuditEvent = typeof coreRoleAuditEvents.$inferSelect;
