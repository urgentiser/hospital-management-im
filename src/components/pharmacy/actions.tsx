import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Pill, Repeat, PackageOpen, Copy, FlaskConical, ClipboardPlus, Building2, Tag,
  Sparkles, MinusCircle, PackageCheck, PackagePlus, Search, ShoppingBag, Siren,
  ClipboardList, PackageMinus, ArrowRightLeft, Wallet, Store, Ban, Layers,
  PillBottle, FlaskRound, Boxes, HeartPulse, Store as StoreIcon, UserSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useWorkflow, type WorkflowItem } from "@/lib/workflow-store";

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
  placeholder?: string;
};

export type ActionKey =
  | "dispense" | "dispenseRepeats" | "dispenseWard" | "copyRx" | "maintainCompounds"
  | "compoundingRequest" | "wardCompounding" | "manageLabels" | "adhocLabel" | "creditStock"
  | "fulfillWard" | "fulfillFollows" | "enquirePatient" | "retailSales" | "emergencyCupboard"
  | "issueSurgicals" | "batchCapture" | "dispenseTakeOut" | "practitionerAccount" | "pharmacyAccount"
  | "cancelRetailSale" | "replaceWardProduct" | "replaceTheatreProduct";

export type ActionSpec = {
  key: ActionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: string;
  startStatus: string;
  hint: string;
  fields: FieldSpec[];
  readOnly?: boolean;
  destructive?: boolean;
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

export const ACTIONS: Record<ActionKey, ActionSpec> = {
  dispense: { key: "dispense", label: "Dispense", icon: Pill, kind: "Dispense", startStatus: "ordered", hint: "Retail or outpatient dispense", fields: RX_FIELDS },
  dispenseRepeats: { key: "dispenseRepeats", label: "Dispense with Repeats", icon: Repeat, kind: "Dispense w/ Repeats", startStatus: "ordered", hint: "Chronic scripts with repeats", fields: [...RX_FIELDS, { name: "repeats", label: "Repeats", type: "number", placeholder: "5" }] },
  dispenseWard: { key: "dispenseWard", label: "Dispense from Ward", icon: PackageOpen, kind: "Ward Dispense", startStatus: "ordered", hint: "Consume from ward stock", fields: WARD_FIELDS },
  copyRx: { key: "copyRx", label: "Copy Prescription", icon: Copy, kind: "Copy Rx", startStatus: "ordered", hint: "Duplicate an existing script", fields: [{ name: "sourceRx", label: "Source script #", required: true, placeholder: "RX-70011" }, ...RX_FIELDS] },
  maintainCompounds: { key: "maintainCompounds", label: "Maintain Compounds", icon: FlaskConical, kind: "Compound Master", startStatus: "ordered", hint: "Add or edit compound recipes", fields: COMPOUND_FIELDS },
  compoundingRequest: { key: "compoundingRequest", label: "Compounding Request", icon: ClipboardPlus, kind: "Compound Request", startStatus: "ordered", hint: "Request a compound preparation", fields: COMPOUND_FIELDS },
  wardCompounding: { key: "wardCompounding", label: "Ward Compounding", icon: Building2, kind: "Ward Compound", startStatus: "ordered", hint: "Compound at ward-level", fields: COMPOUND_FIELDS },
  manageLabels: { key: "manageLabels", label: "Manage Labels", icon: Tag, kind: "Label Batch", startStatus: "picked", hint: "Print or re-print label batches", fields: LABEL_FIELDS },
  adhocLabel: { key: "adhocLabel", label: "Ad-hoc Label", icon: Sparkles, kind: "Ad-hoc Label", startStatus: "picked", hint: "Once-off label print", fields: LABEL_FIELDS },
  creditStock: { key: "creditStock", label: "Credit Stock", icon: MinusCircle, kind: "Stock Credit", startStatus: "ordered", hint: "Return stock to inventory", fields: STOCK_FIELDS },
  fulfillWard: { key: "fulfillWard", label: "Fulfill Ward Dispense", icon: PackageCheck, kind: "Ward Fulfilment", startStatus: "picked", hint: "Fulfil a ward request", fields: WARD_FIELDS },
  fulfillFollows: { key: "fulfillFollows", label: "Fulfill To Follows", icon: PackagePlus, kind: "To Follow", startStatus: "picked", hint: "Complete outstanding items", fields: WARD_FIELDS },
  enquirePatient: { key: "enquirePatient", label: "Enquire on Patient", icon: Search, kind: "Patient Enquiry", startStatus: "ordered", hint: "Read-only history lookup", fields: ENQUIRE_FIELDS, readOnly: true },
  retailSales: { key: "retailSales", label: "Retail Sales", icon: ShoppingBag, kind: "Retail Sale", startStatus: "dispensed", hint: "OTC / retail sale", fields: RETAIL_FIELDS },
  emergencyCupboard: { key: "emergencyCupboard", label: "Emergency Cupboard", icon: Siren, kind: "Emergency Cupboard", startStatus: "dispensed", hint: "After-hours emergency access", fields: WARD_FIELDS },
  issueSurgicals: { key: "issueSurgicals", label: "Issue Surgicals", icon: ClipboardList, kind: "Surgical Issue", startStatus: "picked", hint: "Issue surgical consumables", fields: WARD_FIELDS },
  batchCapture: { key: "batchCapture", label: "Batch Capture", icon: Layers, kind: "Batch Capture", startStatus: "ordered", hint: "Capture in bulk from paper", fields: [{ name: "batchRef", label: "Batch reference", required: true }, ...RX_FIELDS] },
  dispenseTakeOut: { key: "dispenseTakeOut", label: "Dispense To Take Out", icon: PackageMinus, kind: "TTO Dispense", startStatus: "ordered", hint: "Discharge / take-out meds", fields: RX_FIELDS },
  practitionerAccount: { key: "practitionerAccount", label: "Practitioner Account", icon: Wallet, kind: "Practitioner Account", startStatus: "dispensed", hint: "Charge to practitioner account", fields: ACCOUNT_FIELDS },
  pharmacyAccount: { key: "pharmacyAccount", label: "Pharmacy Account", icon: Store, kind: "Pharmacy Account", startStatus: "dispensed", hint: "Internal pharmacy account", fields: ACCOUNT_FIELDS },
  cancelRetailSale: { key: "cancelRetailSale", label: "Cancel Retail Sale", icon: Ban, kind: "Retail Cancellation", startStatus: "cancelled", hint: "Reverse a retail sale", fields: CANCEL_FIELDS, destructive: true },
  replaceWardProduct: { key: "replaceWardProduct", label: "Replace Ward Product", icon: ArrowRightLeft, kind: "Ward Replace", startStatus: "ordered", hint: "Substitute a ward product", fields: REPLACE_FIELDS },
  replaceTheatreProduct: { key: "replaceTheatreProduct", label: "Replace Theatre Product", icon: ArrowRightLeft, kind: "Theatre Replace", startStatus: "ordered", hint: "Substitute a theatre product", fields: REPLACE_FIELDS },
};

export type SectionKey = "dispensing" | "compounding" | "labels-stock" | "ward-theatre" | "retail-accounts" | "enquiry";

export const SECTIONS: {
  key: SectionKey;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  ring: string;
  actions: ActionKey[];
}[] = [
  {
    key: "dispensing", slug: "dispensing", title: "Dispensing",
    tagline: "Scripts & take-outs",
    description: "Outpatient, ward and take-out dispensing — including repeats, copies and bulk batch capture.",
    icon: PillBottle,
    accent: "from-primary/25 via-indigo-500/15 to-transparent",
    ring: "ring-indigo-400/30",
    actions: ["dispense", "dispenseRepeats", "dispenseWard", "dispenseTakeOut", "copyRx", "batchCapture"],
  },
  {
    key: "compounding", slug: "compounding", title: "Compounding",
    tagline: "Recipes & preparations",
    description: "Maintain compound formulas, receive compounding requests and prepare products at ward-level.",
    icon: FlaskRound,
    accent: "from-violet-500/25 via-fuchsia-500/15 to-transparent",
    ring: "ring-violet-400/30",
    actions: ["maintainCompounds", "compoundingRequest", "wardCompounding"],
  },
  {
    key: "labels-stock", slug: "labels-stock", title: "Labels & Stock",
    tagline: "Print, credit, replace",
    description: "Print labels, credit stock back to inventory and replace ward or theatre products.",
    icon: Boxes,
    accent: "from-emerald-500/25 via-teal-500/15 to-transparent",
    ring: "ring-emerald-400/30",
    actions: ["manageLabels", "adhocLabel", "creditStock", "replaceWardProduct", "replaceTheatreProduct"],
  },
  {
    key: "ward-theatre", slug: "ward-theatre", title: "Ward & Theatre",
    tagline: "Fulfilment & surgicals",
    description: "Fulfil ward dispenses, follow-ups, surgical consumables and after-hours emergency access.",
    icon: HeartPulse,
    accent: "from-rose-500/25 via-pink-500/15 to-transparent",
    ring: "ring-rose-400/30",
    actions: ["fulfillWard", "fulfillFollows", "issueSurgicals", "emergencyCupboard"],
  },
  {
    key: "retail-accounts", slug: "retail-accounts", title: "Retail & Accounts",
    tagline: "Sales & billing",
    description: "OTC retail sales, cancellations and charges against practitioner or pharmacy accounts.",
    icon: StoreIcon,
    accent: "from-amber-500/25 via-orange-500/15 to-transparent",
    ring: "ring-amber-400/30",
    actions: ["retailSales", "cancelRetailSale", "practitionerAccount", "pharmacyAccount"],
  },
  {
    key: "enquiry", slug: "enquiry", title: "Enquiry",
    tagline: "History lookup",
    description: "Read-only patient dispense, compounding and retail history.",
    icon: UserSearch,
    accent: "from-sky-500/25 via-cyan-500/15 to-transparent",
    ring: "ring-sky-400/30",
    actions: ["enquirePatient"],
  },
];

export function useSubmitAction() {
  const createItem = useWorkflow((s) => s.create);
  return (a: ActionSpec, values: Record<string, string>) => {
    const fields: Record<string, string | number> = { Kind: a.kind };
    a.fields.forEach((f) => {
      const raw = values[f.name] ?? "";
      if (!raw) return;
      fields[f.label] = f.type === "number" ? Number(raw) : raw;
    });
    const title = String(
      values.medication || values.product || values.formula || values.items ||
      values.originalProduct || values.account || values.customer || a.label,
    );
    const subtitle = [values.patient, values.ward, values.customer, values.account, values.location]
      .filter(Boolean).join(" · ") || a.kind;

    const rec = createItem("pharmacy", { title, subtitle, status: a.startStatus, fields });
    toast.success(`${a.label} captured`, { description: `${rec.id} · ${title}` });
    return rec;
  };
}

export function ActionDialog({
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
            <div className={"flex h-10 w-10 items-center justify-center rounded-xl " + (spec.destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
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
          <Button
            onClick={submit}
            className={spec.destructive ? "bg-destructive text-destructive-foreground hover:opacity-90" : "bg-gradient-primary hover:opacity-90"}
          >
            Save {spec.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EnquiryDialog({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const items = useWorkflow((s) => s.items.pharmacy);
  const [query, setQuery] = useState("");
  const results = useMemo<WorkflowItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 8);
    return items.filter((i) =>
      [i.title, i.subtitle ?? "", ...Object.values(i.fields).map(String)].join(" ").toLowerCase().includes(q),
    ).slice(0, 25);
  }, [items, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <DialogTitle>Enquire on Patient</DialogTitle>
          <DialogDescription>Search dispense, compounding and retail history.</DialogDescription>
        </DialogHeader>
        <div className="border-b border-border px-6 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
