import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { UserPlus, PhoneCall, Printer, Search, ChevronRight } from "lucide-react";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkflow, type WorkflowItem } from "@/lib/workflow-store";

export const Route = createFileRoute("/_app/patients")({
  head: () => ({
    meta: [
      { title: "Patient Maintenance — Impilo" },
      { name: "description", content: "Register patients, maintain contact details and print historical documents across Life Healthcare facilities." },
    ],
  }),
  component: PatientMaintenancePage,
});

const FACILITIES = [
  "Life Fourways", "Life Groenkloof", "Life Kingsbury", "Life Vincent Pallotti",
  "Life Glynnwood", "Life East London", "Life Westville", "Life Entabeni",
];
const SCHEMES = ["Discovery Health", "Bonitas", "GEMS", "Momentum Health", "Polmed", "Other"];

function PatientMaintenancePage() {
  const patients = useWorkflow((s) => s.items.patients);
  const create = useWorkflow((s) => s.create);
  const update = useWorkflow((s) => s.update);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query) return patients;
    const q = query.toLowerCase();
    return patients.filter((p) =>
      [p.id, p.title, p.subtitle ?? "", ...Object.values(p.fields).map(String)]
        .join(" ").toLowerCase().includes(q),
    );
  }, [patients, query]);

  const kpis = [
    { label: "Total patients", value: patients.length },
    { label: "Active", value: patients.filter((p) => p.status === "active").length },
    { label: "In review", value: patients.filter((p) => p.status === "review").length },
    { label: "Pending", value: patients.filter((p) => p.status === "pending").length },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Clinical · Patient Service"
        title="Patient Maintenance"
        description="Register new patients, keep contact details current, and print historical clinical documents."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => { setSelectedId(null); setContactOpen(true); }}>
              <PhoneCall className="h-4 w-4" /> Update Contact Details
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setSelectedId(null); setPrintOpen(true); }}>
              <Printer className="h-4 w-4" /> Print Past Documents
            </Button>
            <Button onClick={() => setRegisterOpen(true)} className="bg-gradient-primary shadow-glow hover:opacity-90">
              <UserPlus className="h-4 w-4" /> Register Patient
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
            <div className="mt-2 font-display text-3xl tracking-tight">{k.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients by name, MRN, scheme…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="text-xs text-muted-foreground">{filtered.length} of {patients.length} records</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">MRN</th>
                <th className="px-5 py-3 font-medium">Scheme</th>
                <th className="px-5 py-3 font-medium">Facility</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="w-32 px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No patients match your search.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-mono text-xs">{p.id}</td>
                  <td className="px-5 py-3 font-medium">{p.title}</td>
                  <td className="px-5 py-3">{p.fields["MRN"] ?? "—"}</td>
                  <td className="px-5 py-3">{p.fields["Scheme"] ?? "—"}</td>
                  <td className="px-5 py-3">{p.fields["Facility"] ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {p.fields["Phone"] ?? "—"}{p.fields["Email"] ? ` · ${p.fields["Email"]}` : ""}
                  </td>
                  <td className="px-5 py-3"><StatusChip status={p.status} /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Update contact details"
                        onClick={() => { setSelectedId(p.id); setContactOpen(true); }}
                      >
                        <PhoneCall className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Print past documents"
                        onClick={() => { setSelectedId(p.id); setPrintOpen(true); }}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSubmit={(values) => {
          const rec = create("patients", {
            title: values.name,
            subtitle: `${values.mrn} · ${values.scheme || "Unassigned"}`,
            status: "active",
            fields: {
              MRN: values.mrn,
              DOB: values.dob,
              Gender: values.gender,
              Scheme: values.scheme,
              Facility: values.facility,
              Practitioner: values.practitioner,
              Phone: values.phone,
              Email: values.email,
              Address: values.address,
            },
          });
          toast.success("Patient registered", { description: `${rec.title} · ${rec.id}` });
          setRegisterOpen(false);
        }}
      />

      <ContactDialog
        open={contactOpen}
        onOpenChange={(o) => { setContactOpen(o); if (!o) setSelectedId(null); }}
        patients={patients}
        initialId={selectedId}
        onSubmit={(id, values) => {
          const p = patients.find((x) => x.id === id);
          if (!p) return;
          update("patients", id, {
            fields: { ...p.fields, Phone: values.phone, Email: values.email, Address: values.address },
            history: [
              { at: new Date().toLocaleString(), action: "Contact details updated", by: "You",
                note: `Phone ${values.phone || "—"} · Email ${values.email || "—"}` },
              ...p.history,
            ],
          });
          toast.success("Contact details updated", { description: p.title });
          setContactOpen(false);
          setSelectedId(null);
        }}
      />

      <PrintDialog
        open={printOpen}
        onOpenChange={(o) => { setPrintOpen(o); if (!o) setSelectedId(null); }}
        patients={patients}
        initialId={selectedId}
        onPrint={(p, docIds) => {
          openPrintWindow(p, docIds);
          toast.success("Sent to printer", { description: `${docIds.length} document(s) · ${p.title}` });
          setPrintOpen(false);
          setSelectedId(null);
        }}
      />
    </>
  );
}

