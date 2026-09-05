import { describe, expect, it } from "vitest";
import { toSafeVideoErrorMessage } from "../shared/videoErrorMessages";

describe("mensagens seguras de execução de vídeo", () => {
  it("redige SQL e parâmetros internos de uma falha histórica", () => {
    const message = toSafeVideoErrorMessage(
      "Failed query: insert into `project_versions` values (?, ?, { briefing: 'conteúdo interno' })",
      "Não foi possível registrar o plano manual.",
    );

    expect(message).toBe("Não foi possível persistir o plano de produção. A tentativa foi registrada para auditoria.");
    expect(message).not.toContain("project_versions");
    expect(message).not.toContain("conteúdo interno");
  });

  it("preserva uma orientação segura para saldo insuficiente", () => {
    expect(toSafeVideoErrorMessage("insufficient balance (1008)", "Falha ao solicitar o vídeo.")).toBe(
      "Saldo insuficiente no provedor de vídeo. Nenhum vídeo foi produzido nesta tentativa.",
    );
  });
});
