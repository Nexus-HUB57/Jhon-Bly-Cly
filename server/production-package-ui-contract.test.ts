import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("interface de pacote de produção", () => {
  it("expõe planejamento de keyframe, áudio, montagem e qualidade sem oferecer execução implícita", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/ProjectWorkspace.tsx"), "utf8");
    expect(source).toContain("Pacote de produção");
    expect(source).toContain("Keyframe e movimento");
    expect(source).toContain("Plano de áudio");
    expect(source).toContain("Montagem proposta");
    expect(source).toContain("Gate de qualidade");
    expect(source).toContain("Aprovação não executa mídia.");
    expect(source).toContain("Ele não cria mídia, não chama modelos e não inicia composição.");
  });
});
