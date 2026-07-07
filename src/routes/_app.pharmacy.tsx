import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Pill, Repeat, PackageOpen, Copy, FlaskConical, ClipboardPlus, Building2, Tag,
  Sparkles, MinusCircle, PackageCheck, PackagePlus, Search, ShoppingBag, Siren,
  ClipboardList, PackageMinus, ArrowRightLeft, Wallet, Store, Ban,
  Layers, ChevronDown,
} from "lucide-react";

import { WorkflowModule } from "@/components/workflow-module";
import { Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useWorkflow, type WorkflowItem } from "@/lib/workflow-store";

export const Route = createFileRoute("/_app/pharmacy")({
  head: () => ({
    meta: [
      { title: "Pharmacy — Impilo" },
      { name: "description", content: "Dispense, compound, label and manage retail, ward and theatre pharmacy workflows." },
    ],
  }),
  component: PharmacyPage,
});

type ActionKey =
  | "dispense" | "dispenseRepeats" | "dispenseWard" | "copyRx" | "maintainCompounds"
  | "compoundingRequest" | "wardCompounding" | "manageLabels" | "adhocLabel" | "creditStock"
  | "fulfillWard" | "fulfillFollows" | "enquirePatient" | "retailSales" | "emergencyCupboard"
  | "issueSurgicals" | "batchCapture" | "dispenseTakeOut" | "practitionerAccount" | "pharmacyAccount"
  | "cancelRetailSale" | "replaceWardProduct" | "replaceTheatreProduct";

type ActionSpec = {
  key: ActionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: string; // stored as Kind field
  startStatus: string; // initial workflow status
  hint: string;
  fields: FieldSpec[];
  readOnly?: boolean; // enquire only, no create
};

type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
  placeholder?: string;
};

const RX_FIELDS: FieldSpec[] = [
  { name: "patient", label: "Patient", required: true, placeholder: "e.g. Nomvula Dlamini" },
  { name: "medication", label: "Medication & dose", required: true, placeholder: "e.g. Amoxicillin 500mg × 21" },
  { name: "prescriber", label: "Prescriber", placeholder: "Dr. S. Naidoo" },
  { name: "ward", label: "Ward / Location", placeholder: "Ward 3B / Retail" },
  { name: "notes", label: "Notes", type: "textarea" },
];

const WARD_FIELDS: FieldSpec[] = [
  { name: "ward", label: "Ward", required: true, placeholder: "Ward 3B" },
  { name: "medication", label: "Medication & pack", required: true, placeholder: "e.g. Paracetamol 500mg × 100" },
  { name: "quantity", label: "Quantity", type: "number", placeholder: "1" },
  { name: "requester", label: "Requester", placeholder: "Sr. M. Zulu" },
  { name: "notes", label: "Notes", type: "textarea" },
];

const COMPOUND_FIELDS: FieldSpec[] = [
  { name: "formula", label: "Formula / product", required: true, placeholder: "e.g. Magic Mouthwash 200ml" },
  { name: "patient", label: "Patient / Ward", placeholder: "Ward or patient" },
  { name: "batch", label: "Batch size", type: "number", placeholder: "1" },
  { name: "expiry", label: "Expiry (days)", type: "number", placeholder: "14" },
  { name: "notes", label: "Compounding notes", type: "textarea" },
];

const LABEL_FIELDS: FieldSpec[] = [
  { name: "product", label: "Product", required: true, placeholder: "Medication or item" },
  { name: "patient", label: "Patient", placeholder: "Optional" },
  { name: "dose", label: "Dose / Directions", placeholder: "e.g. 1 tab TDS x 5 days" },
  { name: "quantity", label: "Quantity", type: "number", placeholder: "1" },
];

const STOCK_FIELDS: FieldSpec[] = [
  { name: "product", label: "Product", required: true },
  { name: "quantity", label: "Quantity", type: "number", required: true, placeholder: "1" },
  { name: "reason", label: "Reason", placeholder: "e.g. Expired / Damaged / Return" },
  { name: "reference", label: "Reference doc" },
];

const RETAIL_FIELDS: FieldSpec[] = [
  { name: "customer", label: "Customer / Patient", required: true },
  { name: "items", label: "Items sold", required: true, placeholder: "e.g. Panado × 2, Grand-Pa × 1" },
  { name: "total", label: "Total (R)", type: "number", placeholder: "0.00" },
  { name: "payment", label: "Payment method", placeholder: "Cash / Card / Account" },
];

