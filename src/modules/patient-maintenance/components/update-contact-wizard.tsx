/**
 * Update Contact Details — 10-step guided wizard.
 * Identifier fields are read-only. Protected fields never editable here.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, Eye, Lock, MapPin,
  Save, Search as SearchIcon, ShieldAlert, X, Users, PhoneCall, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { patientMaintenanceService } from "@/services/modules/patient-maintenance.service";
import { usePatientMaintenanceJourney } from "@/modules/patient-maintenance/state/journey-context";
import {
  PM_FACILITIES, PM_PROVINCES,
} from "@/modules/patient-maintenance/mock/patient-maintenance-mock-data";
import type {
  Address, ContactUpdateInput, PatientRecord, PreferredChannel,
} from "@/modules/patient-maintenance/contracts";

type StepKey =
  | "facility" | "search" | "select" | "lock" | "contact"
  | "relationships" | "verify" | "note" | "confirm" | "complete";

const STEPS: Array<{ key: StepKey; title: string; icon: typeof MapPin }> = [
  { key: "facility",      title: "Facility",       icon: Building2 },
  { key: "search",        title: "Search",         icon: SearchIcon },
  { key: "select",        title: "Select patient", icon: Eye },
  { key: "lock",          title: "Lock check",     icon: Lock },
  { key: "contact",       title: "Update contact", icon: PhoneCall },
  { key: "relationships", title: "Relationships",  icon: Users },
  { key: "verify",        title: "Verify",         icon: ClipboardList },
  { key: "note",          title: "Reason",         icon: ShieldAlert },
  { key: "confirm",       title: "Confirm",        icon: CheckCircle2 },
  { key: "complete",      title: "Complete",       icon: Check },
];

function isEmail(v: string) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isSaPhone(v: string) { return !v || /^(\+27|0)[6-8][0-9](\s?\d){7}$/.test(v.replace(/\s+/g, "")); }

type Draft = {
  mobile: string; alternatePhone: string; email: string;
  preferredChannel: PreferredChannel;
  resLine1: string; resSuburb: string; resCity: string; resProvince: string; resPostal: string;
  postalSameAsResidential: boolean;
  postLine1: string; postSuburb: string; postCity: string; postProvince: string; postPostal: string;
  reason: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialPatientId?: string | null;
  onCompleted?: (record: PatientRecord) => void;
};

export function UpdateContactWizard({ open, onOpenChange, initialPatientId, onCompleted }: Props) {
  const journey = usePatientMaintenanceJourney();
  const [stepIdx, setStepIdx] = useState(0);
  const [facility, setFacility] = useState(journey.facility ?? PM_FACILITIES[0]);
  const [q, setQ] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setQ("");
      setPatientId(initialPatientId ?? null);
      setPatient(initialPatientId ? patientMaintenanceService.getPatient(initialPatientId) : null);
      setDraft(initialPatientId ? draftFrom(patientMaintenanceService.getPatient(initialPatientId)) : emptyDraft());
      journey.startJourney("update-contact");
      if (initialPatientId) setStepIdx(3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPatientId]);

  const step = STEPS[stepIdx];
  const results = useMemo(() =>
    q.trim() ? patientMaintenanceService.listPatients({ q, facility }) : patientMaintenanceService.listPatients({ facility }).slice(0, 8),
  [q, facility]);

  const hasChanges = useMemo(() => {
    if (!patient) return false;
    return (
      draft.mobile !== (patient.contact.mobile ?? "") ||
      draft.alternatePhone !== (patient.contact.alternatePhone ?? "") ||
      draft.email !== (patient.contact.email ?? "") ||
      draft.preferredChannel !== (patient.contact.preferredChannel ?? "SMS") ||
      draft.resLine1 !== (patient.contact.residentialAddress?.line1 ?? "") ||
      draft.resSuburb !== (patient.contact.residentialAddress?.suburb ?? "") ||
      draft.resCity !== (patient.contact.residentialAddress?.city ?? "") ||
      draft.resProvince !== (patient.contact.residentialAddress?.province ?? "") ||
      draft.resPostal !== (patient.contact.residentialAddress?.postalCode ?? "") ||
      draft.postalSameAsResidential !== (patient.contact.postalSameAsResidential ?? true)
    );
  }, [draft, patient]);

  const patch = (p: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...p }));

  const goNext = () => {
    if (step.key === "search" || step.key === "select") {
      if (!patientId) return toast.error("Select a patient to continue.");
      const p = patientMaintenanceService.getPatient(patientId);
      if (!p) return toast.error("Patient not found.");
      setPatient(p);
      setDraft(draftFrom(p));
    }
    if (step.key === "lock" && patient?.lockedBy) return toast.error(`Locked by ${patient.lockedBy}. Cannot edit until unlocked.`);
    if (step.key === "contact") {
      if (!isEmail(draft.email)) return toast.error("Email address format is invalid.");
      if (!isSaPhone(draft.mobile)) return toast.error("Mobile does not match a standard SA phone format.");
    }
    if (step.key === "verify" && !hasChanges) return toast.error("No values have changed — nothing to update.");
    if (step.key === "note" && !draft.reason.trim()) return toast.error("A reason for the update is required.");
    journey.markStepComplete(step.key);
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  };
  const goBack = () => setStepIdx((i) => Math.max(0, i - 1));

  const confirm = () => {
    if (!patient) return;
    const residential: Address = { line1: draft.resLine1, suburb: draft.resSuburb, city: draft.resCity, province: draft.resProvince, postalCode: draft.resPostal, country: patient.country };
    const postal: Address = draft.postalSameAsResidential ? residential : { line1: draft.postLine1, suburb: draft.postSuburb, city: draft.postCity, province: draft.postProvince, postalCode: draft.postPostal, country: patient.country };
    const input: ContactUpdateInput = {
      mobile: draft.mobile || undefined,
      alternatePhone: draft.alternatePhone || undefined,
      email: draft.email || undefined,
      preferredChannel: draft.preferredChannel,
      residentialAddress: residential,
      postalAddress: postal,
      reason: draft.reason,
    };
    const updated = patientMaintenanceService.updateContact(patient.id, input, "Reception · current user");
    if (updated) {
      setPatient(updated);
      onCompleted?.(updated);
      toast.success("Contact details updated. Audit entry recorded.");
      setStepIdx(STEPS.length - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1000px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-4rem)]">
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 shadow-sm ring-1 ring-border">
              <PhoneCall className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg">Update contact details</DialogTitle>
              <DialogDescription className="text-xs">Change phone, email, preferred channel and addresses. Identifier data stays protected.</DialogDescription>
            </div>
            <Badge variant="outline" className="ml-auto gap-1"><Building2 className="h-3 w-3" />{facility}</Badge>
          </div>
        </DialogHeader>

        <Stepper steps={STEPS} activeIdx={stepIdx} completed={journey.completedSteps} onJump={(i) => i <= stepIdx && setStepIdx(i)} />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step.key === "facility" && (
            <StepShell title="Facility context" icon={Building2}>
              <Field label="Facility"><SelectBox value={facility} onChange={(v) => { setFacility(v); journey.setFacility(v); }} options={PM_FACILITIES.map((f) => ({ value: f, label: f }))} /></Field>
            </StepShell>
          )}

          {step.key === "search" && (
            <StepShell title="Search patient" icon={SearchIcon}>
              <Field label="Search"><Input autoFocus placeholder="Name / MRN / SA ID / phone / email…" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
              <ResultList results={results} selectedId={patientId} onSelect={(id) => { setPatientId(id); setPatient(patientMaintenanceService.getPatient(id)); setDraft(draftFrom(patientMaintenanceService.getPatient(id))); }} />
            </StepShell>
          )}

          {step.key === "select" && (
            <StepShell title="Patient summary" icon={Eye}>
              {!patient ? <Empty text="No patient selected." /> : <PatientSummary p={patient} />}
            </StepShell>
          )}

          {step.key === "lock" && (
            <StepShell title="Lock / conflict check" icon={Lock}>
              {!patient ? <Empty text="No patient selected." /> : patient.lockedBy ? (
                <div className="rounded-lg border border-rose-400/40 bg-rose-500/5 p-3 text-xs text-rose-600 dark:text-rose-400">
                  <div className="mb-1 flex items-center gap-2 font-medium"><Lock className="h-3.5 w-3.5" /> Locked by {patient.lockedBy}</div>
                  <div className="text-[11px] opacity-80">Record is currently locked. Updates are disabled until released.</div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { const r = patientMaintenanceService.unlockPatient(patient.id); if (r) { setPatient(r); toast.success("Lock released."); } }}>
                      Release lock
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-400">Record is free to edit.</div>
              )}
            </StepShell>
          )}

          {step.key === "contact" && patient && (
            <StepShell title="Update contact" icon={PhoneCall}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Mobile"><Input value={draft.mobile} onChange={(e) => patch({ mobile: e.target.value })} /></Field>
                <Field label="Alternate phone"><Input value={draft.alternatePhone} onChange={(e) => patch({ alternatePhone: e.target.value })} /></Field>
                <Field label="Email"><Input value={draft.email} onChange={(e) => patch({ email: e.target.value })} /></Field>
                <Field label="Preferred channel"><SelectBox value={draft.preferredChannel} onChange={(v) => patch({ preferredChannel: v as PreferredChannel })} options={["Phone","SMS","Email","WhatsApp"].map((c) => ({ value: c, label: c }))} /></Field>
              </div>
              <div className="rounded-lg border p-3">
                <div className="mb-2 text-xs font-medium">Residential address</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Street"><Input value={draft.resLine1} onChange={(e) => patch({ resLine1: e.target.value })} /></Field>
                  <Field label="Suburb"><Input value={draft.resSuburb} onChange={(e) => patch({ resSuburb: e.target.value })} /></Field>
                  <Field label="City"><Input value={draft.resCity} onChange={(e) => patch({ resCity: e.target.value })} /></Field>
                  <Field label="Province"><SelectBox value={draft.resProvince || "Gauteng"} onChange={(v) => patch({ resProvince: v })} options={PM_PROVINCES.map((p) => ({ value: p, label: p }))} /></Field>
                  <Field label="Postal code"><Input value={draft.resPostal} onChange={(e) => patch({ resPostal: e.target.value })} /></Field>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={draft.postalSameAsResidential} onCheckedChange={(v) => patch({ postalSameAsResidential: !!v })} />
                Postal address is the same as residential
              </label>
              {!draft.postalSameAsResidential && (
                <div className="rounded-lg border p-3">
                  <div className="mb-2 text-xs font-medium">Postal address</div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Street"><Input value={draft.postLine1} onChange={(e) => patch({ postLine1: e.target.value })} /></Field>
                    <Field label="Suburb"><Input value={draft.postSuburb} onChange={(e) => patch({ postSuburb: e.target.value })} /></Field>
                    <Field label="City"><Input value={draft.postCity} onChange={(e) => patch({ postCity: e.target.value })} /></Field>
                    <Field label="Province"><SelectBox value={draft.postProvince || "Gauteng"} onChange={(v) => patch({ postProvince: v })} options={PM_PROVINCES.map((p) => ({ value: p, label: p }))} /></Field>
                    <Field label="Postal code"><Input value={draft.postPostal} onChange={(e) => patch({ postPostal: e.target.value })} /></Field>
                  </div>
                </div>
              )}
              <div className="rounded-lg border border-dashed p-3 text-[11px] text-muted-foreground">
                Identifier (SA ID / passport) and clinical alerts are not editable here. Use identity management for corrections.
              </div>
            </StepShell>
          )}

          {step.key === "relationships" && patient && (
            <StepShell title="Relationships" icon={Users}>
              {patient.relationships.length === 0 ? <Empty text="No relationships recorded." /> : (
                <div className="rounded-lg border">
                  <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">Next of kin, guarantor, employer, GP</div>
                  <div className="divide-y">
                    {patient.relationships.map((r, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs">
                        <div><Badge variant="outline" className="text-[10px]">{r.kind}</Badge></div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-muted-foreground">{r.relationship ?? "—"}</div>
                        <div>{r.phone ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-[11px] text-muted-foreground">Contact values on relationships can be maintained here; identifier changes require identity management.</div>
            </StepShell>
          )}

          {step.key === "verify" && patient && (
            <StepShell title="Verify changes" icon={ClipboardList}>
              <BeforeAfter
                rows={[
                  ["Mobile", patient.contact.mobile ?? "—", draft.mobile || "—"],
                  ["Alternate phone", patient.contact.alternatePhone ?? "—", draft.alternatePhone || "—"],
                  ["Email", patient.contact.email ?? "—", draft.email || "—"],
                  ["Preferred channel", patient.contact.preferredChannel ?? "—", draft.preferredChannel],
                  ["Residential", patient.contact.residentialAddress?.line1 ?? "—", draft.resLine1 || "—"],
                  ["Postal same as residential", patient.contact.postalSameAsResidential ? "Yes" : "No", draft.postalSameAsResidential ? "Yes" : "No"],
                ]}
              />
            </StepShell>
          )}

          {step.key === "note" && (
            <StepShell title="Reason for update" icon={ShieldAlert}>
              <Field label="Reason / note" required>
                <Textarea rows={3} value={draft.reason} onChange={(e) => patch({ reason: e.target.value })} placeholder="e.g. Patient confirmed new mobile number at reception" />
              </Field>
            </StepShell>
          )}

          {step.key === "confirm" && (
            <StepShell title="Confirm & save" icon={CheckCircle2}>
              <div className="rounded-lg border p-3 text-xs">Ready to save contact updates against <span className="font-medium">{patient?.firstName} {patient?.surname}</span> (MRN {patient?.mrn}).</div>
            </StepShell>
          )}

          {step.key === "complete" && (
            <StepShell title="Completed" icon={Check}>
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/5 p-5 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                <div className="text-sm font-semibold">Contact details updated</div>
                <div className="mt-1 text-xs text-muted-foreground">Audit entry recorded on the patient timeline.</div>
              </div>
            </StepShell>
          )}
        </div>

        <div className="shrink-0 border-t bg-muted/20 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-muted-foreground">Step {stepIdx + 1} of {STEPS.length}</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="mr-1 h-3.5 w-3.5" />Cancel</Button>
              <Button variant="outline" size="sm" onClick={() => { toast.info("Draft saved (mock)."); onOpenChange(false); }}><Save className="mr-1 h-3.5 w-3.5" />Save draft & exit</Button>
              <Button variant="outline" size="sm" onClick={goBack} disabled={stepIdx === 0}><ArrowLeft className="mr-1 h-3.5 w-3.5" />Back</Button>
              {step.key !== "confirm" && step.key !== "complete" && (
                <Button size="sm" onClick={goNext}>Continue<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
              )}
              {step.key === "confirm" && (
                <Button size="sm" onClick={confirm}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Save changes</Button>
              )}
              {step.key === "complete" && (
                <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function emptyDraft(): Draft {
  return {
    mobile: "", alternatePhone: "", email: "", preferredChannel: "SMS",
    resLine1: "", resSuburb: "", resCity: "", resProvince: "Gauteng", resPostal: "",
    postalSameAsResidential: true,
    postLine1: "", postSuburb: "", postCity: "", postProvince: "Gauteng", postPostal: "",
    reason: "",
  };
}
function draftFrom(p: PatientRecord | null): Draft {
  if (!p) return emptyDraft();
  const r = p.contact.residentialAddress;
  const po = p.contact.postalAddress;
  return {
    mobile: p.contact.mobile ?? "",
    alternatePhone: p.contact.alternatePhone ?? "",
    email: p.contact.email ?? "",
    preferredChannel: p.contact.preferredChannel ?? "SMS",
    resLine1: r?.line1 ?? "", resSuburb: r?.suburb ?? "", resCity: r?.city ?? "",
    resProvince: r?.province ?? "Gauteng", resPostal: r?.postalCode ?? "",
    postalSameAsResidential: p.contact.postalSameAsResidential ?? true,
    postLine1: po?.line1 ?? "", postSuburb: po?.suburb ?? "", postCity: po?.city ?? "",
    postProvince: po?.province ?? "Gauteng", postPostal: po?.postalCode ?? "",
    reason: "",
  };
}

function ResultList({ results, selectedId, onSelect }: { results: PatientRecord[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (results.length === 0) return <Empty text="No matching patients." />;
  return (
    <div className="max-h-72 overflow-y-auto rounded-lg border">
      <ul className="divide-y">
        {results.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onSelect(p.id)}
              className={cn("flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-accent/40",
                selectedId === p.id && "bg-primary/5")}>
              <div className="min-w-0">
                <div className="truncate font-medium">{p.firstName} {p.surname}</div>
                <div className="truncate text-[11px] text-muted-foreground"><span className="font-mono">{p.mrn}</span> · {p.facility} · DOB {p.dateOfBirth}</div>
              </div>
              <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PatientSummary({ p }: { p: PatientRecord }) {
  return (
    <div className="rounded-lg border p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold">{p.title} {p.firstName} {p.surname}</div>
        <Badge variant="outline" className="font-mono text-[10px]">{p.mrn}</Badge>
        <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        DOB {p.dateOfBirth} · {p.sex} · {p.facility} · {p.funding.method}{p.funding.schemeName ? ` (${p.funding.schemeName})` : ""}
      </div>
      {p.alerts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {p.alerts.map((a, i) => (
            <Badge key={i} variant="outline" className="border-amber-400/50 text-[10px] text-amber-700 dark:text-amber-400">{a.kind}: {a.text}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function BeforeAfter({ rows }: { rows: Array<[string, string, string]> }) {
  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-3 border-b bg-muted/30 px-3 py-2 text-[11px] font-medium">
        <div>Field</div><div>Before</div><div>After</div>
      </div>
      <div className="divide-y">
        {rows.map(([k, before, after]) => {
          const changed = before !== after;
          return (
            <div key={k} className={cn("grid grid-cols-3 gap-3 px-3 py-2 text-xs", changed && "bg-primary/5")}>
              <div className="text-muted-foreground">{k}</div>
              <div className="line-through opacity-70">{before}</div>
              <div className="font-medium">{after}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stepper({ steps, activeIdx, completed, onJump }: { steps: typeof STEPS; activeIdx: number; completed: string[]; onJump: (i: number) => void }) {
  return (
    <div className="shrink-0 border-b bg-muted/30 px-4 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((s, i) => {
          const isDone = completed.includes(s.key) || i < activeIdx;
          const isActive = i === activeIdx;
          return (
            <button key={s.key} type="button" onClick={() => onJump(i)}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition",
                isActive ? "border-primary bg-primary text-primary-foreground shadow-sm" :
                isDone ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                "border-border bg-background text-muted-foreground hover:bg-accent")}>
              <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[10px] font-semibold",
                isActive ? "bg-primary-foreground/20" : isDone ? "bg-emerald-500/20" : "bg-muted")}>
                {isDone ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="whitespace-nowrap">{s.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function StepShell({ title, icon: Icon, children }: { title: string; icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        <h3 className="text-base font-semibold">{title}</h3>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}{required && <span className="text-rose-500"> *</span>}</Label>
      {children}
    </div>
  );
}
function SelectBox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">{text}</div>;
}
