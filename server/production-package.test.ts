import { describe, expect, it } from "vitest";
import { buildDefaultProductionPackage, isProductionPackageStatus } from "../shared/productionPackage";

describe("pacote de produção auditável", () => {
  it("deriva um plano de keyframe, áudio, montagem e qualidade sem produzir mídia", () => {
    const productionPackage = buildDefaultProductionPackage({
      durationSeconds: 8,
      storyboardPrompt: "Persona central em estúdio, luz lateral e aproximação suave.",
      camera: "Plano médio com dolly-in lento.",
      narrative: "A persona sustenta presença comercial enquanto a câmera se aproxima.",
    });

    expect(productionPackage.keyframePlan.visualAnchor).toContain("Persona central");
    expect(productionPackage.audioPlan.targetDurationSeconds).toBe(8);
    expect(productionPackage.editDecisionList.transition).toContain("clipes reais");
    expect(productionPackage.qualityGate.reviewerGuidance).toContain("revisão humana");
    expect(JSON.stringify(productionPackage)).not.toContain("taskId");
    expect(JSON.stringify(productionPackage)).not.toContain("Authorization");
  });

  it("aceita apenas estados explícitos de pacote de produção", () => {
    expect(isProductionPackageStatus("rascunho")).toBe(true);
    expect(isProductionPackageStatus("aprovado")).toBe(true);
    expect(isProductionPackageStatus("gerando")).toBe(false);
    expect(isProductionPackageStatus("concluído")).toBe(false);
  });
});
