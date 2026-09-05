export const FORBIDDEN_JBCX19_OPERATIONS = [
  "coleta ou reutilização de segredos descobertos em código-fonte",
  "execução dinâmica de payload ou código externo não revisado",
  "instalação automática de dependências ou runtimes de terceiros",
] as const;

export function isJbcx19OperationAllowed(operation: string) {
  const normalized = operation.trim().toLowerCase();
  return !FORBIDDEN_JBCX19_OPERATIONS.some(forbidden => normalized.includes(forbidden));
}
