import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/triangle")({
  head: () => ({
    meta: [
      { title: "Triangle Reconciliation — Impilo" },
      { name: "description", content: "Three-way reconciliation across tariff, claim and remittance for every funder." },
    ],
  }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "triangle",
        eyebrow: "Financial · Reconciliation",
        title: "Triangle",
        description: "Three-way match between contracted tariff, submitted claim and scheme remittance. Investigate variance and close reconciliations.",
        workflow: ["open", "matching", "review", "reconciled"],
        outcomes: ["written-off"],
        columns: [
          { key: "title", label: "Reconciliation" },
          { key: "Scheme", label: "Scheme" },
          { key: "Claims", label: "Claims" },
          { key: "Variance", label: "Variance" },
          { key: "Period", label: "Period" },
        ],
        fields: [
          { key: "scheme", label: "Scheme", required: true, type: "select",
            options: ["Discovery Health", "Bonitas", "GEMS", "Momentum Health", "Polmed", "Medshield", "Other"] },
          { key: "period", label: "Period", required: true, placeholder: "e.g. Week 27 / June" },
          { key: "claims", label: "Claims", type: "number", placeholder: "e.g. 128" },
          { key: "variance", label: "Variance amount", placeholder: "R 0.00" },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
        titleFrom: (f) => `${f["Scheme"]} — ${f["Period"]}`,
        subtitleFrom: (f) => `${f["Claims"]} claims · variance ${f["Variance"] || "R 0"}`,
        kpis: (items) => [
          { label: "Open", value: items.filter((i) => i.status === "open").length },
          { label: "Matching", value: items.filter((i) => i.status === "matching").length },
          { label: "Reconciled", value: items.filter((i) => i.status === "reconciled").length },
          { label: "Written off", value: items.filter((i) => i.status === "written-off").length },
        ],
      }}
    />
  ),
});
