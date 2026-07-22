/**
 * View Assessment — searchable browser for existing assessments, with
 * a full detail modal accessible from the results.
 */
import { useMemo, useState } from "react";
import { Search as SearchIcon, X, Building2, Eye, Lock, Printer, Undo2, FileText } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CA_FACILITIES } from "@/modules/clinical-assessments/mock/clinical-assessment-mock-data";
import { clinicalAssessmentService } from "@/services/modules/clinical-assessment.service";
import type { AssessmentRecord, AssessmentState, ViewSearchMode } from "@/modules/clinical-assessments/contracts";
import { AssessmentDetailModal } from "./assessment-detail";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

const STATES: AssessmentState[] = ["Draft","InProgress","Incomplete","Completed","Corrected","Cancelled","AwaitingCountersignature"];

export function ViewAssessmentWizard({ open, onOpenChange }: Props) {
  const [facilityId, setFacilityId] = useState<string>(CA_FACILITIES[0]);
  const [mode, setMode] = useState<ViewSearchMode>("date");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [assessmentNumber, setAssessmentNumber] = useState("");
  const [surname, setSurname] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"" | "M" | "F" | "X">("");
  const [dob, setDob] = useState("");
  const [state, setState] = useState<"" | AssessmentState>("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const results = useMemo(() => {
    return clinicalAssessmentService.listAssessments({
      facilityId,
      mode,
      fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
      toDate: toDate ? new Date(toDate).toISOString() : undefined,
      assessmentNumber: mode === "assessment-number" ? assessmentNumber : undefined,
      surname: mode === "patient" ? surname : undefined,
      name: mode === "patient" ? name : undefined,
      gender: mode === "patient" ? (gender || undefined) : undefined,
      dob: mode === "patient" ? (dob || undefined) : undefined,
      state: state || undefined,
    });
  }, [facilityId, mode, fromDate, toDate, assessmentNumber, surname, name, gender, dob, state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1100px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-4rem)]">
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 shadow-sm ring-1 ring-border">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">View assessment</DialogTitle>
              <DialogDescription className="text-xs">
                Search assessments by date, number or patient details.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="ml-auto gap-1"><Building2 className="h-3 w-3" />{facilityId}</Badge>
          </div>
        </DialogHeader>

        <div className="shrink-0 border-b bg-muted/30 px-6 py-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Facility">
              <SelectBox value={facilityId} onChange={setFacilityId} options={CA_FACILITIES.map((f) => ({ value: f, label: f }))} />
            </Field>
            <Field label="Search mode">
              <SelectBox value={mode} onChange={(v) => setMode(v as ViewSearchMode)}
                options={[{ value: "date", label: "Date" }, { value: "assessment-number", label: "Assessment number" }, { value: "patient", label: "Patient details" }]} />
            </Field>
            <Field label="Assessment state">
              <SelectBox value={state || "all"} onChange={(v) => setState(v === "all" ? "" : (v as AssessmentState))}
                options={[{ value: "all", label: "Any state" }, ...STATES.map((s) => ({ value: s, label: s }))]} />
            </Field>
            <div />
            {mode === "date" && (
              <>
                <Field label="From date"><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Field>
                <Field label="To date"><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></Field>
              </>
            )}
            {mode === "assessment-number" && (
              <Field label="Assessment number">
                <Input value={assessmentNumber} onChange={(e) => setAssessmentNumber(e.target.value)} placeholder="CA-…" />
              </Field>
            )}
            {mode === "patient" && (
              <>
                <Field label="Surname"><Input value={surname} onChange={(e) => setSurname(e.target.value)} /></Field>
                <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="Gender">
                  <SelectBox value={gender || "any"} onChange={(v) => setGender(v === "any" ? "" : (v as "M" | "F" | "X"))}
                    options={[{ value: "any", label: "Any" }, { value: "F", label: "Female" }, { value: "M", label: "Male" }, { value: "X", label: "Other" }]} />
                </Field>
                <Field label="Date of birth"><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{results.length} result{results.length === 1 ? "" : "s"}</span>
            <span className="flex items-center gap-1"><SearchIcon className="h-3 w-3" /> Deterministic mock data</span>
          </div>
          <div className="rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                <tr>
                  <Th>Assessment #</Th><Th>Patient</Th><Th>Initials</Th><Th>DOB</Th>
                  <Th>Date</Th><Th>State</Th><Th>Lock</Th><Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-accent/40">
                    <Td className="font-mono text-[11px]">{r.assessmentNumber}</Td>
                    <Td className="font-medium">{r.patientName}</Td>
                    <Td>{r.patientInitials}</Td>
                    <Td>{r.patientDob}</Td>
                    <Td>{new Date(r.assessmentDate).toLocaleString("en-ZA")}</Td>
                    <Td><StateChip state={r.state} /></Td>
                    <Td>{r.lockedBy ? <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400"><Lock className="h-3 w-3" />{r.lockedBy}</span> : <span className="text-muted-foreground">—</span>}</Td>
                    <Td className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setDetailId(r.id)}>
                        Open
                      </Button>
                    </Td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-xs text-muted-foreground">No assessments match the current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="shrink-0 border-t bg-muted/20 px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
              <FileText className="h-3 w-3" />Search across the current facility scope.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="mr-1 h-3.5 w-3.5" />Close
              </Button>
            </div>
          </div>
        </div>

        <AssessmentDetailModal
          assessmentId={detailId}
          open={detailId !== null}
          onOpenChange={(v) => !v && setDetailId(null)}
        />
      </DialogContent>
    </Dialog>
  );
}

function StateChip({ state }: { state: AssessmentState }) {
  const cls: Record<AssessmentState, string> = {
    Draft: "border-border bg-muted/60 text-muted-foreground",
    InProgress: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    Incomplete: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Corrected: "border-primary/30 bg-primary/10 text-primary",
    Cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    AwaitingCountersignature: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", cls[state])}>{state}</span>;
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2 text-left font-medium", className)}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2 align-middle", className)}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
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

// Suppress unused imports flagged by linting when tree-shaken.
void Undo2; void Printer;
