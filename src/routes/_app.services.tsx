import { createFileRoute } from "@tanstack/react-router";
import { WorkflowModule } from "@/components/workflow-module";

export const Route = createFileRoute("/_app/services")({
  head: () => ({
    meta: [
      { title: "Services — Impilo" },
      { name: "description", content: "Clinical services catalogue, tariff codes and scheme pricing across Life Healthcare facilities." },
    ],
  }),
  component: () => (
    <WorkflowModule
      config={{
        moduleKey: "services",
        eyebrow: "Catalogue · Services",
        title: "Services",
        description: "Chargeable clinical services, tariff codes and scheme-specific pricing across Life Healthcare facilities.",
        workflow: ["draft", "active", "review", "retired"],
        columns: [
          { key: "title", label: "Service" },
          { key: "Tariff code", label: "Tariff" },
          { key: "Category", label: "Category" },
          { key: "Scheme", label: "Scheme" },
          { key: "Unit price (R)", label: "Price (R)" },
          { key: "Facility", label: "Facility" },
        ],
        fields: [
          { key: "service_name", label: "Service name", required: true, placeholder: "e.g. General Ward — Bed Day" },
          { key: "tariff_code", label: "Tariff code", required: true, placeholder: "e.g. 00190" },
          { key: "category", label: "Category", placeholder: "Accommodation, Theatre, Radiology, Pharmacy…" },
          { key: "scheme", label: "Scheme", placeholder: "Discovery Health, GEMS, Bonitas…" },
          { key: "unit_price", label: "Unit price (R)", required: true, placeholder: "0.00" },
          { key: "facility", label: "Facility", placeholder: "Life Fourways" },
        ],
        titleFrom: (f) => String(f["Service name"] || "New service"),
        subtitleFrom: (f) =>
          `Tariff ${f["Tariff code"] || "—"} · ${f["Scheme"] || "—"} · R ${f["Unit price (R)"] || "0"}`,
      }}
    />
  ),
});
