import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "reports",
        eyebrow: "Overview · Reports",
        title: "Reports",
        description: "Generate, share and archive operational and clinical reports.",
        workflow: ["generated", "shared", "archived"],
        columns: [
          { key: "title", label: "Report" },
          { key: "Period", label: "Period" },
          { key: "Format", label: "Format" },
          { key: "Size", label: "Size" },
        ],
        fields: [
          { key: "name", label: "Report name", required: true },
          { key: "period", label: "Period", placeholder: "e.g. Week 27" },
          { key: "format", label: "Format", type: "select", options: ["PDF", "XLSX", "CSV", "JSON"] },
          { key: "size", label: "Size", placeholder: "e.g. 1.4 MB" },
        ],
        titleFrom: (f) => String(f["Report name"] || "New report"),
        subtitleFrom: (f) => `${f["Period"]} · ${f["Format"]}`,
      }}
    />
  ),
});
