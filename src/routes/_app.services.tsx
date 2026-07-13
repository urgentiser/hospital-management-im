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
        seed: [
          {
            id: "SVC-20411",
            title: "General Ward — Bed Day",
            subtitle: "Tariff 00190 · Discovery Health · R 3 480 / day",
            status: "active",
            updatedAt: "2m ago",
            data: {
              "Service name": "General Ward — Bed Day",
              "Tariff code": "00190",
              "Category": "Accommodation",
              "Scheme": "Discovery Health",
              "Unit price (R)": "3480",
              "Facility": "Life Fourways",
            },
          },
          {
            id: "SVC-20412",
            title: "ICU — Bed Day",
            subtitle: "Tariff 00202 · GEMS · R 12 950 / day",
            status: "active",
            updatedAt: "18m ago",
            data: {
              "Service name": "ICU — Bed Day",
              "Tariff code": "00202",
              "Category": "Accommodation",
              "Scheme": "GEMS",
              "Unit price (R)": "12950",
              "Facility": "Life Kingsbury",
            },
          },
          {
            id: "SVC-20413",
            title: "Theatre — Major Session (2h)",
            subtitle: "Tariff 01475 · Bonitas · R 18 400",
            status: "active",
            updatedAt: "1h ago",
            data: {
              "Service name": "Theatre — Major Session (2h)",
              "Tariff code": "01475",
              "Category": "Theatre",
              "Scheme": "Bonitas",
              "Unit price (R)": "18400",
              "Facility": "Life Groenkloof",
            },
          },
          {
            id: "SVC-20414",
            title: "MRI Lumbar Spine",
            subtitle: "Tariff 34101 · Momentum Health · R 8 750",
            status: "review",
            updatedAt: "3h ago",
            data: {
              "Service name": "MRI Lumbar Spine",
              "Tariff code": "34101",
              "Category": "Radiology",
              "Scheme": "Momentum Health",
              "Unit price (R)": "8750",
              "Facility": "Life Vincent Pallotti",
            },
          },
          {
            id: "SVC-20415",
            title: "Pharmacy Dispensing Fee",
            subtitle: "Tariff PH-001 · All schemes · R 62",
            status: "active",
            updatedAt: "1d ago",
            data: {
              "Service name": "Pharmacy Dispensing Fee",
              "Tariff code": "PH-001",
              "Category": "Pharmacy",
              "Scheme": "All schemes",
              "Unit price (R)": "62",
              "Facility": "All facilities",
            },
          },
          {
            id: "SVC-20416",
            title: "Consumables — Suture Pack",
            subtitle: "Tariff CS-118 · Polmed · R 245",
            status: "draft",
            updatedAt: "2d ago",
            data: {
              "Service name": "Consumables — Suture Pack",
              "Tariff code": "CS-118",
              "Category": "Consumables",
              "Scheme": "Polmed",
              "Unit price (R)": "245",
              "Facility": "Life Westville",
            },
          },
        ],
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
