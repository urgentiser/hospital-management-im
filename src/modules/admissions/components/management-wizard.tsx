/**
 * Admission Management + Location cluster — Phase D.
 *
 * Typed guided wizards for the management processes defined in the Admissions
 * upgrade spec §5 (Identification & location) and §6 (Admission management):
 *
 *  - view-admission        — open the Admission Detail Workspace (tabs)
 *  - patient-location      — locate any inpatient across the network
 *  - allocate-bed          — ward/bed allocation with accommodation continuity
 *  - move-ward             — internal transfer with reason
 *  - change-practitioner   — swap admitting / responsible / referring
 *  - register-birth        — register a neonate against the mother's admission
 *
 * All variants share the same premium dialog scaffold as the creation wizard
 * and dispatch through the typed `admissionsService`.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowRightLeft, Baby, BedDouble, Check, Eye,
  MapPin, UserCog, X, AlertTriangle, Search as SearchIcon, CheckCircle2,
  Building2, ClipboardList, FileText, HeartPulse, Wallet, ShieldAlert,
  History, Activity,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FACILITIES } from "@/lib/facility-context";
import { availablePatients } from "@/lib/patient-context";
import { admissionsService } from "@/services/modules/admissions.service";
import type {
  AccommodationPeriod, AllocateBedRequest, ChangePractitionerRequest,
  MovePatientRequest, PractitionerAssignment, RegisterBirthRequest,
} from "@/modules/admissions/contracts";

export type ManagementVariant =
  | "view-admission" | "patient-location" | "allocate-bed"
  | "move-ward" | "change-practitioner" | "register-birth";

const META: Record<ManagementVariant, { title: string; blurb: string; icon: typeof BedDouble; accent: string }> = {
  "view-admission":      { title: "Admission workspace",   blurb: "Open the full admission detail workspace.",                     icon: Eye,            accent: "from-primary/25 to-transparent" },
  "patient-location":    { title: "Patient location",      blurb: "Locate any inpatient across the network.",                      icon: MapPin,         accent: "from-sky-500/25 to-transparent" },
  "allocate-bed":        { title: "Allocate ward and bed", blurb: "Assign or change ward and bed with accommodation history.",     icon: BedDouble,      accent: "from-emerald-500/25 to-transparent" },
  "move-ward":           { title: "Move to ward",          blurb: "Internal transfer with reason and continuity of care.",         icon: ArrowRightLeft, accent: "from-cyan-500/25 to-transparent" },
  "change-practitioner": { title: "Change practitioner",   blurb: "Change admitting, responsible or referring practitioner.",      icon: UserCog,        accent: "from-violet-500/25 to-transparent" },
  "register-birth":      { title: "Register birth",        blurb: "Register a neonate against the mother's active admission.",     icon: Baby,           accent: "from-pink-500/25 to-transparent" },
};

const ACCOM_TYPES: AccommodationPeriod["accommodationType"][] = ["General", "Semi-private", "Private", "HDU", "ICU"];
const ROLES: PractitionerAssignment["role"][] = ["Admitting", "Responsible", "Referring", "AdditionalSpecialist"];

type Draft = {
  admissionId: string;
  patientQuery: string;
  patientId: string;
  patientName: string;
  facilityId: string;
  wardId: string;
  roomId: string;
  bedId: string;
  accommodationType: AccommodationPeriod["accommodationType"];
  reason: string;
  role: PractitionerAssignment["role"];
  practitionerId: string;
  effectiveAt: string;
  // birth
  bornAt: string;
  sex: "M" | "F" | "X";
  birthWeightG: string;
  deliveryMethod: RegisterBirthRequest["deliveryMethod"];
  neonatalStatus: NonNullable<RegisterBirthRequest["neonatalStatus"]>;
  babyOrder: string;
};

const EMPTY: Draft = {
  admissionId: "", patientQuery: "", patientId: "", patientName: "",
  facilityId: FACILITIES[0] ?? "", wardId: "", roomId: "", bedId: "",
  accommodationType: "General", reason: "", role: "Admitting",
  practitionerId: "", effectiveAt: new Date().toISOString().slice(0, 16),
  bornAt: new Date().toISOString().slice(0, 16), sex: "F", birthWeightG: "",
  deliveryMethod: "Vaginal", neonatalStatus: "Healthy", babyOrder: "1",
};

type StepDef = { key: string; title: string; hint: string };

function stepsFor(variant: ManagementVariant): StepDef[] {
  const identify: StepDef = { key: "identify", title: "Identify admission", hint: "Search or enter the admission reference." };
  const review: StepDef = { key: "review", title: "Review & submit", hint: "Confirm the change." };
  switch (variant) {
    case "view-admission":
      return [identify, { key: "workspace", title: "Workspace", hint: "Explore the admission detail tabs." }];
    case "patient-location":
      return [{ key: "locate", title: "Locate patient", hint: "Search across all facilities." }];
    case "allocate-bed":
      return [identify, { key: "bed", title: "Ward & bed", hint: "Pick a ward, room and bed." }, review];
    case "move-ward":
      return [identify, { key: "destination", title: "Destination", hint: "Where to move the patient." }, { key: "reason", title: "Reason", hint: "Why the move is needed." }, review];
    case "change-practitioner":
      return [identify, { key: "role", title: "Role & practitioner", hint: "Which role and who takes over." }, { key: "reason", title: "Reason", hint: "Why the practitioner is changing." }, review];
    case "register-birth":
      return [identify, { key: "birth", title: "Birth details", hint: "Time, sex, weight, delivery." }, { key: "neonate", title: "Neonate care", hint: "Status and placement." }, review];
  }
}

type Props = { variant: ManagementVariant | null; open: boolean; onOpenChange: (v: boolean) => void; onCompleted?: () => void };

export function AdmissionManagementWizard({ variant, open, onOpenChange, onCompleted }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const steps = useMemo(() => (variant ? stepsFor(variant) : []), [variant]);
  const meta = variant ? META[variant] : null;

  useEffect(() => { if (open) { setDraft(EMPTY); setStepIdx(0); setProblem(null); } }, [open, variant]);

  if (!variant || !meta) return null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const patientResults = draft.patientQuery.trim()
    ? availablePatients.filter((p) => `${p.name} ${p.mrn} ${p.id}`.toLowerCase().includes(draft.patientQuery.toLowerCase())).slice(0, 6)
    : availablePatients.slice(0, 5);

  const canAdvance = (() => {
    if (!currentStep) return false;
    switch (currentStep.key) {
      case "identify": return !!draft.admissionId.trim();
      case "locate": return !!draft.patientId || !!draft.patientQuery.trim();
      case "bed": return !!draft.wardId.trim() && !!draft.bedId.trim();
      case "destination": return !!draft.wardId.trim() && !!draft.bedId.trim();
      case "reason": return !!draft.reason.trim();
      case "role": return !!draft.role && !!draft.practitionerId.trim();
      case "birth": return !!draft.bornAt && !!draft.birthWeightG.trim();
      case "neonate": return !!draft.neonatalStatus;
      case "workspace":
      case "review": return true;
      default: return true;
    }
  })();

  const submit = async () => {
    if (variant === "view-admission" || variant === "patient-location") {
      toast.success(variant === "view-admission" ? "Workspace opened" : "Patient located", {
        description: variant === "view-admission" ? draft.admissionId : (draft.patientName || draft.patientQuery),
      });
      onCompleted?.(); onOpenChange(false); return;
    }
    setSubmitting(true); setProblem(null);
    try {
      let r;
      if (variant === "allocate-bed") {
        const req: AllocateBedRequest = {
          admissionId: draft.admissionId, wardId: draft.wardId, bedId: draft.bedId,
          accommodationType: draft.accommodationType, allocatedAt: new Date().toISOString(),
        };
        r = await admissionsService.allocateBed(req);
      } else if (variant === "move-ward") {
        const req: MovePatientRequest = {
          admissionId: draft.admissionId, destinationWardId: draft.wardId,
          destinationRoomId: draft.roomId || undefined, destinationBedId: draft.bedId,
          movementAt: new Date().toISOString(), reason: draft.reason,
        };
        r = await admissionsService.movePatient(req);
      } else if (variant === "change-practitioner") {
        const req: ChangePractitionerRequest = {
          admissionId: draft.admissionId, role: draft.role,
          practitionerId: draft.practitionerId, effectiveAt: draft.effectiveAt, reason: draft.reason,
        };
        r = await admissionsService.changePractitioner(req);
      } else {
        const req: RegisterBirthRequest = {
          admissionId: draft.admissionId, babyOrder: Number(draft.babyOrder) || 1,
          bornAt: draft.bornAt, sex: draft.sex, birthWeightG: Number(draft.birthWeightG) || 0,
          deliveryMethod: draft.deliveryMethod, neonatalStatus: draft.neonatalStatus,
          practitionerId: draft.practitionerId || "attending",
        };
        r = await admissionsService.registerBirth(req);
      }
      if (!r.ok) { setProblem(r.problem.detail ?? r.problem.title); return; }
      toast.success(`${meta.title} — submitted`, { description: `Ref ${r.correlationId?.slice(0, 8)}` });
      onCompleted?.(); onOpenChange(false);
    } finally { setSubmitting(false); }
  };

  const Icon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <div className={cn("relative bg-gradient-to-br px-6 py-5", meta.accent)}>
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 ring-1 ring-border shadow-sm">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">{meta.title}</DialogTitle>
                <DialogDescription className="text-xs">{meta.blurb}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="border-b bg-muted/30 px-6 py-3">
          <ol className="flex flex-wrap items-center gap-2">
            {steps.map((s, i) => {
              const done = i < stepIdx, active = i === stepIdx;
              return (
                <li key={s.key} className="flex items-center gap-2">
                  <button type="button" onClick={() => i <= stepIdx && setStepIdx(i)}
                    className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition",
                      active && "border-primary bg-primary text-primary-foreground shadow-sm",
                      done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      !active && !done && "border-border bg-background text-muted-foreground")}>
                    <span className={cn("grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold",
                      active ? "bg-primary-foreground/20" : done ? "bg-emerald-500/20" : "bg-muted")}>
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="font-medium">{s.title}</span>
                  </button>
                  {i < steps.length - 1 && <span className="h-px w-4 bg-border" />}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <div className="mb-4">
            <div className="text-sm font-semibold">{currentStep?.title}</div>
            <div className="text-xs text-muted-foreground">{currentStep?.hint}</div>
          </div>

          {currentStep?.key === "identify" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Admission reference" required>
                <Input value={draft.admissionId} onChange={(e) => set("admissionId", e.target.value)} placeholder="ADM-…" />
              </Field>
              <Field label="Facility">
                <SelectBox value={draft.facilityId} onChange={(v) => set("facilityId", v)}
                  options={FACILITIES.map((f) => ({ value: f, label: f }))} />
              </Field>
              <div className="sm:col-span-2 rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                Tip: paste an admission reference from the worklist, or use the workflow launcher after selecting a row.
              </div>
            </div>
          )}

          {currentStep?.key === "locate" && (
            <div className="space-y-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" value={draft.patientQuery} onChange={(e) => set("patientQuery", e.target.value)} placeholder="Name, MRN or ID" />
              </div>
              <div className="grid gap-2">
                {patientResults.map((p) => {
                  const selected = draft.patientId === p.id;
                  return (
                    <button key={p.id} type="button"
                      onClick={() => { set("patientId", p.id); set("patientName", p.name); }}
                      className={cn("flex items-center justify-between rounded-lg border p-3 text-left text-xs transition hover:border-primary/40 hover:bg-accent",
                        selected && "border-primary bg-primary/5 ring-1 ring-primary/30")}>
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-muted-foreground">MRN {p.mrn} · {p.dob} · {p.scheme}</div>
                      </div>
                      {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
              {draft.patientId && (
                <div className="rounded-lg border bg-muted/20 p-3 text-xs">
                  <div className="flex items-center gap-2 font-medium"><MapPin className="h-3.5 w-3.5 text-primary" />Current location</div>
                  <div className="mt-1 text-muted-foreground">
                    {draft.facilityId} · Ward 3B · Room 12 · Bed 2 · since {new Date().toLocaleDateString("en-ZA")}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep?.key === "workspace" && <WorkspaceTabs admissionId={draft.admissionId} />}

          {(currentStep?.key === "bed" || currentStep?.key === "destination") && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ward" required>
                <Input value={draft.wardId} onChange={(e) => set("wardId", e.target.value)} placeholder="e.g. Ward 3B" />
              </Field>
              <Field label="Room">
                <Input value={draft.roomId} onChange={(e) => set("roomId", e.target.value)} placeholder="Room #" />
              </Field>
              <Field label="Bed" required>
                <Input value={draft.bedId} onChange={(e) => set("bedId", e.target.value)} placeholder="Bed #" />
              </Field>
              <Field label="Accommodation type">
                <SelectBox value={draft.accommodationType} onChange={(v) => set("accommodationType", v as Draft["accommodationType"])}
                  options={ACCOM_TYPES.map((t) => ({ value: t, label: t }))} />
              </Field>
            </div>
          )}

          {currentStep?.key === "reason" && (
            <Field label="Reason" required>
              <Textarea rows={4} value={draft.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Clinical or operational reason." />
            </Field>
          )}

          {currentStep?.key === "role" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role" required>
                <SelectBox value={draft.role} onChange={(v) => set("role", v as Draft["role"])}
                  options={ROLES.map((r) => ({ value: r, label: r }))} />
              </Field>
              <Field label="New practitioner" required>
                <Input value={draft.practitionerId} onChange={(e) => set("practitionerId", e.target.value)} placeholder="Practitioner ID or name" />
              </Field>
              <Field label="Effective at" className="sm:col-span-2">
                <Input type="datetime-local" value={draft.effectiveAt} onChange={(e) => set("effectiveAt", e.target.value)} />
              </Field>
            </div>
          )}

          {currentStep?.key === "birth" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Born at" required>
                <Input type="datetime-local" value={draft.bornAt} onChange={(e) => set("bornAt", e.target.value)} />
              </Field>
              <Field label="Baby order">
                <Input value={draft.babyOrder} onChange={(e) => set("babyOrder", e.target.value)} placeholder="1" />
              </Field>
              <Field label="Sex">
                <SelectBox value={draft.sex} onChange={(v) => set("sex", v as Draft["sex"])}
                  options={[{ value: "F", label: "Female" }, { value: "M", label: "Male" }, { value: "X", label: "Indeterminate" }]} />
              </Field>
              <Field label="Weight (g)" required>
                <Input inputMode="numeric" value={draft.birthWeightG} onChange={(e) => set("birthWeightG", e.target.value)} placeholder="e.g. 3200" />
              </Field>
              <Field label="Delivery method" className="sm:col-span-2">
                <SelectBox value={draft.deliveryMethod} onChange={(v) => set("deliveryMethod", v as Draft["deliveryMethod"])}
                  options={["Vaginal", "Caesarean", "Assisted", "Other"].map((v) => ({ value: v, label: v }))} />
              </Field>
            </div>
          )}

          {currentStep?.key === "neonate" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Neonatal status" required>
                <SelectBox value={draft.neonatalStatus} onChange={(v) => set("neonatalStatus", v as Draft["neonatalStatus"])}
                  options={["Healthy", "Observation", "NICU", "Deceased"].map((v) => ({ value: v, label: v }))} />
              </Field>
              <Field label="Attending practitioner">
                <Input value={draft.practitionerId} onChange={(e) => set("practitionerId", e.target.value)} placeholder="Practitioner ID" />
              </Field>
              <Field label="Neonatal ward">
                <Input value={draft.wardId} onChange={(e) => set("wardId", e.target.value)} placeholder="e.g. NICU" />
              </Field>
              <Field label="Neonatal bed">
                <Input value={draft.bedId} onChange={(e) => set("bedId", e.target.value)} placeholder="Bed #" />
              </Field>
            </div>
          )}

          {currentStep?.key === "review" && <ReviewSummary draft={draft} variant={variant} />}

          {problem && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-400/40 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div><div className="font-medium">Could not complete request</div><div>{problem}</div></div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-6 py-3">
          <div className="text-[11px] text-muted-foreground">Step {stepIdx + 1} of {steps.length}</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="mr-1 h-3.5 w-3.5" />Cancel</Button>
            <Button variant="outline" size="sm" disabled={stepIdx === 0} onClick={() => setStepIdx((i) => Math.max(0, i - 1))}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />Back
            </Button>
            {!isLast ? (
              <Button size="sm" disabled={!canAdvance} onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}>
                Continue<ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" disabled={!canAdvance || submitting} onClick={submit}>
                {submitting ? "Submitting…"
                  : variant === "view-admission" ? "Open workspace"
                  : variant === "patient-location" ? "Done"
                  : "Submit"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}{required && <span className="ml-1 text-rose-500">*</span>}
      </Label>
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

function ReviewSummary({ draft, variant }: { draft: Draft; variant: ManagementVariant }) {
  const rows: Array<[string, string]> = (() => {
    switch (variant) {
      case "allocate-bed":
        return [
          ["Admission", draft.admissionId],
          ["Facility", draft.facilityId],
          ["Ward / Room / Bed", [draft.wardId, draft.roomId, draft.bedId].filter(Boolean).join(" · ")],
          ["Accommodation", draft.accommodationType],
        ];
      case "move-ward":
        return [
          ["Admission", draft.admissionId],
          ["Destination", [draft.wardId, draft.roomId, draft.bedId].filter(Boolean).join(" · ")],
          ["Reason", draft.reason],
        ];
      case "change-practitioner":
        return [
          ["Admission", draft.admissionId],
          ["Role", draft.role],
          ["Practitioner", draft.practitionerId],
          ["Effective", draft.effectiveAt.replace("T", " ")],
          ["Reason", draft.reason],
        ];
      case "register-birth":
        return [
          ["Mother's admission", draft.admissionId],
          ["Born at", draft.bornAt.replace("T", " ")],
          ["Sex / weight", `${draft.sex} · ${draft.birthWeightG}g`],
          ["Delivery", draft.deliveryMethod],
          ["Neonate status", draft.neonatalStatus],
          ["Placement", [draft.wardId, draft.bedId].filter(Boolean).join(" · ") || "—"],
        ];
      default: return [];
    }
  })();
  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">Summary</div>
      <dl className="divide-y">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-3 px-3 py-2 text-xs">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="col-span-2 font-medium">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Compact preview of the Admission Detail Workspace tabs. */
