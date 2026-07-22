/**
 * Assessment Detail — read-only workspace showing every section of a
 * completed or in-progress assessment plus lock, state history and timeline.
 * Actions (correct/reopen, print, lock/unlock) respect availableActions.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2, ClipboardList, FileText, Lock, Unlock, Printer, Undo2, X, Clock, User,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { clinicalAssessmentService } from "@/services/modules/clinical-assessment.service";
import type { AssessmentRecord } from "@/modules/clinical-assessments/contracts";

type Props = { assessmentId: string | null; open: boolean; onOpenChange: (v: boolean) => void };

export function AssessmentDetailModal({ assessmentId, open, onOpenChange }: Props) {
  const [record, setRecord] = useState<AssessmentRecord | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open && assessmentId) {
      setRecord(clinicalAssessmentService.getAssessment(assessmentId));
      setReason("");
    } else if (!open) {
      setRecord(null);
    }
  }, [open, assessmentId]);

  const refresh = () => assessmentId && setRecord(clinicalAssessmentService.getAssessment(assessmentId));

  const canDo = (key: string) => !!record?.availableActions.includes(key as AssessmentRecord["availableActions"][number]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1100px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-4rem)]">
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/80 shadow-sm ring-1 ring-border">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg">
                {record ? `${record.assessmentNumber} · ${record.patientName}` : "Assessment"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {record ? `${record.type} · ${record.reason}` : "Loading…"}
              </DialogDescription>
            </div>
            {record && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{record.facilityName}</Badge>
                <Badge variant="outline">State · {record.state}</Badge>
                {record.lockedBy && (
                  <Badge variant="outline" className="gap-1 border-rose-400/40 text-rose-600 dark:text-rose-400">
                    <Lock className="h-3 w-3" />Locked · {record.lockedBy}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!record ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground">Assessment not found.</div>
          ) : (
            <Tabs defaultValue="summary" className="space-y-3">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="patient">Patient</TabsTrigger>
                <TabsTrigger value="context">Context</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="treatment">Treatment</TabsTrigger>
                <TabsTrigger value="illness">Illness</TabsTrigger>
                <TabsTrigger value="vitals">Vital signs</TabsTrigger>
                <TabsTrigger value="urinalysis">Urinalysis</TabsTrigger>
                <TabsTrigger value="acuity">Acuity</TabsTrigger>
                <TabsTrigger value="coding">Coding</TabsTrigger>
                <TabsTrigger value="state">State history</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <KVBlock title="Summary" rows={[
                  ["Assessment number", record.assessmentNumber],
                  ["Type", record.type],
                  ["Reason", record.reason],
                  ["Assessor", record.assessor],
                  ["Assessment date", new Date(record.assessmentDate).toLocaleString("en-ZA")],
                  ["Facility", record.facilityName],
                  ["Ward", record.wardId ?? "—"],
                  ["State", record.state],
                  ["Completeness", `${record.completenessPercent}%`],
                  ["Available actions", record.availableActions.join(", ")],
                ]} />
              </TabsContent>

              <TabsContent value="patient">
                <KVBlock title="Patient" rows={[
                  ["Name", record.patientName],
                  ["Initials", record.patientInitials],
                  ["MRN", record.mrn],
                  ["Gender", record.patientGender],
                  ["DOB", record.patientDob],
                  ["Identifier", record.integrity?.identifierValue ?? "—"],
                  ["Identifier type", record.integrity?.identifierType ?? "—"],
                ]} />
              </TabsContent>

              <TabsContent value="context">
                <KVBlock title="Clinical context" rows={[
                  ["Admission", record.admissionId ?? "—"],
                  ["Preadmission", record.preadmissionId ?? "—"],
                  ["Medical event", record.medicalEventId ?? "—"],
                  ["Ward / unit", record.wardId ?? "—"],
                ]} />
              </TabsContent>

              <TabsContent value="general">
                <KVBlock title="General considerations" rows={[
                  ["Allergies", record.general?.allergies || "—"],
                  ["Risk flags", record.general?.riskFlags || "—"],
                  ["Previous operations", record.general?.previousOperations || "—"],
                  ["Previous anaesthetic", record.general?.previousAnaesthetic || "—"],
                  ["Religious requirements", record.general?.religiousRequirements || "—"],
                  ["Cultural requirements", record.general?.culturalRequirements || "—"],
                ]} />
              </TabsContent>

              <TabsContent value="treatment">
                <KVBlock title="Treatment considerations" rows={[
                  ["Chemo / radiation", `${record.treatment?.chemoRadiation || "—"} · ${record.treatment?.chemoRadiationDetails || ""}`],
                  ["Steroids / cortisone", `${record.treatment?.steroidsCortisone || "—"} · ${record.treatment?.steroidsDetails || ""}`],
                  ["Current medication", record.treatment?.currentMedication || "—"],
                  ["Pacemaker / valve", `${record.treatment?.pacemakerValve || "—"} · ${record.treatment?.pacemakerDetails || ""}`],
                  ["Smoking", `${record.treatment?.smoking || "—"} · ${record.treatment?.smokingDetails || ""}`],
                  ["Alcohol", `${record.treatment?.alcohol || "—"} · ${record.treatment?.alcoholDetails || ""}`],
                  ["Pregnancy", `${record.treatment?.pregnancy || "—"}${record.treatment?.lmp ? ` · LMP ${record.treatment.lmp}` : ""}`],
                  ["Breastfeeding", record.treatment?.breastfeeding || "—"],
                  ["Oral contraceptive", record.treatment?.oralContraceptive || "—"],
                  ["Elderly considerations", record.treatment?.elderlyConsiderations || "—"],
                ]} />
              </TabsContent>

              <TabsContent value="illness">
                {!record.illness || Object.keys(record.illness).length === 0 ? (
                  <Empty />
                ) : (
                  <div className="rounded-lg border">
                    <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">Positive illness history</div>
                    <div className="divide-y">
                      {Object.entries(record.illness).map(([k, v]) => (
                        <div key={k} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs">
                          <div className="font-medium capitalize">{k}</div>
                          <div><span className="text-muted-foreground">Duration: </span>{v.duration ?? "—"} {v.durationType ?? ""}</div>
                          <div><span className="text-muted-foreground">Treatment: </span>{v.treatment || "—"}</div>
                          <div><span className="text-muted-foreground">Description: </span>{v.description || "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vitals">
                <KVBlock title="Vital signs" rows={[
                  ["BP", `${record.vitals?.systolic ?? "—"}/${record.vitals?.diastolic ?? "—"} mmHg`],
                  ["Pulse", `${record.vitals?.pulse ?? "—"} bpm · ${record.vitals?.pulseDescription || ""}`],
                  ["Respiration", `${record.vitals?.respiration ?? "—"} rpm · ${record.vitals?.respirationDescription || ""}`],
                  ["Temperature", `${record.vitals?.temperature ?? "—"} °C (${record.vitals?.temperatureRoute || "—"})`],
                  ["SpO₂", `${record.vitals?.spo2 ?? "—"} %`],
                  ["Weight / Height", `${record.vitals?.weight ?? "—"} kg · ${record.vitals?.height ?? "—"} cm`],
                  ["Haemoglucose", `${record.vitals?.haemoglucose ?? "—"} mmol/L`],
                  ["MRSA screening", record.vitals?.mrsaScreening ?? "—"],
                  ["Chest apex L/R", `${record.vitals?.chestApexLeft || "—"} · ${record.vitals?.chestApexRight || "—"}`],
                  ["Chest base L/R", `${record.vitals?.chestBaseLeft || "—"} · ${record.vitals?.chestBaseRight || "—"}`],
                ]} />
              </TabsContent>

              <TabsContent value="urinalysis">
                {!record.urinalysis ? <Empty /> : (
                  <KVBlock title="Urinalysis" rows={Object.entries(record.urinalysis).map(([k, v]) => [k, String(v ?? "—")])} />
                )}
              </TabsContent>

              <TabsContent value="acuity">
                {!record.acuity ? <Empty /> : (
                  <KVBlock title="Acuity" rows={Object.entries(record.acuity).map(([k, v]) => [k, String(v ?? "—")])} />
                )}
              </TabsContent>

              <TabsContent value="coding">
                {!record.codes || record.codes.length === 0 ? <Empty /> : (
                  <div className="rounded-lg border">
                    <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">Clinical codes</div>
                    <div className="divide-y">
                      {record.codes.map((c) => (
                        <div key={`${c.kind}-${c.code}`} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs">
                          <div className="font-mono">{c.code}</div>
                          <div><Badge variant="outline" className="text-[10px]">{c.kind}</Badge></div>
                          <div className="col-span-2 text-muted-foreground">{c.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="state">
                <div className="rounded-lg border">
                  <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">State history</div>
                  <div className="divide-y">
                    {record.stateHistory.map((h, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs">
                        <div className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{h.at}</div>
                        <div>{h.from} → <span className="font-medium">{h.to}</span></div>
                        <div className="flex items-center gap-1"><User className="h-3 w-3" />{h.by}</div>
                        <div className="text-muted-foreground">{h.reason ?? ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline">
                <div className="rounded-lg border">
                  <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">Timeline</div>
                  <div className="divide-y">
                    {record.timeline.map((t, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs">
                        <div className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{t.at}</div>
                        <div className="col-span-2">{t.entry}</div>
                        <div className="flex items-center gap-1"><User className="h-3 w-3" />{t.by}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="shrink-0 border-t bg-muted/20 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 text-[11px] text-muted-foreground">
              {record?.availableActions.length ? `Actions: ${record.availableActions.join(", ")}` : "No actions available."}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {record && canDo("lock") && !record.lockedBy && (
                <Button variant="outline" size="sm" onClick={() => { clinicalAssessmentService.lockAssessment(record.id, "Current user"); refresh(); toast.info("Assessment locked."); }}>
                  <Lock className="mr-1 h-3.5 w-3.5" /> Lock
                </Button>
              )}
              {record?.lockedBy && (
                <Button variant="outline" size="sm" onClick={() => { clinicalAssessmentService.unlockAssessment(record.id); refresh(); toast.info("Assessment unlocked."); }}>
                  <Unlock className="mr-1 h-3.5 w-3.5" /> Unlock
                </Button>
              )}
              {record && canDo("print") && (
                <Button variant="outline" size="sm" onClick={() => { toast.success("Print preview generated (mock)."); window.print(); }}>
                  <Printer className="mr-1 h-3.5 w-3.5" /> Print clinical record
                </Button>
              )}
              {record && canDo("correct") && (
                <ReopenAction record={record} reason={reason} setReason={setReason} onReopened={refresh} />
              )}
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="mr-1 h-3.5 w-3.5" /> Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReopenAction({
  record, reason, setReason, onReopened,
}: { record: AssessmentRecord; reason: string; setReason: (v: string) => void; onReopened: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {expanded && (
        <div className="flex items-center gap-2">
          <Label className="sr-only">Reason</Label>
          <Textarea rows={1} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for correction / reopen" className="h-9 min-h-9 w-64 text-xs" />
        </div>
      )}
      <Button
        variant="outline" size="sm"
        className={cn("border-rose-400/40 text-rose-600 dark:text-rose-400", expanded && "bg-rose-500/10")}
        onClick={() => {
          if (!expanded) { setExpanded(true); return; }
          if (!reason.trim()) { toast.error("A reason is required."); return; }
          clinicalAssessmentService.transitionAssessment(record.id, "Corrected", "Current user", reason);
          onReopened();
          setExpanded(false);
          toast.success("Assessment reopened for correction.");
        }}
      >
        <Undo2 className="mr-1 h-3.5 w-3.5" /> {expanded ? "Confirm reopen" : "Correct / reopen"}
      </Button>
    </div>
  );
}

function KVBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-lg border">
      <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium">{title}</div>
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
function Empty() {
  return <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground"><FileText className="mx-auto mb-1 h-4 w-4" />No data captured for this section.</div>;
}
