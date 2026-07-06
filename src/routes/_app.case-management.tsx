import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/case-management")({
  head: () => ({ meta: [{ title: "Case Management — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "case-management",
        eyebrow: "Operational · Cases",
        title: "Case Management",
        description: "Long-running case timelines with multi-party workflows and SLA tracking.",
        workflow: ["intake", "assessment", "in-progress", "closed"],
        outcomes: ["escalated"],
        columns: [
          { key: "title", label: "Case" },
          { key: "Owner", label: "Owner" },
          { key: "Priority", label: "Priority" },
          { key: "SLA Days", label: "SLA (d)" },
        ],
        fields: [
          { key: "title", label: "Case title", required: true },
          { key: "owner", label: "Case owner", required: true },
          { key: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High", "Critical"] },
          { key: "sla", label: "SLA (days)", type: "number" },
          { key: "summary", label: "Summary", type: "textarea" },
        ],
        titleFrom: (f) => String(f["Case title"] || "New case"),
        subtitleFrom: (f) => `${f["Case owner"]} · ${f["Priority"]}`,
      }}
    />
  ),
});
