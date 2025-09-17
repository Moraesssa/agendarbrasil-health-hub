export type CRMVerificationStatus = "valid" | "invalid" | "error";

export interface CRMVerificationResult {
  status: CRMVerificationStatus;
  message?: string;
}

const buildRequestUrl = (baseUrl: string, crm: string): string => {
  const [, uf] = crm.split("/");

  try {
    const url = new URL(baseUrl);
    if (!url.searchParams.has("crm")) {
      url.searchParams.set("crm", crm);
    }
    if (uf && !url.searchParams.has("uf")) {
      url.searchParams.set("uf", uf);
    }
    return url.toString();
  } catch {
    const hasQuery = baseUrl.includes("?");
    const hasCrm = /[?&]crm=/.test(baseUrl);
    const hasUf = /[?&]uf=/.test(baseUrl);

    const params: string[] = [];
    if (!hasCrm) {
      params.push(`crm=${encodeURIComponent(crm)}`);
    }
    if (uf && !hasUf) {
      params.push(`uf=${encodeURIComponent(uf)}`);
    }

    if (params.length === 0) {
      return baseUrl;
    }

    return `${baseUrl}${hasQuery ? "&" : "?"}${params.join("&")}`;
  }
};

export const verifyCRMWithExternalService = async (
  crm: string
): Promise<CRMVerificationResult | null> => {
  const validationUrl = import.meta.env?.VITE_CRM_VALIDATION_URL;
  if (!validationUrl) {
    return null;
  }

  const requestUrl = buildRequestUrl(validationUrl, crm);

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
    });

    if (!response.ok) {
      return {
        status: "error",
        message: "Serviço de validação indisponível no momento.",
      };
    }

    const payload = await response.json();

    if (payload?.valid === true) {
      return { status: "valid" };
    }

    if (payload?.valid === false) {
      return {
        status: "invalid",
        message: payload?.message || "CRM não encontrado na base oficial",
      };
    }

    return {
      status: "error",
      message: "Resposta inesperada do serviço de validação de CRM.",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Não foi possível validar o CRM na base oficial.",
    };
  }
};

export { buildRequestUrl };
