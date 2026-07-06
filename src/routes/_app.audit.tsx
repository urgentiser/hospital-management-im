import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "Audit — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "audit",
        eyebrow: "Platform · Audit",
        title: "Audit Trail",
        description: "Immutable audit log — file a new entry, drill into correlation IDs and export for compliance.",
        workflow: ["logged", "reviewed", "sealed"],
        columns: [
          { key: "title", label: "Event" },
          { key: "Actor", label: "Actor" },
          { key: "Module", label: "Module" },
          { key: "Correlation", label: "Correlation" },
        ],
        fields: [
          { key: "event", label: "Event description", required: true },
          { key: "actor", label: "Actor", required: true },
          { key: "module", label: "Module", type: "select", options: ["Patients", "Admissions", "Authorisations", "Pharmacy", "Theatre", "Ward", "Billing", "Integrations", "Admin"] },
          { key: "correlation", label: "Correlation ID" },
        ],
        titleFrom: (f) => String(f["Event description"] || "New audit entry"),
        subtitleFrom: (f) => `${f["Actor"]} · ${f["Module"]}`,
      }}
    />
  ),
});
