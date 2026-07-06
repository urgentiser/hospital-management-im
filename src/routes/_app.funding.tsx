import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/funding")({
  head: () => ({ meta: [{ title: "Funding — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "funding",
        eyebrow: "Operational · Funding",
        title: "Funding Rules",
        description: "Scheme rules, benefit checks and PMB coverage configuration.",
        workflow: ["draft", "verified", "active"],
        outcomes: ["retired"],
        columns: [
          { key: "title", label: "Rule" },
          { key: "Scheme", label: "Scheme" },
          { key: "Plan", label: "Plan" },
          { key: "Rate", label: "Rate" },
        ],
        fields: [
          { key: "scheme", label: "Scheme", required: true },
          { key: "plan", label: "Plan", required: true },
          { key: "rate", label: "Rate", placeholder: "e.g. 100%" },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
        titleFrom: (f) => `${f["Scheme"]} · ${f["Plan"]}`,
        subtitleFrom: (f) => `Rate ${f["Rate"]}`,
      }}
    />
  ),
});
