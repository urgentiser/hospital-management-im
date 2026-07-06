import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/pharmacy")({
  head: () => ({ meta: [{ title: "Pharmacy — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "pharmacy",
        eyebrow: "Clinical · Pharmacy",
        title: "Pharmacy",
        description: "Medication orders, picking, dispensing and administration workflow.",
        workflow: ["ordered", "picked", "dispensed", "completed"],
        outcomes: ["cancelled"],
        columns: [
          { key: "title", label: "Medication" },
          { key: "Patient", label: "Patient" },
          { key: "Ward", label: "Ward" },
          { key: "Prescriber", label: "Prescriber" },
        ],
        fields: [
          { key: "medication", label: "Medication & dose", required: true, placeholder: "e.g. Paracetamol 500mg × 20" },
          { key: "patient", label: "Patient", required: true },
          { key: "ward", label: "Ward" },
          { key: "prescriber", label: "Prescriber" },
          { key: "instructions", label: "Instructions", type: "textarea" },
        ],
        titleFrom: (f) => String(f["Medication & dose"] || "New order"),
        subtitleFrom: (f) => `${f["Patient"]} · ${f["Ward"]}`,
      }}
    />
  ),
});
