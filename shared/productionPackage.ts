export const PRODUCTION_PACKAGE_STATUSES = ["rascunho", "aguardando revisão", "aprovado", "rejeitado"] as const;
export type ProductionPackageStatus = (typeof PRODUCTION_PACKAGE_STATUSES)[number];

export type ProductionPackageContent = {
  keyframePlan: {
    visualAnchor: string;
    cameraDirection: string;
    movementDirection: string;
  };
  audioPlan: {
    targetDurationSeconds: number;
    sourceGuidance: string;
    synchronizationGuidance: string;
  };
  editDecisionList: {
    transition: string;
    pacingGuidance: string;
    colorGuidance: string;
  };
  qualityGate: {
    technicalCriteria: string;
    artisticCriteria: string;
    reviewerGuidance: string;
  };
};

export function buildDefaultProductionPackage(scene: {
  durationSeconds: number;
  storyboardPrompt: string;
  camera: string | null;
  narrative: string;
}): ProductionPackageContent {
  return {
    keyframePlan: {
      visualAnchor: scene.storyboardPrompt,
      cameraDirection: scene.camera?.trim() || "Definir câmera antes da execução.",
      movementDirection: "Confirmar movimento e continuidade na revisão humana.",
    },
    audioPlan: {
      targetDurationSeconds: scene.durationSeconds,
      sourceGuidance: "Associar apenas áudio de referência autorizado ao projeto.",
      synchronizationGuidance: "Validar ritmo e sincronização antes de qualquer composição.",
    },
    editDecisionList: {
      transition: "Definir transição após a aprovação dos clipes reais.",
      pacingGuidance: `Preservar o ritmo da cena: ${scene.narrative}`,
      colorGuidance: "Manter continuidade de cor e exposição entre as cenas aprovadas.",
    },
    qualityGate: {
      technicalCriteria: "Revisar duração, formato, nitidez, áudio e ausência de artefatos visíveis.",
      artisticCriteria: "Revisar aderência ao roteiro, enquadramento, identidade visual e continuidade narrativa.",
      reviewerGuidance: "Registrar evidências de revisão humana; não aprovar com base em métricas não executadas.",
    },
  };
}

export function isProductionPackageStatus(value: string): value is ProductionPackageStatus {
  return (PRODUCTION_PACKAGE_STATUSES as readonly string[]).includes(value);
}
