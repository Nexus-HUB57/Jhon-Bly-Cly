import type { KnowledgeMemory } from "../drizzle/schema";
import { ORCHESTRATION_LIMITS } from "../shared/orchestrationPolicy";

export type RankedMemory = KnowledgeMemory & { score: number };

export function tokenizeMemoryQuery(value: string): string[] {
  return Array.from(new Set(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .split(/[^a-z0-9]+/i)
      .filter(token => token.length >= 3)
  ));
}

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function toTagText(tags: unknown): string {
  return Array.isArray(tags) ? tags.filter(item => typeof item === "string").join(" ") : "";
}

export function rankMemories(query: string, memories: KnowledgeMemory[], limit = ORCHESTRATION_LIMITS.maxMemoriesPerRetrieval): RankedMemory[] {
  const tokens = tokenizeMemoryQuery(query);
  if (!tokens.length) return memories.slice(0, limit).map(memory => ({ ...memory, score: 0 }));

  return memories
    .map(memory => {
      const title = normalized(memory.title);
      const summary = normalized(memory.summary);
      const content = normalized(memory.content);
      const tags = normalized(toTagText(memory.tags));
      const score = tokens.reduce((total, token) => (
        total +
        (title.includes(token) ? 5 : 0) +
        (tags.includes(token) ? 3 : 0) +
        (summary.includes(token) ? 2 : 0) +
        (content.includes(token) ? 1 : 0)
      ), 0);
      return { ...memory, score };
    })
    .filter(memory => memory.score > 0)
    .sort((a, b) => b.score - a.score || b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}
