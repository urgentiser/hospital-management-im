import { describe, expect, it } from "vitest";
import { hasPermission } from "@/security/permissions";

const principal = {
  subject: "test",
  displayName: "Test",
  roles: ["Admissions"],
  permissions: ["Admission.*"],
  facilities: [],
  accountState: "active" as const,
};

describe("permissions", () => {
  it("supports module wildcards", () => {
    expect(hasPermission(principal, "Admission.Discharge")).toBe(true);
    expect(hasPermission(principal, "Billing.Finalise")).toBe(false);
  });
});
