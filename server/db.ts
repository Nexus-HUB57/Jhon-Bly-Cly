import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  generationRuns,
  fusionConnectorProfiles,
  fusionSyncEvents,
  InsertUser,
  InsertVideoProject,
  InsertVideoScene,
  orchestraEvents,
  projectAssets,
  projectVersions,
  users,
  videoProjects,
  videoScenes,
} from "../drizzle/schema";
import type { TaskStatus } from "../shared/video";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

function requireDatabase<T>(db: T | null): T {
  if (!db) throw new Error("Banco de dados indisponível.");
  return db;
}

export type ProjectCreateInput = Pick<
  InsertVideoProject,
  "name" | "briefing" | "format" | "durationSeconds" | "language" | "objective" | "creativeDirection"
>;

export async function createVideoProject(userId: number, input: ProjectCreateInput) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(videoProjects).values({ ...input, userId, status: "rascunho" });
  return Number(result[0].insertId);
}

export async function listVideoProjects(userId: number) {
  const db = requireDatabase(await getDb());
  return db.select().from(videoProjects).where(eq(videoProjects.userId, userId)).orderBy(desc(videoProjects.updatedAt));
}

export async function getVideoProject(projectId: number, userId: number) {
  const db = requireDatabase(await getDb());
  const result = await db
    .select()
    .from(videoProjects)
    .where(and(eq(videoProjects.id, projectId), eq(videoProjects.userId, userId)))
    .limit(1);
  return result[0];
}

export async function getProjectWorkspace(projectId: number, userId: number) {
  const project = await getVideoProject(projectId, userId);
  if (!project) return undefined;
  const db = requireDatabase(await getDb());
  const [scenes, assets, versions, events, runs] = await Promise.all([
    db.select().from(videoScenes).where(eq(videoScenes.projectId, projectId)).orderBy(asc(videoScenes.sceneNumber)),
    db.select().from(projectAssets).where(eq(projectAssets.projectId, projectId)).orderBy(desc(projectAssets.createdAt)),
    db.select().from(projectVersions).where(eq(projectVersions.projectId, projectId)).orderBy(desc(projectVersions.versionNumber)),
    db.select().from(orchestraEvents).where(eq(orchestraEvents.projectId, projectId)).orderBy(desc(orchestraEvents.occurredAt)),
    db.select().from(generationRuns).where(eq(generationRuns.projectId, projectId)).orderBy(desc(generationRuns.startedAt)),
  ]);
  return { project, scenes, assets, versions, events, runs };
}

export async function updateVideoProject(
  projectId: number,
  userId: number,
  data: Partial<Pick<InsertVideoProject, "name" | "briefing" | "format" | "durationSeconds" | "language" | "objective" | "creativeDirection" | "script" | "creativeSummary" | "status">>
) {
  const db = requireDatabase(await getDb());
  await db.update(videoProjects).set({ ...data, updatedAt: new Date() }).where(and(eq(videoProjects.id, projectId), eq(videoProjects.userId, userId)));
}

export async function replaceProjectPlan(
  projectId: number,
  userId: number,
  plan: { script: string; creativeSummary: string; scenes: Array<Omit<InsertVideoScene, "projectId" | "id" | "createdAt" | "updatedAt">> }
) {
  const db = requireDatabase(await getDb());
  await db.transaction(async tx => {
    await tx.delete(videoScenes).where(eq(videoScenes.projectId, projectId));
    if (plan.scenes.length) {
      await tx.insert(videoScenes).values(plan.scenes.map(scene => ({ ...scene, projectId })));
    }
    await tx.update(videoProjects).set({ script: plan.script, creativeSummary: plan.creativeSummary, status: "aguardando revisão", updatedAt: new Date() }).where(and(eq(videoProjects.id, projectId), eq(videoProjects.userId, userId)));
    await tx.insert(projectVersions).values({
      projectId,
      versionNumber: Date.now(),
      versionType: "planejamento gerado",
      content: plan,
      createdBy: userId,
    });
  });
}

