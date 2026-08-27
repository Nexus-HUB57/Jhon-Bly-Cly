import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("atualização do projeto após falha de vídeo", () => {
  it("invalida a consulta do projeto no caminho de erro da geração", () => {
    const source = readFileSync(new URL("../client/src/pages/ProjectWorkspace.tsx", import.meta.url), "utf8");
    expect(source).toContain("const requestGeneration = trpc.video.projects.requestVideoGeneration.useMutation");
    expect(source).toContain("onError: async error => { toast.error(error.message); await refresh(); }");
  });
});