const ACCOUNT_FIELDS: FieldSpec[] = [
  { name: "account", label: "Account holder", required: true },
  { name: "amount", label: "Amount (R)", type: "number", required: true },
  { name: "reference", label: "Reference" },
  { name: "notes", label: "Notes", type: "textarea" },
];

const ENQUIRE_FIELDS: FieldSpec[] = [
  { name: "patient", label: "Patient name or MRN", required: true, placeholder: "Start typing…" },
];

const CANCEL_FIELDS: FieldSpec[] = [
  { name: "saleRef", label: "Sale reference", required: true, placeholder: "e.g. RX-70011" },
  { name: "reason", label: "Cancellation reason", required: true, type: "textarea" },
];

const REPLACE_FIELDS: FieldSpec[] = [
  { name: "originalProduct", label: "Original product", required: true },
  { name: "replacementProduct", label: "Replacement product", required: true },
  { name: "location", label: "Ward / Theatre", required: true },
  { name: "reason", label: "Reason for replacement", type: "textarea" },
];

const ACTIONS: ActionSpec[] = [
  { key: "dispense", label: "Dispense", icon: Pill, kind: "Dispense", startStatus: "ordered", hint: "Retail or outpatient dispense", fields: RX_FIELDS },
  { key: "dispenseRepeats", label: "Dispense with Repeats", icon: Repeat, kind: "Dispense w/ Repeats", startStatus: "ordered", hint: "Chronic scripts with repeats", fields: [...RX_FIELDS, { name: "repeats", label: "Repeats", type: "number", placeholder: "5" }] },
  { key: "dispenseWard", label: "Dispense from Ward", icon: PackageOpen, kind: "Ward Dispense", startStatus: "ordered", hint: "Consume from ward stock", fields: WARD_FIELDS },
  { key: "copyRx", label: "Copy Prescription", icon: Copy, kind: "Copy Rx", startStatus: "ordered", hint: "Duplicate an existing script", fields: [{ name: "sourceRx", label: "Source script #", required: true, placeholder: "RX-70011" }, ...RX_FIELDS] },
  { key: "maintainCompounds", label: "Maintain Compounds", icon: FlaskConical, kind: "Compound Master", startStatus: "ordered", hint: "Add or edit compound recipes", fields: COMPOUND_FIELDS },
  { key: "compoundingRequest", label: "Compounding Request", icon: ClipboardPlus, kind: "Compound Request", startStatus: "ordered", hint: "Request a compound preparation", fields: COMPOUND_FIELDS },
  { key: "wardCompounding", label: "Ward Compounding", icon: Building2, kind: "Ward Compound", startStatus: "ordered", hint: "Compound at ward-level", fields: COMPOUND_FIELDS },
  { key: "manageLabels", label: "Manage Labels", icon: Tag, kind: "Label Batch", startStatus: "picked", hint: "Print or re-print label batches", fields: LABEL_FIELDS },
  { key: "adhocLabel", label: "Ad-hoc Label", icon: Sparkles, kind: "Ad-hoc Label", startStatus: "picked", hint: "Once-off label print", fields: LABEL_FIELDS },
  { key: "creditStock", label: "Credit Stock", icon: MinusCircle, kind: "Stock Credit", startStatus: "ordered", hint: "Return stock to inventory", fields: STOCK_FIELDS },
  { key: "fulfillWard", label: "Fulfill Ward Dispense", icon: PackageCheck, kind: "Ward Fulfilment", startStatus: "picked", hint: "Fulfil a ward request", fields: WARD_FIELDS },
  { key: "fulfillFollows", label: "Fulfill To Follows", icon: PackagePlus, kind: "To Follow", startStatus: "picked", hint: "Complete outstanding items", fields: WARD_FIELDS },
  { key: "enquirePatient", label: "Enquire on Patient", icon: Search, kind: "Patient Enquiry", startStatus: "ordered", hint: "Read-only history lookup", fields: ENQUIRE_FIELDS, readOnly: true },
  { key: "retailSales", label: "Retail Sales", icon: ShoppingBag, kind: "Retail Sale", startStatus: "dispensed", hint: "OTC / retail sale", fields: RETAIL_FIELDS },
  { key: "emergencyCupboard", label: "Emergency Cupboard", icon: Siren, kind: "Emergency Cupboard", startStatus: "dispensed", hint: "After-hours emergency access", fields: WARD_FIELDS },
  { key: "issueSurgicals", label: "Issue Surgicals", icon: ClipboardList, kind: "Surgical Issue", startStatus: "picked", hint: "Issue surgical consumables", fields: WARD_FIELDS },
  { key: "batchCapture", label: "Batch Capture", icon: Layers, kind: "Batch Capture", startStatus: "ordered", hint: "Capture in bulk from paper", fields: [{ name: "batchRef", label: "Batch reference", required: true }, ...RX_FIELDS] },
  { key: "dispenseTakeOut", label: "Dispense To Take Out", icon: PackageMinus, kind: "TTO Dispense", startStatus: "ordered", hint: "Discharge / take-out meds", fields: RX_FIELDS },
  { key: "practitionerAccount", label: "Practitioner Account", icon: Wallet, kind: "Practitioner Account", startStatus: "dispensed", hint: "Charge to practitioner account", fields: ACCOUNT_FIELDS },
  { key: "pharmacyAccount", label: "Pharmacy Account", icon: Store, kind: "Pharmacy Account", startStatus: "dispensed", hint: "Internal pharmacy account", fields: ACCOUNT_FIELDS },
  { key: "cancelRetailSale", label: "Cancel Retail Sale", icon: Ban, kind: "Retail Cancellation", startStatus: "cancelled", hint: "Reverse a retail sale", fields: CANCEL_FIELDS },
  { key: "replaceWardProduct", label: "Replace Ward Product", icon: ArrowRightLeft, kind: "Ward Replace", startStatus: "ordered", hint: "Substitute a ward product", fields: REPLACE_FIELDS },
  { key: "replaceTheatreProduct", label: "Replace Theatre Product", icon: ArrowRightLeft, kind: "Theatre Replace", startStatus: "ordered", hint: "Substitute a theatre product", fields: REPLACE_FIELDS },
];

