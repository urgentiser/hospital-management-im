import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/theatre")({
  head: () => ({ meta: [{ title: "Theatre — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "theatre",
        eyebrow: "Clinical · Theatre",
        title: "Theatre",
        description: "Bookings, slot utilisation and post-op billing hand-off.",
        workflow: ["booked", "in-progress", "completed", "billed"],
        outcomes: ["cancelled"],
        columns: [
          { key: "title", label: "Procedure" },
          { key: "Theatre", label: "Theatre" },
          { key: "Surgeon", label: "Surgeon" },
          { key: "Duration", label: "Duration" },
        ],
        fields: [
          { key: "procedure", label: "Procedure", required: true },
          { key: "theatre", label: "Theatre", type: "select", options: ["T1", "T2", "T3", "T4", "T5"] },
          { key: "surgeon", label: "Surgeon", required: true },
          { key: "duration", label: "Est. duration", placeholder: "e.g. 90 min" },
          { key: "patient", label: "Patient" },
        ],
        titleFrom: (f) => String(f["Procedure"] || "New booking"),
        subtitleFrom: (f) => `${f["Theatre"]} · ${f["Surgeon"]}`,
      }}
    />
  ),
});
