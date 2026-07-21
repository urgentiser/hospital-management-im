import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/app-shell";
import { BusinessFlowWizard, type BusinessFlow } from "@/components/business-flow";

const flow: BusinessFlow = {
  moduleKey: "pharmacy",
  title: "Pharmacy Dispensing",
  purpose: "Verify a prescription, check clinical appropriateness, dispense and label medication, and hand off to the ward/theatre/retail counter with a defensible audit trail.",
  legacySource: "Rich/Pharmacy/Dispense.Implet; pharmacy.dispensing.menu.xml",
  routeFamily: ["/pharmacy/dispensing", "/pharmacy/dispensing/{rxId}", "/pharmacy/labels-stock", "/pharmacy/ward-theatre"],
  patientRequired: true,
  completionKind: "Dispense",
  completionStatus: "dispensed",
  completionLabel: "Dispensing",
  titleFrom: (v) => `${v.drug ?? "Rx"} · ${v.patient ?? "Patient"}`,
  subtitleFrom: (v) => [v.ward, v.prescriber].filter(Boolean).join(" · "),
  events: [
    "PrescriptionReceived", "PrescriptionScreened", "InteractionChecked",
    "StockReserved", "LabelPrinted", "MedicationDispensed", "MedicationDelivered",
  ],
  handoffs: ["Ward Management", "Theatre Management", "Retail Pharmacy Accounts", "Billing"],
  globalRules: [
    "Only registered pharmacists may sign a dispensed prescription.",
    "Interaction, allergy and dose-range checks run before dispense.",
    "Schedule 5 / Schedule 6 items require witnessed sign-off.",
    "Stock is deducted at dispense, not at label print.",
    "Every dispense action publishes to the audit trail and the service bus.",
  ],
  acceptance: [
    "Receive a prescription, screen it, dispense and observe stock decrement.",
    "Attempt to dispense a schedule 6 without a witness — blocked with a rule chip.",
    "Print a label matching the SEP tariff and dispensed batch.",
  ],
  steps: [
    { key: "receive", title: "Receive prescription", description: "Open the prescription from the ward, theatre, retail counter or e-script.",
      fields: [
        { name: "rxId", label: "Prescription ID", required: true, placeholder: "RX-…" },
        { name: "patient", label: "Patient", required: true },
        { name: "prescriber", label: "Prescriber", required: true },
        { name: "channel", label: "Channel", type: "select", options: ["Ward chart", "Theatre order", "Retail counter", "e-Script", "Discharge script"] },
      ],
      events: ["PrescriptionReceived"] },
    { key: "verify", title: "Verify patient & prescriber", description: "Confirm patient identity, active episode and prescriber credentials.",
      checklist: ["Patient identity confirmed (name · DOB · MRN)", "Active episode / admission linked", "Prescriber HPCSA number valid", "Right patient / right script"] },
    { key: "screen", title: "Clinical screening", description: "Screen for allergies, interactions, duplicate therapy and dose range.",
      checklist: ["Allergy check performed", "Drug-drug interactions reviewed", "Duplicate therapy check", "Dose within therapeutic range"],
      events: ["PrescriptionScreened", "InteractionChecked"],
      rules: ["Any red interaction blocks dispense until pharmacist override with reason."] },
    { key: "items", title: "Items & quantities", description: "Confirm each item, strength, form, route, frequency and pack size.",
      fields: [
        { name: "drug", label: "Drug · strength · form", required: true, placeholder: "e.g. Amoxicillin 500mg cap" },
        { name: "quantity", label: "Quantity", type: "number", required: true },
        { name: "directions", label: "Directions", required: true, placeholder: "e.g. 1 cap TDS × 7d" },
        { name: "schedule", label: "Schedule", type: "select", options: ["S0", "S1", "S2", "S3", "S4", "S5", "S6"] },
      ] },
    { key: "funding", title: "Funding & formulary check", description: "Check formulary status, funder benefit and any authorisation reference.",
      fields: [
        { name: "scheme", label: "Scheme" },
        { name: "authRef", label: "Auth ref (if required)" },
        { name: "sepPrice", label: "SEP price (R)" },
      ],
      rules: ["Non-formulary items require motivation before dispense."] },
    { key: "stock", title: "Reserve stock & batch", description: "Reserve stock, select batch/expiry and confirm no imminent expiry.",
      fields: [
        { name: "batch", label: "Batch no.", required: true },
        { name: "expiry", label: "Expiry", placeholder: "YYYY-MM" },
        { name: "location", label: "Store location" },
      ],
      events: ["StockReserved"] },
    { key: "witness", title: "Witnessed sign-off (S5/S6)", description: "For schedule 5 and schedule 6 items, capture a second signature.",
      fields: [
        { name: "witness", label: "Witness pharmacist / nurse" },
        { name: "witnessReason", label: "Note", type: "textarea" },
      ],
      rules: ["Required for S5/S6; skipped otherwise."] },
    { key: "label", title: "Print label", description: "Print the compliant label with directions, expiry, batch and pharmacist initials.",
      checklist: ["Directions clear and in the patient's language", "Batch and expiry printed", "Pharmacist initials on label"],
      events: ["LabelPrinted"] },
    { key: "dispense", title: "Dispense & sign", description: "Sign the dispense. Stock deducts, ledger posts and the item becomes ready for delivery.",
      fields: [
        { name: "pharmacist", label: "Dispensing pharmacist", required: true },
        { name: "notes", label: "Notes", type: "textarea" },
      ],
      events: ["MedicationDispensed"] },
    { key: "handoff", title: "Deliver / hand off", description: "Deliver to the ward runner, theatre trolley or retail counter and capture receipt.",
      fields: [
        { name: "ward", label: "Ward / theatre / counter" },
        { name: "receivedBy", label: "Received by" },
      ],
      events: ["MedicationDelivered"] },
  ],
};

export const Route = createFileRoute("/_app/pharmacy/business-flow")({
  head: () => ({
    meta: [
      { title: "Pharmacy Guided Workflow — Impilo" },
      { name: "description", content: "Prescription-to-dispense workflow with clinical screening, stock, labelling and delivery." },
    ],
  }),
  component: () => (
    <Card className="p-6">
      <BusinessFlowWizard flow={flow} />
    </Card>
  ),
});