const ACTION_SECTIONS: { title: string; keys: ActionKey[] }[] = [
  { title: "Dispensing", keys: ["dispense", "dispenseRepeats", "dispenseWard", "dispenseTakeOut", "copyRx", "batchCapture"] },
  { title: "Compounding", keys: ["maintainCompounds", "compoundingRequest", "wardCompounding"] },
  { title: "Labels & Stock", keys: ["manageLabels", "adhocLabel", "creditStock", "replaceWardProduct", "replaceTheatreProduct"] },
  { title: "Ward & Theatre", keys: ["fulfillWard", "fulfillFollows", "issueSurgicals", "emergencyCupboard"] },
  { title: "Retail & Accounts", keys: ["retailSales", "cancelRetailSale", "practitionerAccount", "pharmacyAccount"] },
  { title: "Enquiry", keys: ["enquirePatient"] },
];

function PharmacyPage() {
  const items = useWorkflow((s) => s.items.pharmacy);
  const createItem = useWorkflow((s) => s.create);

  const [activeAction, setActiveAction] = useState<ActionSpec | null>(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryQuery, setEnquiryQuery] = useState("");

  const handlePick = (a: ActionSpec) => {
    if (a.readOnly) {
      setEnquiryQuery("");
      setEnquiryOpen(true);
      return;
    }
    setActiveAction(a);
  };

  const submitAction = (a: ActionSpec, values: Record<string, string>) => {
    const fields: Record<string, string | number> = { Kind: a.kind };
    a.fields.forEach((f) => {
      const raw = values[f.name] ?? "";
      if (!raw) return;
      fields[f.label] = f.type === "number" ? Number(raw) : raw;
    });
    const title =
      String(values.medication || values.product || values.formula || values.items || values.originalProduct || a.label);
    const subtitle =
      [values.patient, values.ward, values.customer, values.account, values.location].filter(Boolean).join(" · ") ||
      a.kind;

    const rec = createItem("pharmacy", {
      title,
      subtitle,
      status: a.startStatus,
      fields,
    });
    toast.success(`${a.label} captured`, { description: `${rec.id} · ${title}` });
    setActiveAction(null);
  };

  const enquiryResults = useMemo(() => {
    const q = enquiryQuery.trim().toLowerCase();
    if (!q) return items.slice(0, 8);
    return items.filter((i) =>
      [i.title, i.subtitle ?? "", ...Object.values(i.fields).map(String)].join(" ").toLowerCase().includes(q),
    ).slice(0, 25);
  }, [items, enquiryQuery]);

  return (
    <>
      <WorkflowModule
        config={{
          moduleKey: "pharmacy",
          eyebrow: "Clinical · Pharmacy",
          title: "Pharmacy",
          description: "Dispensing, compounding, labels and retail — with ward, theatre and account workflows.",
          workflow: ["ordered", "picked", "dispensed", "completed"],
          outcomes: ["cancelled"],
          columns: [
            { key: "title", label: "Item" },
            { key: "Kind", label: "Action" },
            { key: "Patient", label: "Patient / Ward" },
            { key: "Prescriber", label: "Prescriber" },
          ],
          fields: [
            { key: "medication", label: "Medication & dose", required: true, placeholder: "e.g. Paracetamol 500mg × 20" },
            { key: "patient", label: "Patient", required: true },
            { key: "ward", label: "Ward" },
            { key: "prescriber", label: "Prescriber" },
            { key: "instructions", label: "Instructions", type: "textarea" },
          ],
          titleFrom: (f) => String(f["Medication & dose"] || "New order"),
          subtitleFrom: (f) => `${f["Patient"]} · ${f["Ward"]}`,
          kpis: (items) => [
            { label: "Ordered", value: items.filter((i) => i.status === "ordered").length },
            { label: "Picked", value: items.filter((i) => i.status === "picked").length },
            { label: "Dispensed", value: items.filter((i) => i.status === "dispensed").length },
            { label: "Cancelled", value: items.filter((i) => i.status === "cancelled").length },
          ],
          extras: (
            <div className="flex justify-end">
              <Card className="w-full max-w-md p-0">
                <button
                  type="button"
                  onClick={() => setActionsOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  aria-expanded={actionsOpen}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pharmacy</div>
                      <div className="text-sm font-medium">Quick actions</div>
                    </div>
                  </div>
                  <ChevronDown
                    className={"h-4 w-4 text-muted-foreground transition-transform " + (actionsOpen ? "rotate-180" : "")}
                  />
                </button>
                {actionsOpen && (
                  <div className="space-y-3 border-t border-border px-3 pb-3 pt-2">
                    {ACTION_SECTIONS.map((sec) => (
                      <div key={sec.title}>
                        <div className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {sec.title}
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {sec.keys.map((k) => {
                            const a = ACTIONS.find((x) => x.key === k)!;
                            const Icon = a.icon;
                            return (
                              <button
                                key={a.key}
                                onClick={() => handlePick(a)}
                                title={`${a.label} — ${a.hint}`}
                                aria-label={a.label}
                                className="group flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ),

        }}
      />

      <ActionDialog
        spec={activeAction}
        onOpenChange={(o) => !o && setActiveAction(null)}
        onSubmit={submitAction}
      />

      <EnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        query={enquiryQuery}
        onQueryChange={setEnquiryQuery}
        results={enquiryResults}
      />
    </>
  );
}

function ActionDialog({
  spec, onOpenChange, onSubmit,
}: {
  spec: ActionSpec | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (spec: ActionSpec, values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const open = !!spec;

  const handleClose = (o: boolean) => {
    if (!o) setValues({});
    onOpenChange(o);
  };

  const submit = () => {
    if (!spec) return;
    for (const f of spec.fields) {
      if (f.required && !values[f.name]?.trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    onSubmit(spec, values);
    setValues({});
  };

  if (!spec) return null;
  const Icon = spec.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{spec.label}</DialogTitle>
              <DialogDescription>{spec.hint}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[calc(90vh-11rem)] space-y-3 overflow-y-auto px-6 py-4">
          {spec.fields.map((f) => (
            <div key={f.name} className="grid gap-1.5">
              <Label htmlFor={`${spec.key}-${f.name}`}>
                {f.label}{f.required && <span className="text-destructive"> *</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={`${spec.key}-${f.name}`}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  id={`${spec.key}-${f.name}`}
                  type={f.type === "number" ? "number" : "text"}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-primary hover:opacity-90">Save {spec.label}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EnquiryDialog({
  open, onOpenChange, query, onQueryChange, results,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  query: string; onQueryChange: (s: string) => void;
  results: WorkflowItem[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <DialogTitle>Enquire on Patient</DialogTitle>
          <DialogDescription>Search dispense, compounding and retail history for a patient.</DialogDescription>
        </DialogHeader>
        <div className="border-b border-border px-6 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Patient name, MRN, medication…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No pharmacy records found.</div>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{r.subtitle}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {String(r.fields["Kind"] ?? "Dispense")} · {new Date(r.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {r.id}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
