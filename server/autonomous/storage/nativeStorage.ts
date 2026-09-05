/**
 * Motor de Armazenamento Nativo — Substitui S3/Forge Storage
 * 
 * Sistema de armazenamento 100% local com filesystem.
 * Zero dependências de S3, Forge, ou serviços de nuvem.
 * Suporta presign compatível (path-based), listagem e cleanup.
 */

import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile, unlink, stat, readdir, rm } from "fs/promises";
import { existsSync } from "fs";
import { join, extname, basename } from "path";

// ─── Configuração ────────────────────────────────────────────────

const STORAGE_ROOT = process.env.NATIVE_STORAGE_ROOT ?? "/home/z/my-project/Jhon-Bly-Cly/.storage";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

// ─── Inicialização ───────────────────────────────────────────────

async function ensureStorageDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// ─── API Pública (compatível com storage.ts existente) ───────────

/**
 * nativeStoragePut — Substituto de storagePut (Forge/S3).
 * Salva arquivo localmente no diretório de storage.
 */
export async function nativeStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const filePath = join(STORAGE_ROOT, key);

  // Garantir diretório pai existe
  const dir = join(filePath, "..");
  await ensureStorageDir(dir);

  // Escrever arquivo
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as ArrayBuffer);
  await writeFile(filePath, buffer);

  return { key, url: `/manus-storage/${key}` };
}

/**
 * nativeStorageGet — Substituto de storageGet.
 * Retorna path local para o arquivo.
 */
export async function nativeStorageGet(
  relKey: string,
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

/**
 * nativeStorageGetSignedUrl — Substituto de storageGetSignedUrl.
 * Retorna URL path-based (sem necessidade de S3 presign).
 */
export async function nativeStorageGetSignedUrl(
  relKey: string,
): Promise<string> {
  const key = normalizeKey(relKey);
  return `/manus-storage/${key}`;
}

/**
 * nativeStorageRead — Lê arquivo do storage local.
 */
export async function nativeStorageRead(
  relKey: string,
): Promise<Buffer> {
  const key = normalizeKey(relKey);
  const filePath = join(STORAGE_ROOT, key);

  if (!existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${key}`);
  }

  return readFile(filePath);
}

/**
 * nativeStorageDelete — Remove arquivo do storage local.
 */
export async function nativeStorageDelete(
  relKey: string,
): Promise<void> {
  const key = normalizeKey(relKey);
  const filePath = join(STORAGE_ROOT, key);

  if (existsSync(filePath)) {
    await unlink(filePath);
  }
}

/**
 * nativeStorageList — Lista arquivos no storage local.
 */
export async function nativeStorageList(
  prefix?: string,
): Promise<Array<{ key: string; size: number; modifiedAt: Date }>> {
  const searchDir = prefix ? join(STORAGE_ROOT, prefix) : STORAGE_ROOT;

  if (!existsSync(searchDir)) {
    return [];
  }

  const results: Array<{ key: string; size: number; modifiedAt: Date }> = [];
  const entries = await readdir(searchDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(searchDir, entry.name);
    if (entry.isFile()) {
      const info = await stat(fullPath);
      results.push({
        key: prefix ? `${prefix}/${entry.name}` : entry.name,
        size: info.size,
        modifiedAt: info.mtime,
      });
    }
  }

  return results;
}

/**
 * nativeStorageCleanup — Remove arquivos mais antigos que N dias.
 */
export async function nativeStorageCleanup(
  maxAgeDays: number,
  prefix?: string,
): Promise<{ removed: number; freedBytes: number }> {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const files = await nativeStorageList(prefix);

  let removed = 0;
  let freedBytes = 0;

  for (const file of files) {
    if (file.modifiedAt.getTime() < cutoff) {
      await nativeStorageDelete(file.key);
      removed++;
      freedBytes += file.size;
    }
  }

  return { removed, freedBytes };
}

/**
 * nativeStorageStats — Estatísticas do storage local.
 */
export async function nativeStorageStats(): Promise<{
  totalFiles: number;
  totalBytes: number;
  directories: string[];
}> {
  if (!existsSync(STORAGE_ROOT)) {
    return { totalFiles: 0, totalBytes: 0, directories: [] };
  }

  const files = await nativeStorageList();
  const dirs = new Set<string>();

  for (const file of files) {
    const parts = file.key.split("/");
    if (parts.length > 1) dirs.add(parts[0]);
  }

  return {
    totalFiles: files.length,
    totalBytes: files.reduce((sum, f) => sum + f.size, 0),
    directories: [...dirs],
  };
}

// ─── Utilitários ─────────────────────────────────────────────────

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
