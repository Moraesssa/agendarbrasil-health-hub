import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRequestUrl, verifyCRMWithExternalService } from "@/services/crmValidationService";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("buildRequestUrl", () => {
  it("appends crm and uf to absolute URLs", () => {
    const url = buildRequestUrl("https://example.com/api", "12345/SP");
    expect(url).toBe("https://example.com/api?crm=12345%2FSP&uf=SP");
  });

  it("appends parameters to relative URLs", () => {
    const url = buildRequestUrl("/api/check", "12345/SP");
    expect(url).toBe("/api/check?crm=12345%2FSP&uf=SP");
  });

  it("does not duplicate existing parameters", () => {
    const url = buildRequestUrl("https://example.com/api?crm=999%2FSP", "12345/SP");
    expect(url).toBe("https://example.com/api?crm=999%2FSP&uf=SP");
  });
});

describe("verifyCRMWithExternalService", () => {
  it("returns null when service URL is not configured", async () => {
    vi.unstubAllEnvs();
    const result = await verifyCRMWithExternalService("12345/SP");
    expect(result).toBeNull();
  });

  it("returns valid when external service confirms CRM", async () => {
    vi.stubEnv("VITE_CRM_VALIDATION_URL", "https://example.com/validate");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await verifyCRMWithExternalService("12345/SP");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/validate?crm=12345%2FSP&uf=SP",
      { method: "GET" }
    );
    expect(result).toEqual({ status: "valid" });
  });

  it("returns invalid when service denies CRM", async () => {
    vi.stubEnv("VITE_CRM_VALIDATION_URL", "https://example.com/validate");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: false, message: "CRM inválido" }),
    }));

    const result = await verifyCRMWithExternalService("12345/SP");

    expect(result).toEqual({ status: "invalid", message: "CRM inválido" });
  });

  it("retorna erro quando a chamada falha", async () => {
    vi.stubEnv("VITE_CRM_VALIDATION_URL", "https://example.com/validate");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const result = await verifyCRMWithExternalService("12345/SP");

    expect(result).toEqual({
      status: "error",
      message: "Não foi possível validar o CRM na base oficial.",
    });
  });

  it("retorna erro quando o serviço responde com status diferente", async () => {
    vi.stubEnv("VITE_CRM_VALIDATION_URL", "https://example.com/validate");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }));

    const result = await verifyCRMWithExternalService("12345/SP");

    expect(result).toEqual({
      status: "error",
      message: "Serviço de validação indisponível no momento.",
    });
  });

  it("retorna erro quando a resposta não contém o campo valid", async () => {
    vi.stubEnv("VITE_CRM_VALIDATION_URL", "https://example.com/validate");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "unknown" }),
    }));

    const result = await verifyCRMWithExternalService("12345/SP");

    expect(result).toEqual({
      status: "error",
      message: "Resposta inesperada do serviço de validação de CRM.",
    });
  });
});
