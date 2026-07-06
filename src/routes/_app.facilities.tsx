import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/facilities")({
  head: () => ({ meta: [{ title: "Facilities — Impilo" }] }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "facilities",
        eyebrow: "Operational · Facilities",
        title: "Facilities",
        description: "Onboard and manage facilities, ward configuration and bed capacity.",
        workflow: ["draft", "active", "archived"],
        columns: [
          { key: "title", label: "Facility" },
          { key: "Beds", label: "Beds" },
          { key: "Wards", label: "Wards" },
          { key: "Theatres", label: "Theatres" },
        ],
        fields: [
          { key: "name", label: "Facility name", required: true },
          { key: "location", label: "Location" },
          { key: "beds", label: "Beds", type: "number" },
          { key: "wards", label: "Wards", type: "number" },
          { key: "theatres", label: "Theatres", type: "number" },
        ],
        titleFrom: (f) => String(f["Facility name"] || "New facility"),
        subtitleFrom: (f) => `${f["Location"]} · ${f["Beds"]} beds`,
      }}
    />
  ),
});
