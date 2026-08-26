import { int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { TASK_STATUSES } from "../shared/video";

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

export type VideoProject = typeof videoProjects.$inferSelect;
export type InsertVideoProject = typeof videoProjects.$inferInsert;
export type VideoScene = typeof videoScenes.$inferSelect;
export type InsertVideoScene = typeof videoScenes.$inferInsert;
export type ProjectAsset = typeof projectAssets.$inferSelect;
export type OrchestraEvent = typeof orchestraEvents.$inferSelect;
export type FusionConnectorProfile = typeof fusionConnectorProfiles.$inferSelect;
export type FusionSyncEvent = typeof fusionSyncEvents.$inferSelect;
