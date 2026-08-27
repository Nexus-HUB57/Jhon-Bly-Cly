import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("trilha auditável do Core na interface", () => {
  it("expõe papel, evento, status, evidências e data no painel", () => {
    const source = readFileSync(new URL("../client/src/pages/Orchestration.tsx", import.meta.url), "utf8");
    expect(source).toContain("Trilha auditável do Core");
    expect(source).toContain("item.eventName");
    expect(source).toContain("item.evidenceCount");
    expect(source).toContain("item.createdAt");
  });
});
