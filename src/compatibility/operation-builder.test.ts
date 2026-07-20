import { describe, expect, it } from "vitest";
import { createCompatibilityPayload } from "@/compatibility/operation-builder";
import type { CompatibilityOperation } from "@/compatibility/types";

function operation(overrides: Partial<CompatibilityOperation> = {}): CompatibilityOperation {
  return {
    id: "patients:register-patient",
    moduleKey: "patient-maintenance",
    moduleName: "Patient Maintenance",
    action: "Register Patient",
    privilege: "RegisterPatient",
    contextType: "HospitalUnit",
    navigationType: "FreeNavigation",
    workflowType: null,
    sourcePath: null,
    steps: ["Identify Context", "Capture Details", "Confirm"],
    serviceInterface: "IRichPatientService",
    method: "RegisterPatient",
    parameters: [{ name: "patient", contractType: "PatientDetails", collection: false, primitive: false }],
    fields: [
      { path: "patient.FirstName", name: "patient_FirstName", label: "First name", contractType: "string", inputType: "text", required: true, stepIndex: 1 },
      { path: "patient.DateOfBirth", name: "patient_DateOfBirth", label: "Date of birth", contractType: "DateTime", inputType: "date", required: true, stepIndex: 1 },
    ],
    frontendValidationRules: [],
    serverValidationRuleCount: 0,
    ...overrides,
  };
}

describe("createCompatibilityPayload", () => {
  it("sends a single complex DTO directly as the body", () => {
    const payload = createCompatibilityPayload(operation(), {
      patient_FirstName: "Nomsa",
      patient_DateOfBirth: "1988-03-20",
    });

    expect(payload).toEqual({ FirstName: "Nomsa", DateOfBirth: "1988-03-20" });
  });

  it("preserves parameter names when a method has multiple parameters", () => {
    const subject = operation({
      parameters: [
        { name: "admissionId", contractType: "Guid", collection: false, primitive: true },
        { name: "reason", contractType: "string", collection: false, primitive: true },
      ],
      fields: [
        { path: "admissionId", name: "admissionId", label: "Admission ID", contractType: "Guid", inputType: "text", required: true, stepIndex: 1 },
        { path: "reason", name: "reason", label: "Reason", contractType: "string", inputType: "text", required: true, stepIndex: 1 },
      ],
    });

    expect(createCompatibilityPayload(subject, { admissionId: "a1", reason: "Correction" }))
      .toEqual({ admissionId: "a1", reason: "Correction" });
  });

  it("converts numeric and boolean fields without changing property names", () => {
    const subject = operation({
      parameters: [{ name: "request", contractType: "MoveToBedRequest", collection: false, primitive: false }],
      fields: [
        { path: "request.BedId", name: "request_BedId", label: "Bed ID", contractType: "int", inputType: "number", required: true, stepIndex: 1 },
        { path: "request.Override", name: "request_Override", label: "Override", contractType: "bool", inputType: "checkbox", required: false, stepIndex: 1 },
      ],
    });

    expect(createCompatibilityPayload(subject, { request_BedId: "42", request_Override: true }))
      .toEqual({ BedId: 42, Override: true });
  });
});
