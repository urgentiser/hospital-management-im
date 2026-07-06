import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "integrations",
        eyebrow: "Platform · Integrations",
        title: "Integrations",
        description: "Live view of the event bus — replay retries, resolve dead-letters, and inspect payloads.",
        workflow: ["pending", "delivered"],
        outcomes: ["retry", "deadletter"],
        columns: [
          { key: "title", label: "Topic" },
          { key: "subtitle", label: "Correlation ID" },
          { key: "Attempts", label: "Attempts" },
          { key: "Latency (ms)", label: "Latency" },
        ],
        fields: [
          { key: "topic", label: "Topic", required: true, placeholder: "e.g. patient.admitted.v1" },
          { key: "correlation", label: "Correlation ID", required: true },
          { key: "attempts", label: "Attempts", type: "number" },
          { key: "latency", label: "Latency (ms)", type: "number" },
          { key: "payload", label: "Payload preview", type: "textarea" },
        ],
        titleFrom: (f) => String(f["Topic"] || "New event"),
        subtitleFrom: (f) => String(f["Correlation ID"] || ""),
      }}
    />
  ),
});
