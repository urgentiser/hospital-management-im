import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/ward")({
  head: () => ({ meta: [{ title: "Ward — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "ward",
        eyebrow: "Clinical · Ward",
        title: "Ward Management",
        description: "Bed board, cleaning, occupancy and nurse hand-off.",
        workflow: ["available", "assigned", "occupied", "cleaning"],
        outcomes: ["out-of-service"],
        columns: [
          { key: "title", label: "Bed" },
          { key: "subtitle", label: "Patient" },
          { key: "Facility", label: "Facility" },
        ],
        fields: [
          { key: "facility", label: "Facility", type: "select", required: true, options: ["Life Fourways", "Life Groenkloof", "Life Kingsbury", "Life Vincent Pallotti", "Life Glynnwood", "Life East London", "Life Westville", "Life Entabeni"] },
          { key: "ward", label: "Ward", required: true },
          { key: "bed", label: "Bed number", required: true },
          { key: "patient", label: "Patient (optional)" },
        ],
        titleFrom: (f) => `Ward ${f["Ward"]} · Bed ${f["Bed number"]}`,
        subtitleFrom: (f) => String(f["Patient (optional)"] || "Available"),
        kpis: (items) => [
          { label: "Occupied", value: items.filter((i) => i.status === "occupied").length },
          { label: "Available", value: items.filter((i) => i.status === "available").length },
          { label: "Cleaning", value: items.filter((i) => i.status === "cleaning").length },
          { label: "Total beds", value: items.length },
        ],
      }}
    />
  ),
});
