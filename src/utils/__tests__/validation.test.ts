import { describe, expect, it } from "vitest";
import { normalizeCRM, validateCRM } from "@/utils/validation";

describe("validateCRM", () => {
  it("accepts CRM with 4 digits and uppercase UF", () => {
    expect(validateCRM("1234/SP")).toBe(true);
  });

  it("accepts CRM with 6 digits and mixed formatting", () => {
    expect(validateCRM("  123456 / sp ")).toBe(true);
  });

  it("rejects CRM shorter than four digits", () => {
    expect(validateCRM("123/SP")).toBe(false);
  });

  it("rejects CRM longer than six digits", () => {
    expect(validateCRM("1234567/SP")).toBe(false);
  });

  it("rejects CRM without UF", () => {
    expect(validateCRM("12345")).toBe(false);
  });

  it("rejects CRM with invalid characters", () => {
    expect(validateCRM("12A45/SP")).toBe(false);
  });

  it("sanitizes CRM before validating", () => {
    expect(validateCRM("<script>alert('x')</script>1234/sp")).toBe(true);
  });
});

describe("normalizeCRM", () => {
  it("removes spaces and uppercases UF", () => {
    expect(normalizeCRM(" 12345 / sp ")).toBe("12345/SP");
  });

  it("remove scripts maliciosos antes de normalizar", () => {
    expect(normalizeCRM("<script>alert('x')</script>1234/sp")).toBe("1234/SP");
  });
});
