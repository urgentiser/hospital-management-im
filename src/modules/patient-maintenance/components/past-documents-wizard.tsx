/**
 * Print Past Documents — 8-step guided wizard.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, Eye, FileText,
  Printer, Save, Search as SearchIcon, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDateZA } from "@/lib/format";
import { patientMaintenanceService } from "@/services/modules/patient-maintenance.service";
import { usePatientMaintenanceJourney } from "@/modules/patient-maintenance/state/journey-context";
import {
  PM_FACILITIES, PM_PRINTERS,
} from "@/modules/patient-maintenance/mock/patient-maintenance-mock-data";
import type { PatientDocument, PatientRecord, PrintJob } from "@/modules/patient-maintenance/contracts";

type StepKey = "facility" | "search" | "select" | "summary" | "documents" | "preview" | "print" | "complete";
const STEPS: Array<{ key: StepKey; title: string; icon: typeof Printer }> = [
  { key: "facility",  title: "Facility",   icon: Building2 },
  { key: "search",    title: "Patient",    icon: SearchIcon },
  { key: "select",    title: "Confirm",    icon: Eye },
  { key: "summary",   title: "Summary",    icon: FileText },
  { key: "documents", title: "Documents",  icon: FileText },
  { key: "preview",   title: "Preview",    icon: Eye },
  { key: "print",     title: "Print",      icon: Printer },
  { key: "complete",  title: "Completed",  icon: Check },
];

const DOC_TYPES: Array<PatientDocument["type"] | "All"> = [
  "All", "Discharge summary", "Invoice", "Consent form", "Referral letter",
  "Medical aid card", "ID document", "Patient image", "Other",
];

type Props = {
  open: boolean; onOpenChange: (v: boolean) => void;
  initialPatientId?: string | null;
};

export function PastDocumentsWizard({ open, onOpenChange, initialPatientId }: Props) {
  const journey = usePatientMaintenanceJourney();
  const [stepIdx, setStepIdx] = useState(0);
  const [facility, setFacility] = useState(journey.facility ?? PM_FACILITIES[0]);
  const [q, setQ] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [typeFilter, setTypeFilter] = useState<PatientDocument["type"] | "All">("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [printer, setPrinter] = useState<string>(PM_PRINTERS[0]);
  const [copies, setCopies] = useState<number>(1);
  const [job, setJob] = useState<PrintJob | null>(null);

  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setQ("");
      setPatientId(initialPatientId ?? null);
      setPatient(initialPatientId ? patientMaintenanceService.getPatient(initialPatientId) : null);
      setSelectedDocIds([]);
      setJob(null);
      journey.startJourney("print-past-documents");
      if (initialPatientId) setStepIdx(3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPatientId]);

  const step = STEPS[stepIdx];
  const results = useMemo(() =>
    q.trim() ? patientMaintenanceService.listPatients({ q, facility }) : patientMaintenanceService.listPatients({ facility }).slice(0, 8),
  [q, facility]);

  const documents = useMemo<PatientDocument[]>(() => {
    if (!patient) return [];
    return patient.documents.filter((d) => {
      if (typeFilter !== "All" && d.type !== typeFilter) return false;
      if (fromDate && d.createdAt < new Date(fromDate).toISOString()) return false;
      if (toDate && d.createdAt > new Date(toDate + "T23:59:59").toISOString()) return false;
      return true;
    });
  }, [patient, typeFilter, fromDate, toDate]);

  const selectedDocs = useMemo(() =>
    documents.filter((d) => selectedDocIds.includes(d.id)),
  [documents, selectedDocIds]);

  const toggleDoc = (id: string) =>
    setSelectedDocIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const goNext = () => {
    if ((step.key === "search" || step.key === "select") && !patientId) return toast.error("Select a patient to continue.");
    if (step.key === "search" || step.key === "select") {
      setPatient(patientMaintenanceService.getPatient(patientId!));
    }
    if (step.key === "documents" && selectedDocIds.length === 0) return toast.error("Select at least one document.");
    if (step.key === "print" && (!printer || copies < 1)) return toast.error("Choose a printer and copies.");
    journey.markStepComplete(step.key);
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  };
  const goBack = () => setStepIdx((i) => Math.max(0, i - 1));

  const runPrint = () => {
    if (!patient) return;
    const created = patientMaintenanceService.createPrintJob({
      patientId: patient.id,
      documentIds: selectedDocIds,
      printer,
      copies,
      requestedBy: "Reception · current user",
    });
    setJob(created);
    toast.success(`Print job ${created.reference} queued (mock).`);
    setStepIdx(STEPS.length - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1000px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-4rem)]">
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 shadow-sm ring-1 ring-border">
              <Printer className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg">Print past documents</DialogTitle>
              <DialogDescription className="text-xs">Preview and reprint historic documents linked to the patient.</DialogDescription>
            </div>
            <Badge variant="outline" className="ml-auto gap-1"><Building2 className="h-3 w-3" />{facility}</Badge>
          </div>
        </DialogHeader>

        <Stepper steps={STEPS} activeIdx={stepIdx} completed={journey.completedSteps} onJump={(i) => i <= stepIdx && setStepIdx(i)} />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step.key === "facility" && (
            <StepShell title="Facility context" icon={Building2}>
              <Field label="Facility">
                <SelectBox value={facility} onChange={(v) => { setFacility(v); journey.setFacility(v); }} options={PM_FACILITIES.map((f) => ({ value: f, label: f }))} />
              </Field>
            </StepShell>
          )}

          {step.key === "search" && (
            <StepShell title="Search patient" icon={SearchIcon}>
              <Field label="Search"><Input autoFocus placeholder="Name / MRN / SA ID / phone…" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
              {results.length === 0 ? (
                <Empty text="No matching patients." />
              ) : (
                <div className="max-h-72 overflow-y-auto rounded-lg border">
                  <ul className="divide-y">
                    {results.map((p) => (
                      <li key={p.id}>
                        <button type="button" onClick={() => { setPatientId(p.id); setPatient(p); }}
                          className={cn("flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-accent/40",
                            patientId === p.id && "bg-primary/5")}>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{p.firstName} {p.surname}</div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              <span className="font-mono">{p.mrn}</span> · {p.facility} · {p.documents.length} document(s)
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </StepShell>
          )}

          {step.key === "select" && patient && (
            <StepShell title="Confirm patient" icon={Eye}>
              <div className="rounded-lg border p-3 text-xs">
                <div className="text-sm font-semibold">{patient.title} {patient.firstName} {patient.surname}</div>
                <div className="text-[11px] text-muted-foreground">MRN {patient.mrn} · DOB {patient.dateOfBirth} · {patient.facility}</div>
              </div>
            </StepShell>
          )}

          {step.key === "summary" && patient && (
            <StepShell title="Patient record summary" icon={FileText}>
              <div className="grid gap-3 sm:grid-cols-2">
                <KV rows={[["Full name", `${patient.title} ${patient.firstName} ${patient.surname}`], ["MRN", patient.mrn], ["DOB", patient.dateOfBirth], ["Sex", patient.sex]]} />
                <KV rows={[["Facility", patient.facility], ["Funding", patient.funding.method], ["Status", patient.status], ["Documents on file", String(patient.documents.length)]]} />
              </div>
            </StepShell>
          )}

          {step.key === "documents" && patient && (
            <StepShell title="Documents" icon={FileText}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Type"><SelectBox value={typeFilter} onChange={(v) => setTypeFilter(v as PatientDocument["type"] | "All")} options={DOC_TYPES.map((t) => ({ value: t, label: t }))} /></Field>
                <Field label="From"><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Field>
                <Field label="To"><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></Field>
              </div>
              {documents.length === 0 ? <Empty text="No documents match the current filters." /> : (
                <div className="rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                      <tr><Th className="w-6" /><Th>Type</Th><Th>Title</Th><Th>Date</Th><Th>Facility</Th><Th>Version</Th><Th>Status</Th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {documents.map((d) => (
                        <tr key={d.id} className="hover:bg-accent/40">
                          <Td><Checkbox checked={selectedDocIds.includes(d.id)} onCheckedChange={() => toggleDoc(d.id)} /></Td>
                          <Td><Badge variant="outline" className="text-[10px]">{d.type}</Badge></Td>
                          <Td className="font-medium">{d.title}</Td>
                          <Td>{formatDateZA(d.createdAt)}</Td>
                          <Td>{d.facility}</Td>
                          <Td className="font-mono text-[11px]">v{d.version}</Td>
                          <Td><Badge variant="outline" className={cn("text-[10px]", d.status === "Active" ? "border-emerald-400/50 text-emerald-700 dark:text-emerald-400" : "border-muted-foreground/40")}>{d.status}</Badge></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </StepShell>
          )}

          {step.key === "preview" && (
            <StepShell title="Selected documents" icon={Eye}>
              {selectedDocs.length === 0 ? <Empty text="No documents selected." /> : (
                <div className="rounded-lg border">
                  <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">Preview metadata</div>
                  <div className="divide-y">
                    {selectedDocs.map((d) => (
                      <div key={d.id} className="grid grid-cols-5 gap-2 px-3 py-2 text-xs">
                        <div className="font-medium">{d.title}</div>
                        <div>{d.type}</div>
                        <div>{formatDateZA(d.createdAt)}</div>
                        <div>{d.facility}</div>
                        <div className="font-mono text-[11px]">v{d.version} · {d.sizeKb} KB</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </StepShell>
          )}

          {step.key === "print" && (
            <StepShell title="Choose printer" icon={Printer}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Printer / output">
                  <SelectBox value={printer} onChange={setPrinter} options={PM_PRINTERS.map((p) => ({ value: p, label: p }))} />
                </Field>
                <Field label="Copies">
                  <Input type="number" min={1} max={20} value={copies} onChange={(e) => setCopies(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
                </Field>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { toast.info("Preview rendered (mock)."); window.print(); }}>
                  <Eye className="mr-1 h-3.5 w-3.5" /> Preview
                </Button>
                <Button size="sm" onClick={runPrint}>
                  <Printer className="mr-1 h-3.5 w-3.5" /> Send to print
                </Button>
              </div>
            </StepShell>
          )}

          {step.key === "complete" && (
            <StepShell title="Print job completed" icon={Check}>
              {job ? (
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/5 p-5 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                  <div className="text-sm font-semibold">Print job {job.reference} submitted</div>
                  <div className="mt-1 text-xs text-muted-foreground">{job.documentIds.length} document(s) sent to <span className="font-medium">{job.printer}</span> × {job.copies}. Audit entry recorded.</div>
                </div>
              ) : <Empty text="No print job yet." />}
            </StepShell>
          )}
        </div>

        <div className="shrink-0 border-t bg-muted/20 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-muted-foreground">Step {stepIdx + 1} of {STEPS.length}</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="mr-1 h-3.5 w-3.5" />Cancel</Button>
              <Button variant="outline" size="sm" onClick={() => { toast.info("Draft saved (mock)."); onOpenChange(false); }}><Save className="mr-1 h-3.5 w-3.5" />Save & exit</Button>
              <Button variant="outline" size="sm" onClick={goBack} disabled={stepIdx === 0}><ArrowLeft className="mr-1 h-3.5 w-3.5" />Back</Button>
              {step.key !== "print" && step.key !== "complete" && (
                <Button size="sm" onClick={goNext}>Continue<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
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
function StepShell({ title, icon: Icon, children }: { title: string; icon: typeof Printer; children: React.ReactNode }) {
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
function SelectBox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}
function KV({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="rounded-lg border">
      <dl className="divide-y">{rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-3 gap-3 px-3 py-2 text-xs">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="col-span-2 font-medium">{v || "—"}</dd>
        </div>
      ))}</dl>
    </div>
  );
}
function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2 text-left font-medium", className)}>{children}</th>;
}
function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2 align-middle", className)}>{children}</td>;
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">{text}</div>;
}
