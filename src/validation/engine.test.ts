import { describe, expect, it } from "vitest";
import { evaluateFrontendValidationRules } from "@/validation/engine";
import type { FrontendValidationProfile } from "@/validation/types";

function profile(rules: FrontendValidationProfile["rules"]): FrontendValidationProfile {
  return { rules, serverRuleCount: 0, sourceRuleCount: rules.length };
}

describe("frontend validation engine", () => {
  it("enforces required fields", () => {
    const result = evaluateFrontendValidationRules(profile([{ id: "required", kind: "required", field: "memberNumber", message: "Membership number is required." }]), {});
    expect(result.allowed).toBe(false);
    expect(result.fieldErrors.memberNumber).toBe("Membership number is required.");
  });

  it("enforces date chronology", () => {
    const result = evaluateFrontendValidationRules(profile([{ id: "dates", kind: "date-order", field: "dischargeDate", relatedField: "admissionDate", message: "Discharge cannot precede admission." }]), { admissionDate: "2026-07-20", dischargeDate: "2026-07-19" });
    expect(result.allowed).toBe(false);
  });

  it("allows an empty optional numeric field but rejects a negative value", () => {
    const rules = profile([{ id: "amount", kind: "non-negative", field: "amount", message: "Amount cannot be negative." }]);
    expect(evaluateFrontendValidationRules(rules, {}).allowed).toBe(true);
    expect(evaluateFrontendValidationRules(rules, { amount: -1 }).allowed).toBe(false);
  });

  it("enforces the maternity gender rule from user-entered data", () => {
    const result = evaluateFrontendValidationRules(profile([{ id: "maternity", kind: "maternity-gender", field: "sex", relatedField: "admissionType", message: "A maternity patient cannot be male." }]), { sex: "Male", admissionType: "Maternity" });
    expect(result.allowed).toBe(false);
  });
  it("validates South African identity number date of birth consistency", () => {
    const rules = profile([{ id: "id-dob", kind: "south-african-id-dob", field: "identityNumber", relatedField: "dateOfBirth", message: "ID and date of birth do not match." }]);
    expect(evaluateFrontendValidationRules(rules, { identityNumber: "9001015009087", dateOfBirth: "1990-01-01" }).allowed).toBe(true);
    expect(evaluateFrontendValidationRules(rules, { identityNumber: "9001015009087", dateOfBirth: "1991-01-01" }).allowed).toBe(false);
  });

});
