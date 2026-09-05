export type MutationErrorMeta = {
  errorHandling?: "local";
};

export function isLocallyHandledMutation(meta: unknown) {
  if (!meta || typeof meta !== "object") return false;
  return (meta as MutationErrorMeta).errorHandling === "local";
}
