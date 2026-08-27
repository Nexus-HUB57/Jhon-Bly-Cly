import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isLocallyHandledMutation } from "../client/src/lib/errorHandling";

describe("registro global de falhas do cliente", () => {
  it("não registra como erro global uma mutation marcada para tratamento local", () => {
    const clientSource = readFileSync(new URL("../client/src/main.tsx", import.meta.url), "utf8");
    const workspaceSource = readFileSync(new URL("../client/src/pages/ProjectWorkspace.tsx", import.meta.url), "utf8");
    expect(isLocallyHandledMutation({ errorHandling: "local" })).toBe(true);
    expect(isLocallyHandledMutation({ errorHandling: "global" })).toBe(false);
    expect(isLocallyHandledMutation(undefined)).toBe(false);
    expect(clientSource).toContain('if (!isLocallyHandledMutation(event.mutation.options.meta)) console.error("[API Mutation Error]", error);');
    expect(workspaceSource).toContain('requestVideoGeneration.useMutation({ meta: { errorHandling: "local" }');
  });
});