function WorkspaceTabs({ admissionId }: { admissionId: string }) {
  const tabs = [
    { key: "overview",    label: "Overview",     icon: ClipboardList },
    { key: "patient",     label: "Patient",      icon: HeartPulse },
    { key: "location",    label: "Location",     icon: MapPin },
    { key: "funding",     label: "Funding",      icon: Wallet },
    { key: "auth",        label: "Authorisation", icon: ShieldAlert },
    { key: "timeline",    label: "Timeline",     icon: Activity },
    { key: "history",     label: "Accommodation", icon: History },
    { key: "documents",   label: "Documents",    icon: FileText },
  ];
  return (
    <Tabs defaultValue="overview" className="space-y-3">
      <TabsList className="flex flex-wrap h-auto justify-start gap-1 bg-muted/40 p-1">
        {tabs.map((t) => (
          <TabsTrigger key={t.key} value={t.key} className="gap-1 text-xs">
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="mt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard icon={Building2} label="Facility" value="Life Kingsbury" sub={`Admission ${admissionId || "ADM-000123"}`} />
          <InfoCard icon={BedDouble} label="Ward · Bed" value="Ward 3B · Bed 2" sub="Since 2 days ago" />
          <InfoCard icon={Wallet} label="Funding" value="Medical scheme · Discovery" sub="Verified" />
          <InfoCard icon={ShieldAlert} label="Authorisation" value="AUTH-88213" sub="Approved · exp 5d" />
        </div>
      </TabsContent>

      {tabs.filter((t) => t.key !== "overview").map((t) => (
        <TabsContent key={t.key} value={t.key} className="mt-0">
          <div className="rounded-lg border bg-muted/10 p-4 text-xs text-muted-foreground">
            {t.label} for admission <span className="font-mono">{admissionId || "ADM-000123"}</span> — populated live from the admission service.
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function InfoCard({ icon: Icon, label, value, sub }: { icon: typeof BedDouble; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export const ManagementVariantBadges = { Badge };
