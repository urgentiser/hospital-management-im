import { describe, expect, it } from "vitest";
import { evaluateRuleIds } from "@/rules/engine";

const context = {
  moduleKey: "patients",
  action: "create",
  values: {},
  user: {
    subject: "test",
    displayName: "Test User",
    roles: ["Test"],
    permissions: ["*"],
    facilities: [{ id: "life-fourways", name: "Life Fourways" }],
    accountState: "active" as const,
  },
  facility: "Life Fourways",
  requiredFields: [{ name: "patient", label: "Patient" }],
  correlationId: "test-correlation",
};

describe("business rules engine", () => {
  it("blocks missing required fields", async () => {
    const result = await evaluateRuleIds(["common.required-fields"], context);
    expect(result.allowed).toBe(false);
    expect(result.fieldErrors.patient).toBe("Patient is required.");
  });
});
