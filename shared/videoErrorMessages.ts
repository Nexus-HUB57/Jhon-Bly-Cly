export function toSafeVideoErrorMessage(error: unknown, fallback: string) {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const normalized = raw.toLowerCase();

  if (normalized.includes("insufficient balance")) {
    return "Saldo insuficiente no provedor de vídeo. Nenhum vídeo foi produzido nesta tentativa.";
  }
  if (normalized.includes("usage exhausted") || normalized.includes("precondition failed")) {
    return "O serviço de planejamento está temporariamente indisponível. Revise o projeto ou use um plano manual.";
  }
  if (normalized.includes("failed query:") || normalized.includes("project_versions") || normalized.includes("sql")) {
    return "Não foi possível persistir o plano de produção. A tentativa foi registrada para auditoria.";
  }

  return fallback;
}
