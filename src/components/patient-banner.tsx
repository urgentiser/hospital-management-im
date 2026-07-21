import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, BadgeCheck, HeartPulse, ShieldAlert, User, UserSearch, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePatientContext } from "@/lib/patient-context";
import { useFacilityContext } from "@/lib/facility-context";
import { patients, admissions, type Patient } from "@/lib/mock-data";

function calcAge(dob: string): number {
  const then = new Date(dob).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / (365.25 * 24 * 3600 * 1000)));
}

function memberValidationStatus(p: Patient): { label: string; tone: "success" | "warning" | "muted" | "destructive" } {
  if (p.scheme === "Private / cash") return { label: "Cash — no scheme", tone: "muted" };
  if (p.status === "failed") return { label: "Validation failed", tone: "destructive" };
  if (p.status === "pending" || p.status === "review") return { label: "Awaiting scheme response", tone: "warning" };
  return { label: "Scheme validated", tone: "success" };
}

function authStatusFor(p: Patient): { label: string; tone: "success" | "warning" | "muted" | "destructive" } {
  if (!p.admission) return { label: "No authorisation on file", tone: "muted" };
  if (p.status === "failed") return { label: "Authorisation rejected", tone: "destructive" };
  if (p.status === "pending" || p.status === "review") return { label: "Awaiting authorisation", tone: "warning" };
  return { label: "Authorisation approved", tone: "success" };
}

function toneCls(tone: "success" | "warning" | "muted" | "destructive"): string {
  return {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    muted: "border-border bg-muted/50 text-muted-foreground",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  }[tone];
}

export function PatientBanner() {
  const patient = usePatientContext((s) => (s.currentPatientId ? patients.find((x) => x.id === s.currentPatientId) ?? null : null));
  const setPatient = usePatientContext((s) => s.setPatient);
  const activeFacility = useFacilityContext((s) => s.facility);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!patient) {
    return (
      <>
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <UserSearch className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">No patient selected</div>
              <div className="text-xs text-muted-foreground">
                Select a patient to unlock patient-related actions in this module.
              </div>
            </div>
          </div>
          <Button size="sm" onClick={() => setPickerOpen(true)} className="bg-gradient-primary">
            <User className="mr-1.5 h-4 w-4" /> Select patient
          </Button>
        </div>
        <PatientPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={(id) => { setPatient(id); setPickerOpen(false); }} />
      </>
    );
  }

  const age = calcAge(patient.dob);
  const admission = admissions.find((a) => a.id === patient.admission);
  const member = memberValidationStatus(patient);
  const auth = authStatusFor(patient);
  const allergies = patient.id.endsWith("41") ? "Penicillin, NSAIDs" : "None recorded";
  const alerts = patient.status === "failed" ? "Falls risk" : null;
  const infection = patient.mrn.endsWith("14") ? "MRSA precaution" : null;

  return (
    <>
      <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card/70 shadow-soft">
        <div className="flex flex-wrap items-center gap-4 border-b border-border/60 bg-gradient-to-r from-primary/5 via-transparent to-transparent px-4 py-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary font-semibold">
            {patient.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-semibold">{patient.name}</div>
              <span className="rounded-full border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{patient.mrn}</span>
              <span className="text-[11px] text-muted-foreground">{patient.dob} · {age} yrs · {patient.gender === "F" ? "Female" : "Male"}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>Facility: <span className="text-foreground">{patient.facility || activeFacility || "—"}</span></span>
              {admission && <span>Visit: <span className="font-mono text-foreground">{admission.id}</span></span>}
              {admission && <span>Ward/Bed: <span className="text-foreground">{admission.ward} · {admission.bed}</span></span>}
              <span>Scheme: <span className="text-foreground">{patient.scheme}</span></span>
              <span>Practitioner: <span className="text-foreground">{patient.practitioner}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setPickerOpen(true)} className="text-xs">
              <UserSearch className="mr-1 h-3.5 w-3.5" /> Change
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPatient(null)} className="text-xs text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5">
          <StatusPill icon={BadgeCheck} label={member.label} tone={member.tone} />
          <StatusPill icon={ShieldAlert} label={auth.label} tone={auth.tone} />
          <StatusPill icon={HeartPulse} label={`Allergies: ${allergies}`} tone={allergies === "None recorded" ? "muted" : "warning"} />
          {alerts && <StatusPill icon={AlertTriangle} label={alerts} tone="warning" />}
          {infection && <StatusPill icon={AlertTriangle} label={infection} tone="destructive" />}
          <StatusPill
            icon={User}
            label={admission ? `Admission ${admission.status}` : "No active admission"}
            tone={admission ? "success" : "muted"}
          />
        </div>
      </div>
      <PatientPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={(id) => { setPatient(id); setPickerOpen(false); }} />
    </>
  );
}

function StatusPill({ icon: Icon, label, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: "success" | "warning" | "muted" | "destructive" }) {
  return (
    <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium " + toneCls(tone)}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function PatientPickerDialog({ open, onOpenChange, onSelect }: { open: boolean; onOpenChange: (o: boolean) => void; onSelect: (id: string) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return patients;
    return patients.filter((p) => `${p.name} ${p.mrn} ${p.scheme} ${p.facility}`.toLowerCase().includes(s));
  }, [q]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select a patient</DialogTitle>
          <DialogDescription>Search by name, MRN, scheme or facility to set the patient context.</DialogDescription>
        </DialogHeader>
        <Input autoFocus placeholder="Search patients…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border">
          {results.length === 0 && (
            <div className="p-6 text-center text-xs text-muted-foreground">No patients match that search.</div>
          )}
          <ul className="divide-y divide-border">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onSelect(p.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      <span className="font-mono">{p.mrn}</span> · {p.scheme} · {p.facility}
                    </div>
                  </div>
                  <span className="rounded-full border border-border bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {p.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