export async function getSceneForUser(sceneId: number, userId: number) {
  const db = requireDatabase(await getDb());
  const result = await db
    .select({ scene: videoScenes, project: videoProjects })
    .from(videoScenes)
    .innerJoin(videoProjects, eq(videoScenes.projectId, videoProjects.id))
    .where(and(eq(videoScenes.id, sceneId), eq(videoProjects.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateScene(
  sceneId: number,
  userId: number,
  data: Partial<Pick<InsertVideoScene, "title" | "durationSeconds" | "narrative" | "camera" | "visualPrompt" | "productionPrompt" | "storyboardPrompt" | "referenceImageUrl" | "generationConfig" | "status">>
) {
  const db = requireDatabase(await getDb());
  const scene = await getSceneForUser(sceneId, userId);
  if (!scene) return undefined;
  await db.update(videoScenes).set({ ...data, updatedAt: new Date() }).where(eq(videoScenes.id, sceneId));
  return scene;
}

export async function updateProjectScenesStatus(projectId: number, status: TaskStatus) {
  const db = requireDatabase(await getDb());
  await db.update(videoScenes).set({ status, updatedAt: new Date() }).where(eq(videoScenes.projectId, projectId));
}

export async function createGenerationRun(input: {
  projectId: number;
  sceneId?: number | null;
  runType: "planejamento" | "imagem_referência" | "vídeo" | "exportação";
  status: TaskStatus;
  input: unknown;
}) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(generationRuns).values({ ...input, input: input.input });
  return Number(result[0].insertId);
}

export async function completeGenerationRun(runId: number, status: TaskStatus, output?: unknown, errorMessage?: string) {
  const db = requireDatabase(await getDb());
  await db.update(generationRuns).set({ status, output, errorMessage, finishedAt: new Date() }).where(eq(generationRuns.id, runId));
}

export async function createProjectAsset(input: {
  projectId: number;
  sceneId?: number | null;
  uploadedBy: number;
  name: string;
  storageKey?: string | null;
  url: string;
  mimeType: string;
  byteSize: number;
  kind: "referência" | "imagem gerada" | "resultado de vídeo" | "exportação";
}) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(projectAssets).values(input);
  return Number(result[0].insertId);
}

export async function createOrchestraEvent(input: {
  projectId: number;
  sceneId?: number | null;
  eventName: string;
  entityType: string;
  entityId: number;
  payload: unknown;
}) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(orchestraEvents).values({ ...input, payload: input.payload });
  const id = Number(result[0].insertId);
  const [event] = await db.select().from(orchestraEvents).where(eq(orchestraEvents.id, id)).limit(1);
  return event;
}

export async function recordOrchestraDelivery(eventId: number, delivered: boolean, error?: string) {
  const db = requireDatabase(await getDb());
  await db.update(orchestraEvents).set({
    deliveryStatus: delivered ? "entregue" : "falha",
    deliveryAttempts: 1,
    deliveryError: error ?? null,
    deliveredAt: delivered ? new Date() : null,
  }).where(eq(orchestraEvents.id, eventId));
}

export async function listFusionConnectorProfiles(userId: number) {
  const db = requireDatabase(await getDb());
  return db.select().from(fusionConnectorProfiles).where(eq(fusionConnectorProfiles.userId, userId));
}

export async function stageFusionConnector(userId: number, connectorId: string) {
  const db = requireDatabase(await getDb());
  await db.insert(fusionConnectorProfiles).values({
    userId,
    connectorId,
    status: "aguardando credencial",
  }).onDuplicateKeyUpdate({
    set: { status: "aguardando credencial", updatedAt: new Date() },
  });
}

export async function createFusionSyncEvent(userId: number, eventName: string, payload: unknown) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(fusionSyncEvents).values({ userId, eventName, payload });
  const id = Number(result[0].insertId);
  const [event] = await db.select().from(fusionSyncEvents).where(eq(fusionSyncEvents.id, id)).limit(1);
  return event;
}

export async function recordFusionSyncDelivery(eventId: number, delivered: boolean, error?: string) {
  const db = requireDatabase(await getDb());
  await db.update(fusionSyncEvents).set({
    deliveryStatus: delivered ? "entregue" : "falha",
    deliveryAttempts: 1,
    deliveryError: error ?? null,
    deliveredAt: delivered ? new Date() : null,
  }).where(eq(fusionSyncEvents.id, eventId));
}
