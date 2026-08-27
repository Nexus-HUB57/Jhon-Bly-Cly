import { describe, expect, it } from "vitest";

type ProviderCheck = {
  name: string;
  key: string;
  url: string;
  headers: (secret: string) => HeadersInit;
};

const checks: ProviderCheck[] = [
  { name: "Z.AI", key: "ZAI_API_KEY", url: "https://api.z.ai/api/paas/v4/models", headers: secret => ({ Authorization: `Bearer ${secret}` }) },
  { name: "Google AI Studio", key: "GEMINI_API_KEY", url: "https://generativelanguage.googleapis.com/v1beta/models", headers: secret => ({ "x-goog-api-key": secret }) },
];

describe("JBCx19 provider credentials", () => {
  for (const provider of checks) {
    it(`envia uma consulta leve autenticada para ${provider.name} sem expor a credencial`, async () => {
      const secret = process.env[provider.key];
      expect(secret, `${provider.key} deve estar configurada`).toBeTruthy();
      const response = await fetch(provider.url, { headers: provider.headers(secret!) });
      expect(response.status, `${provider.name} rejeitou a credencial configurada`).not.toBe(401);
      expect(response.status, `${provider.name} rejeitou a credencial configurada`).not.toBe(403);
    }, 20_000);
  }
});
