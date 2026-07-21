import { describe, expect, it, beforeEach } from "vitest";
import { getModuleService } from "@/services/modules/registry";
import { useWorkflow } from "@/lib/workflow-store";

/**
 * Patient journey smoke test — walks a synthetic patient through the
 * revenue-critical modules using the shared module service layer.
 * Guards against regressions in registry wiring, workflow persistence,
 * and mock-mode create/transition behaviour.
 */
describe("patient journey (mock mode)", () => {
  beforeEach(() => {
    useWorkflow.setState((s) => ({ ...s, items: { ...s.items } }));
  });

  it("creates records through patient → admission → authorisation → billing → claim", async () => {
    const steps = [
      { module: "patient-maintenance", title: "Jane Doe", subtitle: "New patient" },
      { module: "admissions", title: "ADM-Jane", subtitle: "Ward A" },
      { module: "authorisations", title: "AUTH-Jane", subtitle: "Elective" },
      { module: "billing", title: "INV-Jane", subtitle: "Draft" },
      { module: "claims", title: "CLM-Jane", subtitle: "Submitted" },
    ] as const;

    for (const step of steps) {
      const service = getModuleService(step.module);
      const result = await service.createRecord({
        title: step.title,
        subtitle: step.subtitle,
        status: "draft",
        fields: {},
      });
      expect(result.data?.id, `${step.module} create should produce an id`).toBeTruthy();
      expect(result.correlationId).toBeTruthy();
    }
  });

  it("transitions an admission through its state machine", async () => {
    const service = getModuleService("admissions");
    const created = await service.createRecord({
      title: "ADM-Transition",
      status: "draft",
      fields: {},
    });
    const id = created.data.id;

    const transitioned = await service.transitionRecord(id, "pending-validation");
    expect(transitioned.data.status).toBe("pending-validation");

    const withNote = await service.addNote(id, "Verified by desk agent");
    expect(withNote.data.history.some((h) => h.note === "Verified by desk agent")).toBe(true);
  });

  it("resolves a service for every revenue-critical module", () => {
    const keys = [
      "patient-maintenance", "triage", "clinical-assessment", "preadmission",
      "admissions", "medical-events", "authorisations", "billing", "funding",
      "accounting", "reimbursements", "coid", "adhoc-and-supplier-invoices",
      "payments", "claims", "member-validation", "ward-management",
      "theatre-management", "pharmacy", "case-management", "clinical-coding",
    ];
    for (const key of keys) {
      const svc = getModuleService(key);
      expect(svc, `service for ${key}`).toBeTruthy();
      expect(svc.moduleKey).toBe(key);
    }
  });
});
