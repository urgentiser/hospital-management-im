/**
 * Patient profile — tabbed read-only workspace opened from the directory
 * or after registration. Actions in the header launch the wizards.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Building2, FileText, IdCard, Lock, MapPin, PhoneCall, Printer, ShieldAlert,
  Unlock, User, Users, Wallet, Clock, HeartPulse, FileSignature, Eye, EyeOff,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDateZA } from "@/lib/format";
import { patientMaintenanceService } from "@/services/modules/patient-maintenance.service";
import type { PatientRecord } from "@/modules/patient-maintenance/contracts";
import { maskIdentifier } from "@/modules/patient-maintenance/components/patient-browser";
import { useAuth } from "@/security/auth-provider";
import { hasPermission, Permissions } from "@/security/permissions";

type Props = {
  patientId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdateContact?: (id: string) => void;
  onPrintDocuments?: (id: string) => void;
};

export function PatientProfileModal({ patientId, open, onOpenChange, onUpdateContact, onPrintDocuments }: Props) {
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [revealIdentifier, setRevealIdentifier] = useState(false);
  const { principal } = useAuth();
  const canView = hasPermission(principal, Permissions.PatientView);
  const canUpdate = hasPermission(principal, Permissions.PatientUpdate);
  const canPrint = hasPermission(principal, Permissions.DocumentView);

  useEffect(() => {
    if (open && patientId) setPatient(patientMaintenanceService.getPatient(patientId));
    if (!open) setRevealIdentifier(false);
  }, [open, patientId]);

  const printJobs = useMemo(() => patient ? patientMaintenanceService.listPrintJobs(patient.id) : [], [patient]);

  if (!patient) return null;

  const toggleLock = () => {
    const updated = patient.lockedBy
      ? patientMaintenanceService.unlockPatient(patient.id)
      : patientMaintenanceService.lockPatient(patient.id, "Reception · current user");
    if (updated) setPatient({ ...updated });
  };

  const identifierDisplay = revealIdentifier && canView
    ? (patient.identifierValue ?? patient.identifierUnavailableReason ?? "—")
    : maskIdentifier(patient.identifierValue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1100px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-4rem)]">
        <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg">{patient.title} {patient.firstName} {patient.surname}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono">{patient.mrn}</span>
                <span>·</span><span>DOB {formatDateZA(patient.dateOfBirth)}</span>
                <span>·</span><span>{patient.sex}</span>
                <span>·</span><span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{patient.facility}</span>
              </DialogDescription>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("text-[10px]",
                patient.status === "Active" && "border-emerald-400/50 text-emerald-700 dark:text-emerald-400",
                patient.status === "Inactive" && "border-muted-foreground/40 text-muted-foreground",
                patient.status === "Merged" && "border-amber-400/50 text-amber-700 dark:text-amber-400",
                patient.status === "Deceased" && "border-rose-400/50 text-rose-700 dark:text-rose-400",
              )}>{patient.status}</Badge>
              {patient.lockedBy && (
                <Badge variant="outline" className="gap-1 border-rose-400/40 text-[10px] text-rose-600 dark:text-rose-400">
                  <Lock className="h-3 w-3" /> Locked by {patient.lockedBy}
                </Badge>
              )}
              <Button size="sm" variant="outline" onClick={() => onUpdateContact?.(patient.id)}>
                <PhoneCall className="mr-1 h-3.5 w-3.5" /> Update contact
              </Button>
              <Button size="sm" variant="outline" onClick={() => onPrintDocuments?.(patient.id)}>
                <Printer className="mr-1 h-3.5 w-3.5" /> Print documents
              </Button>
              <Button size="sm" variant="ghost" onClick={toggleLock}>
                {patient.lockedBy ? <Unlock className="mr-1 h-3.5 w-3.5" /> : <Lock className="mr-1 h-3.5 w-3.5" />}
                {patient.lockedBy ? "Release lock" : "Lock record"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {patient.alerts.length > 0 && (
          <div className="shrink-0 border-b bg-amber-500/5 px-6 py-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-medium text-amber-700 dark:text-amber-400">Alerts:</span>
              {patient.alerts.map((a, i) => (
                <Badge key={i} variant="outline" className="border-amber-400/50 text-[10px] text-amber-700 dark:text-amber-400">
                  {a.kind}: {a.text}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="flex h-full flex-col">
            <div className="shrink-0 border-b bg-muted/20 px-6 pt-2">
              <TabsList>
                <TabsTrigger value="overview" className="gap-1.5"><User className="h-3.5 w-3.5" />Overview</TabsTrigger>
                <TabsTrigger value="contact" className="gap-1.5"><MapPin className="h-3.5 w-3.5" />Contact</TabsTrigger>
                <TabsTrigger value="funding" className="gap-1.5"><Wallet className="h-3.5 w-3.5" />Funding</TabsTrigger>
                <TabsTrigger value="clinical" className="gap-1.5"><HeartPulse className="h-3.5 w-3.5" />Clinical</TabsTrigger>
                <TabsTrigger value="documents" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Documents</TabsTrigger>
                <TabsTrigger value="timeline" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Timeline</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TabsContent value="overview" className="mt-0 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <KV title="Identity" rows={[
                    ["Full name", `${patient.title} ${patient.firstName} ${patient.middleNames ?? ""} ${patient.surname}`.replace(/\s+/g, " ").trim()],
                    ["Previous surname", patient.previousSurname ?? "—"],
                    ["Date of birth", formatDateZA(patient.dateOfBirth)],
                    ["Sex", patient.sex],
                    ["Nationality", patient.nationality ?? "—"],
                    ["Language", patient.language ?? "—"],
                    ["Marital status", patient.maritalStatus ?? "—"],
                  ]} />
                  <KV title="Identifier & scope" rows={[
                    ["Country", patient.country],
                    ["Patient type", patient.patientType],
                    ["Identifier type", patient.identifierType],
                    ["Identifier value", patient.identifierValue ?? patient.identifierUnavailableReason ?? "—"],
                    ["Facility", patient.facility],
                    ["Created", formatDateZA(patient.createdAt)],
                    ["Last updated", formatDateZA(patient.updatedAt)],
                  ]} />
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-0 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <KV title="Contact" rows={[
                    ["Mobile", patient.contact.mobile ?? "—"],
                    ["Alternate phone", patient.contact.alternatePhone ?? "—"],
                    ["Email", patient.contact.email ?? "—"],
                    ["Preferred channel", patient.contact.preferredChannel ?? "—"],
                  ]} icon={PhoneCall} />
                  <KV title="Residential address" rows={addressRows(patient.contact.residentialAddress)} icon={MapPin} />
                </div>
                {patient.contact.postalSameAsResidential ? (
                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Postal address is the same as residential.</div>
                ) : (
                  <KV title="Postal address" rows={addressRows(patient.contact.postalAddress)} icon={MapPin} />
                )}
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> Relationships</div>
                  {patient.relationships.length === 0 ? <Empty text="No relationships captured." /> : (
                    <div className="rounded-lg border">
                      <div className="grid grid-cols-4 border-b bg-muted/30 px-3 py-2 text-[11px] font-medium">
                        <div>Kind</div><div>Name</div><div>Relationship</div><div>Phone</div>
                      </div>
                      <div className="divide-y">
                        {patient.relationships.map((r, i) => (
                          <div key={i} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs">
                            <div><Badge variant="outline" className="text-[10px]">{r.kind}</Badge></div>
                            <div className="font-medium">{r.name}</div>
                            <div>{r.relationship ?? "—"}</div>
                            <div>{r.phone ?? "—"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="funding" className="mt-0 space-y-4">
                <KV title={`Funding · ${patient.funding.method}`} icon={Wallet} rows={fundingRows(patient)} />
                <KV title="Consent & privacy" icon={FileSignature} rows={[
                  ["POPIA / privacy", patient.consent.privacyAcknowledged ? "Acknowledged" : "Not acknowledged"],
                  ["Treatment consent", patient.consent.treatmentConsent ? "Consented" : "Not consented"],
                  ["Communication consent", patient.consent.communicationConsent ? "Consented" : "Declined"],
                  ["Signer", patient.consent.signerName ?? "—"],
                  ["Signer relationship", patient.consent.signerRelationship ?? "—"],
                  ["Digital signature", patient.consent.digitalSignatureAcknowledged ? "Captured" : "Not captured"],
                  ["Captured at", patient.consent.capturedAt ? formatDateZA(patient.consent.capturedAt) : "—"],
                ]} />
              </TabsContent>

              <TabsContent value="clinical" className="mt-0 space-y-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="h-4 w-4" /> Alerts</div>
                  {patient.alerts.length === 0 ? <Empty text="No clinical alerts." /> : (
                    <div className="flex flex-wrap gap-2">
                      {patient.alerts.map((a, i) => (
                        <Badge key={i} variant="outline" className="border-amber-400/50 text-xs text-amber-700 dark:text-amber-400">
                          <span className="mr-1 font-medium">{a.kind}</span>{a.text}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><HeartPulse className="h-4 w-4" /> Visits</div>
                  {patient.visits.length === 0 ? <Empty text="No admissions on record." /> : (
                    <div className="rounded-lg border">
                      <div className="grid grid-cols-6 border-b bg-muted/30 px-3 py-2 text-[11px] font-medium">
                        <div>Admission #</div><div>Facility · Ward</div><div>Admitted</div><div>Discharged</div><div>Practitioner</div><div>Status</div>
                      </div>
                      <div className="divide-y">
                        {patient.visits.map((v) => (
                          <div key={v.id} className="grid grid-cols-6 gap-2 px-3 py-2 text-xs">
                            <div className="font-mono">{v.id}</div>
                            <div>{v.facility}{v.ward ? ` · ${v.ward}` : ""}</div>
                            <div>{formatDateZA(v.admittedAt)}</div>
                            <div>{v.dischargedAt ? formatDateZA(v.dischargedAt) : "—"}</div>
                            <div>{v.practitioner}</div>
                            <div><Badge variant="outline" className={cn("text-[10px]",
                              v.status === "In-hospital" && "border-primary/50 text-primary",
                              v.status === "Discharged" && "border-emerald-400/50 text-emerald-700 dark:text-emerald-400",
                              v.status === "Cancelled" && "border-muted-foreground/40 text-muted-foreground",
                            )}>{v.status}</Badge></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4" /> Documents on file ({patient.documents.length})</div>
                  <Button size="sm" variant="outline" onClick={() => onPrintDocuments?.(patient.id)}>
                    <Printer className="mr-1 h-3.5 w-3.5" /> Reprint
                  </Button>
                </div>
                {patient.documents.length === 0 ? <Empty text="No documents linked to this patient." /> : (
                  <div className="rounded-lg border">
                    <div className="grid grid-cols-6 border-b bg-muted/30 px-3 py-2 text-[11px] font-medium">
                      <div>Type</div><div>Title</div><div>Facility</div><div>Version</div><div>Created</div><div>Status</div>
                    </div>
                    <div className="divide-y">
                      {patient.documents.map((d) => (
                        <div key={d.id} className="grid grid-cols-6 gap-2 px-3 py-2 text-xs">
                          <div><Badge variant="outline" className="text-[10px]">{d.type}</Badge></div>
                          <div className="font-medium">{d.title}</div>
                          <div>{d.facility}</div>
                          <div className="font-mono">v{d.version}</div>
                          <div>{formatDateZA(d.createdAt)}</div>
                          <div><Badge variant="outline" className={cn("text-[10px]",
                            d.status === "Active" && "border-emerald-400/50 text-emerald-700 dark:text-emerald-400",
                            d.status === "Superseded" && "border-muted-foreground/40 text-muted-foreground",
                            d.status === "Withdrawn" && "border-rose-400/50 text-rose-700 dark:text-rose-400",
                          )}>{d.status}</Badge></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {printJobs.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Printer className="h-4 w-4" /> Recent print jobs</div>
                    <div className="rounded-lg border">
                      <div className="grid grid-cols-5 border-b bg-muted/30 px-3 py-2 text-[11px] font-medium">
                        <div>Reference</div><div>Printer</div><div>Copies</div><div>Requested by</div><div>At</div>
                      </div>
                      <div className="divide-y">
                        {printJobs.map((j) => (
                          <div key={j.id} className="grid grid-cols-5 gap-2 px-3 py-2 text-xs">
                            <div className="font-mono">{j.reference}</div>
                            <div>{j.printer}</div>
                            <div>{j.copies}</div>
                            <div>{j.requestedBy}</div>
                            <div>{j.requestedAt}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="mt-0 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4" /> Audit timeline</div>
                {patient.timeline.length === 0 ? <Empty text="No timeline entries." /> : (
                  <ol className="relative space-y-3 border-l pl-6">
                    {patient.timeline.map((t, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-4 ring-background">·</span>
                        <div className="rounded-lg border bg-card p-3 text-xs shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-medium">{t.entry}</div>
                            {t.category && <Badge variant="outline" className="text-[10px]">{t.category}</Badge>}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">{t.at} · {t.by}</div>
                          {(t.before || t.after) && (
                            <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border bg-muted/30 p-2 text-[11px]">
                              <div><div className="font-medium text-muted-foreground">Before</div>{renderKV(t.before)}</div>
                              <div><div className="font-medium text-muted-foreground">After</div>{renderKV(t.after)}</div>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KV({ title, rows, icon: Icon }: { title: string; rows: Array<[string, string]>; icon?: typeof User }) {
  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2 text-xs font-medium">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}{title}
      </div>
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
function addressRows(a?: PatientRecord["contact"]["residentialAddress"]): Array<[string, string]> {
  return [
    ["Street", a?.line1 ?? "—"],
    ["Suburb", a?.suburb ?? "—"],
    ["City", a?.city ?? "—"],
    ["Province", a?.province ?? "—"],
    ["Postal code", a?.postalCode ?? "—"],
    ["Country", a?.country ?? "—"],
  ];
}
function fundingRows(p: PatientRecord): Array<[string, string]> {
  const f = p.funding;
  switch (f.method) {
    case "Medical Scheme": return [
      ["Scheme", f.schemeName ?? "—"], ["Plan / option", f.planOption ?? "—"],
      ["Membership", f.membershipNumber ?? "—"], ["Dependant code", f.dependantCode ?? "—"],
      ["Principal member", f.principalMember ?? "—"],
    ];
    case "Private / Cash": return [["Guarantor", f.guarantorName ?? "—"], ["Account-responsible", f.principalMember ?? "—"]];
    case "Government": case "Insurance": return [
      ["Reference / policy", f.policyReference ?? "—"], ["Responsible organisation", f.responsibleOrganisation ?? "—"],
    ];
    case "COID": return [
      ["Employer", f.employer ?? "—"], ["Accident date", f.accidentDate ? formatDateZA(f.accidentDate) : "—"],
      ["Claim number", f.claimNumber ?? "—"], ["Injury", f.injuryDescription ?? "—"],
    ];
  }
}
function renderKV(o?: Record<string, string | undefined>) {
  if (!o) return <div>—</div>;
  const entries = Object.entries(o).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return <div>—</div>;
  return (
    <ul className="mt-0.5 space-y-0.5">
      {entries.map(([k, v]) => (
        <li key={k}><span className="text-muted-foreground">{k}:</span> {v || "—"}</li>
      ))}
    </ul>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">{text}</div>;
}

// Referenced only via Icon in tabs.
void Eye;
void IdCard;
