import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/documents")({
  head: () => ({ meta: [{ title: "Documents — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "documents",
        patientScoped: true,
        eyebrow: "Operational · Documents",
        title: "Documents",
        description: "Clinical and administrative document repository with review workflow.",
        workflow: ["uploaded", "reviewed", "approved", "archived"],
        outcomes: ["rejected"],
        columns: [
          { key: "title", label: "Document" },
          { key: "Type", label: "Type" },
          { key: "Patient", label: "Patient" },
          { key: "Size", label: "Size" },
        ],
        fields: [
          { key: "name", label: "Document name", required: true },
          { key: "type", label: "Type", type: "select", options: ["Consent", "Discharge", "Referral", "Lab report", "Imaging", "Other"] },
          { key: "patient", label: "Patient" },
          { key: "size", label: "File size", placeholder: "e.g. 128 KB" },
        ],
        titleFrom: (f) => String(f["Document name"] || "New document"),
        subtitleFrom: (f) => `${f["Type"]} · ${f["Patient"]}`,
      }}
    />
  ),
});