// ------------------------------------------------------------
// Register Patient
// ------------------------------------------------------------
type RegisterValues = {
  name: string; mrn: string; dob: string; gender: string;
  scheme: string; facility: string; practitioner: string;
  phone: string; email: string; address: string;
};

function RegisterDialog({
  open, onOpenChange, onSubmit,
}: { open: boolean; onOpenChange: (o: boolean) => void; onSubmit: (v: RegisterValues) => void }) {
  const empty: RegisterValues = {
    name: "", mrn: "", dob: "", gender: "", scheme: "", facility: "",
    practitioner: "", phone: "", email: "", address: "",
  };
  const [v, setV] = useState<RegisterValues>(empty);
  const set = <K extends keyof RegisterValues>(k: K, val: RegisterValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  const submit = () => {
    if (!v.name.trim()) return toast.error("Full name is required");
    if (!v.mrn.trim()) {
      // Auto-generate MRN if omitted
      v.mrn = `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    onSubmit(v);
    setV(empty);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register Patient</DialogTitle>
          <DialogDescription>Capture demographics and scheme details to open a new patient record.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sarah Johnson" />
          </Field>
          <Field label="MRN" hint="Auto-generated if blank">
            <Input value={v.mrn} onChange={(e) => set("mrn", e.target.value)} placeholder="MRN-000000" />
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={v.dob} onChange={(e) => set("dob", e.target.value)} />
          </Field>
          <Field label="Gender">
            <Select value={v.gender} onValueChange={(x) => set("gender", x)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {["M", "F", "Other"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Scheme">
            <Select value={v.scheme} onValueChange={(x) => set("scheme", x)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {SCHEMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Facility">
            <Select value={v.facility} onValueChange={(x) => set("facility", x)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {FACILITIES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Practitioner">
            <Input value={v.practitioner} onChange={(e) => set("practitioner", e.target.value)} placeholder="Dr. S. Naidoo" />
          </Field>
          <Field label="Phone">
            <Input value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+27 82 000 0000" />
          </Field>
          <Field label="Email">
            <Input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, suburb, city" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-primary hover:opacity-90">Register patient</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Update Contact Details
// ------------------------------------------------------------
function ContactDialog({
  open, onOpenChange, patients, initialId, onSubmit,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  patients: WorkflowItem[]; initialId: string | null;
  onSubmit: (id: string, v: { phone: string; email: string; address: string }) => void;
}) {
  const [id, setId] = useState<string>(initialId ?? "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const selected = patients.find((p) => p.id === id);

  // Load selected values when picker changes
  const pick = (nextId: string) => {
    setId(nextId);
    const p = patients.find((x) => x.id === nextId);
    setPhone(String(p?.fields["Phone"] ?? ""));
    setEmail(String(p?.fields["Email"] ?? ""));
    setAddress(String(p?.fields["Address"] ?? ""));
  };

  // If opened from a row, prefill once
  if (open && initialId && id !== initialId) pick(initialId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Contact Details</DialogTitle>
          <DialogDescription>Keep patient phone, email and address current for correspondence.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Field label="Patient" required>
            <Select value={id} onValueChange={pick}>
              <SelectTrigger><SelectValue placeholder="Select a patient…" /></SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title} — {String(p.fields["MRN"] ?? p.id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {selected && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Currently on file · Phone {String(selected.fields["Phone"] ?? "—")} · Email {String(selected.fields["Email"] ?? "—")}
            </div>
          )}
          <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 82 000 0000" /></Field>
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></Field>
          <Field label="Address"><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, suburb, city" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!id}
            onClick={() => onSubmit(id, { phone, email, address })}
            className="bg-gradient-primary hover:opacity-90"
          >
            Save contact details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Print Past Documents
// ------------------------------------------------------------
type PastDoc = { id: string; date: string; type: string; facility: string; author: string };

function pastDocsFor(p: WorkflowItem): PastDoc[] {
  const facility = String(p.fields["Facility"] ?? "Life Fourways");
  const practitioner = String(p.fields["Practitioner"] ?? "Dr. S. Naidoo");
  // Deterministic mock list per patient
  const seed = p.id.split("-").pop() ?? "0000";
  return [
    { id: `DOC-${seed}-01`, date: "2025-11-04", type: "Discharge summary", facility, author: practitioner },
    { id: `DOC-${seed}-02`, date: "2025-09-18", type: "Consent form",       facility, author: "Ward Clerk" },
    { id: `DOC-${seed}-03`, date: "2025-08-02", type: "Lab report",         facility, author: "Pathology" },
    { id: `DOC-${seed}-04`, date: "2025-05-21", type: "Imaging report",     facility, author: "Radiology" },
    { id: `DOC-${seed}-05`, date: "2024-12-10", type: "Referral letter",    facility, author: practitioner },
  ];
}

function PrintDialog({
  open, onOpenChange, patients, initialId, onPrint,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  patients: WorkflowItem[]; initialId: string | null;
  onPrint: (patient: WorkflowItem, docIds: string[]) => void;
}) {
  const [id, setId] = useState<string>(initialId ?? "");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  if (open && initialId && id !== initialId) {
    setId(initialId);
    setSelected({});
  }

  const patient = patients.find((p) => p.id === id);
  const docs = patient ? pastDocsFor(patient) : [];
  const chosen = docs.filter((d) => selected[d.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Print Past Documents</DialogTitle>
          <DialogDescription>Select a patient and choose which historical documents to include in the printout.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Field label="Patient" required>
            <Select value={id} onValueChange={(v) => { setId(v); setSelected({}); }}>
              <SelectTrigger><SelectValue placeholder="Select a patient…" /></SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title} — {String(p.fields["MRN"] ?? p.id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {patient && (
            <div className="rounded-md border border-border">
              <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
                <span>{docs.length} documents on record</span>
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    const all = docs.every((d) => selected[d.id]);
                    const next: Record<string, boolean> = {};
                    docs.forEach((d) => (next[d.id] = !all));
                    setSelected(next);
                  }}
                >
                  {docs.every((d) => selected[d.id]) ? "Clear all" : "Select all"}
                </button>
              </div>
              <ul className="max-h-64 overflow-y-auto divide-y divide-border">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!selected[d.id]}
                      onChange={(e) => setSelected((s) => ({ ...s, [d.id]: e.target.checked }))}
                      className="h-4 w-4 rounded border-border"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{d.type}</div>
                      <div className="text-xs text-muted-foreground">{d.date} · {d.facility} · {d.author}</div>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">{d.id}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!patient || chosen.length === 0}
            onClick={() => patient && onPrint(patient, chosen.map((d) => d.id))}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Printer className="h-4 w-4" /> Print {chosen.length > 0 ? `(${chosen.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function openPrintWindow(p: WorkflowItem, docIds: string[]) {
  const docs = pastDocsFor(p).filter((d) => docIds.includes(d.id));
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  const rows = docs.map((d) => `
    <section style="page-break-inside:avoid;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:12px 0;">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#6b7280;">
        <span>${d.id}</span><span>${d.date}</span>
      </div>
      <h3 style="margin:6px 0 4px 0;font-size:16px;">${d.type}</h3>
      <div style="font-size:12px;color:#374151;">${d.facility} · ${d.author}</div>
      <p style="margin-top:10px;font-size:13px;line-height:1.5;color:#111827;">
        This is a certified copy of the patient's ${d.type.toLowerCase()} generated by Impilo Patient Maintenance
        on ${new Date().toLocaleString()}. Please refer to the electronic record for the source of truth.
      </p>
    </section>
  `).join("");
  w.document.write(`<!doctype html><html><head><title>Documents · ${p.title}</title>
    <meta charset="utf-8" />
    <style>body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;padding:32px;max-width:820px;margin:0 auto;}h1{font-size:22px;margin:0 0 4px 0;}header{border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:16px;}dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13px;}dt{color:#6b7280;}</style>
  </head><body>
    <header>
      <h1>Impilo · Patient Maintenance</h1>
      <div style="font-size:12px;color:#6b7280;">Historical Documents Printout · ${new Date().toLocaleString()}</div>
    </header>
    <dl>
      <dt>Patient</dt><dd>${p.title}</dd>
      <dt>Reference</dt><dd>${p.id}</dd>
      <dt>MRN</dt><dd>${String(p.fields["MRN"] ?? "—")}</dd>
      <dt>Facility</dt><dd>${String(p.fields["Facility"] ?? "—")}</dd>
      <dt>Scheme</dt><dd>${String(p.fields["Scheme"] ?? "—")}</dd>
    </dl>
    ${rows}
    <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
  </body></html>`);
  w.document.close();
}

// ------------------------------------------------------------
// Field helper
// ------------------------------------------------------------
function Field({
  label, children, required, hint, className = "",
}: { label: string; children: React.ReactNode; required?: boolean; hint?: string; className?: string }) {
  return (
    <div className={"grid gap-1.5 " + className}>
      <Label>
        {label}{required && <span className="text-destructive"> *</span>}
        {hint && <span className="ml-2 text-[11px] font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}
