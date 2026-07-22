/**
 * Admission Workspace — Phase 5.
 *
 * Readiness-driven workspace: the server tells us the current state, which
 * actions are available and the state of downstream checks (authorisation,
 * member validation, billing, discharge). The UI never re-derives these.
 * Every mutation refetches record + readiness so version tokens and
 * available actions stay authoritative.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowLeft, BedDouble, Building2, Clock, LogOut, Undo2, Ban, StopCircle,
  Pencil, FileText, Receipt, ClipboardCheck, Coins, ShieldAlert, Wallet,
  ArrowRightLeft, UserCog, Baby, ClipboardList, RefreshCw, AlertTriangle,
  MapPin, CheckCircle2, CircleAlert, CircleDashed, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { admissionsService } from "@/services/modules/admissions.service";
import type { AdmissionActionKey, AdmissionReadiness } from "@/modules/admissions/contracts";
import { AdmissionManagementWizard, type ManagementVariant } from "@/modules/admissions/components/management-wizard";
import { AdmissionFundingWizard, type FundingVariant } from "@/modules/admissions/components/funding-wizard";
import { AdmissionFinancialWizard, type FinancialVariant } from "@/modules/admissions/components/financial-wizard";
import { AdmissionDepartureWizard, type DepartureVariant } from "@/modules/admissions/components/departure-wizard";

type ActionDef = {
  action: AdmissionActionKey;
  label: string;
  hint: string;
  icon: typeof BedDouble;
  destructive?: boolean;
} & (
  | { kind: "mgmt"; variant: ManagementVariant }
  | { kind: "fund"; variant: FundingVariant }
  | { kind: "fin";  variant: FinancialVariant }
  | { kind: "dep";  variant: DepartureVariant }
);

const ACTIONS: ActionDef[] = [
  { action: "AllocateBed",           kind: "mgmt", variant: "allocate-bed",       label: "Allocate bed",           icon: BedDouble,      hint: "Assign or change ward and bed." },
  { action: "MoveToWard",            kind: "mgmt", variant: "move-ward",          label: "Move ward",              icon: ArrowRightLeft, hint: "Internal transfer with continuity." },
  { action: "ChangePractitioner",    kind: "mgmt", variant: "change-practitioner",label: "Change practitioner",    icon: UserCog,        hint: "Admitting, responsible or referring." },
  { action: "RegisterBirth",         kind: "mgmt", variant: "register-birth",     label: "Register birth",         icon: Baby,           hint: "Register a neonate against this admission." },
  { action: "CaptureAuthorisation",  kind: "fund", variant: "capture-auth",       label: "Capture authorisation",  icon: ShieldAlert,    hint: "Record scheme, stay and treatment approvals." },
  { action: "UpdateAdmission",       kind: "fund", variant: "funding-change",     label: "Change funding",         icon: Wallet,         hint: "Update funding method or guarantor." },
  { action: "AddMiscellaneousCharge",kind: "fin",  variant: "misc-charge",        label: "Miscellaneous charge",   icon: Receipt,        hint: "Add consumable, sundry or investigation." },
  { action: "ManageBillingChecks",   kind: "fin",  variant: "billing-checks",     label: "Billing checks",         icon: ClipboardCheck, hint: "Resolve, override or reassign checks." },
  { action: "FinaliseBill",          kind: "fin",  variant: "finalise-bill",      label: "Finalise bill",          icon: Coins,          hint: "Close accommodation and finalise the bill." },
  { action: "StartDischarge",        kind: "dep",  variant: "predischarge",       label: "Pre-discharge review",   icon: ClipboardList,  hint: "Review outstanding items before discharge." },
  { action: "StartDischarge",        kind: "dep",  variant: "discharge",          label: "Discharge patient",      icon: LogOut,         hint: "Complete discharge with disposition." },
  { action: "ViewDocuments",         kind: "dep",  variant: "notes-documents",    label: "Notes / documents",      icon: FileText,       hint: "Add a note or attach a document." },
  { action: "UpdateAdmission",       kind: "dep",  variant: "amend-admission",    label: "Amend admission",        icon: Pencil,         hint: "Correct captured details (audited)." },
  { action: "UndischargeEuPatient",  kind: "dep",  variant: "undischarge",        label: "Undischarge (EU)",       icon: Undo2,          hint: "Reverse a discharge (Emergency Unit).", destructive: true },
  { action: "CancelAdmission",       kind: "dep",  variant: "cancel-admission",   label: "Cancel admission",       icon: Ban,            hint: "Cancel a pending or active admission.", destructive: true },
  { action: "DiscontinueAdmission",  kind: "dep",  variant: "discontinue",        label: "Discontinue",            icon: StopCircle,     hint: "Stop an in-progress admission.", destructive: true },
];

type PillTone = "ok" | "warn" | "block" | "muted";
const pillTone: Record<PillTone, string> = {
  ok:    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warn:  "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  block: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  muted: "border-border bg-muted/40 text-muted-foreground",
};

function ReadinessPill({ label, value, tone, icon: Icon }: {
  label: string; value: string; tone: PillTone; icon: typeof CheckCircle2;
}) {
  return (
    <div className={cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px]", pillTone[tone])}>
      <Icon className="h-3.5 w-3.5" />
      <span className="uppercase tracking-wide">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function toneFor(status: string): PillTone {
  const s = status.toLowerCase();
  if (["ready", "clear", "verified", "approved"].includes(s)) return "ok";
  if (["pending", "notready", "notrequired"].includes(s)) return "warn";
  if (["blocked", "failed", "declined"].includes(s)) return "block";
  return "muted";
}

function AdmissionWorkspaceRoute() {
  const { admissionId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [mgmt, setMgmt] = useState<ManagementVariant | null>(null);
  const [fund, setFund] = useState<FundingVariant | null>(null);
  const [fin,  setFin]  = useState<FinancialVariant | null>(null);
  const [dep,  setDep]  = useState<DepartureVariant | null>(null);

  const detailQ = useQuery({
    queryKey: ["admissions", "detail", admissionId],
    queryFn: ({ signal }) => admissionsService.getRecord(admissionId, signal),
    staleTime: 15_000,
  });

  const readinessQ = useQuery<AdmissionReadiness | null>({
    queryKey: ["admissions", "readiness", admissionId],
    queryFn: async () => {
      const res = await admissionsService.getReadiness(admissionId);
      return res.ok ? res.data : null;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  const record = detailQ.data;
  const readiness = readinessQ.data;
  const allowed = useMemo(() => new Set(readiness?.availableActions ?? []), [readiness]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admissions", "detail", admissionId] });
    qc.invalidateQueries({ queryKey: ["admissions", "readiness", admissionId] });
  };
  const refetchAll = () => { detailQ.refetch(); readinessQ.refetch(); };
  const isFetching = detailQ.isFetching || readinessQ.isFetching;

  const fields = useMemo(() => Object.entries(record?.fields ?? {}), [record]);
  const history = record?.history ?? [];

  const statusTone =
    record?.status === "admitted"     ? pillTone.ok
  : record?.status === "pending"      ? pillTone.warn
  : record?.status === "discharged"   ? "border-slate-400/40 bg-slate-500/10 text-slate-600 dark:text-slate-300"
  : record?.status === "cancelled" || record?.status === "discontinued" ? pillTone.block
  : pillTone.muted;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admissions" })}>
            <ArrowLeft className="mr-1 h-4 w-4" />All admissions
          </Button>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Admission workspace</div>
            <div className="text-lg font-semibold">{admissionId}</div>
          </div>
          {readiness?.version && (
            <Badge variant="outline" className="font-mono text-[10px]">v{readiness.version.slice(-6)}</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={refetchAll} disabled={isFetching}>
          <RefreshCw className={cn("mr-1 h-3.5 w-3.5", isFetching && "animate-spin")} />Refresh
        </Button>
      </div>

      {detailQ.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40 lg:col-span-2" />
          <Skeleton className="h-40" />
        </div>
      ) : detailQ.isError || !record ? (
        <Card className="border-rose-400/40 bg-rose-500/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-medium">Admission not found</div>
              <div className="text-xs">
                We could not load <b>{admissionId}</b>. It may have been cancelled or you may not have facility access.
              </div>
              <Link to="/admissions" className="mt-2 inline-block text-xs underline">Back to admissions worklist</Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{record.title || "Admission"}</CardTitle>
                  {record.subtitle && <div className="text-xs text-muted-foreground">{record.subtitle}</div>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide", statusTone)}>
                    {readiness?.state ?? record.status}
                  </Badge>
                  {record.facilityId && (
                    <Badge variant="outline" className="text-[10px]">
                      <Building2 className="mr-1 h-3 w-3" />{record.facilityId}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {readiness && (
                <div className="flex flex-wrap gap-2 border-b pb-3">
                  <ReadinessPill label="Authorisation" value={readiness.authorisationStatus}
                    tone={toneFor(readiness.authorisationStatus)} icon={ShieldAlert} />
                  <ReadinessPill label="Member" value={readiness.memberValidationStatus}
                    tone={toneFor(readiness.memberValidationStatus)} icon={CheckCircle2} />
                  <ReadinessPill label="Billing checks"
                    value={`${readiness.billingChecksStatus}${readiness.blockingChecksCount ? ` · ${readiness.blockingChecksCount} blocking` : readiness.warningChecksCount ? ` · ${readiness.warningChecksCount} warn` : ""}`}
                    tone={readiness.blockingChecksCount ? "block" : toneFor(readiness.billingChecksStatus)}
                    icon={ClipboardCheck} />
                  <ReadinessPill label="Discharge" value={readiness.dischargeReadiness}
                    tone={toneFor(readiness.dischargeReadiness)} icon={LogOut} />
                </div>
              )}
              <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                {fields.length === 0 && <div className="text-muted-foreground">No structured fields captured.</div>}
                {fields.map(([k, v]) => (
                  <div key={k} className="rounded-md border bg-muted/20 p-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
                    <div className="font-medium">{String(v ?? "—") || "—"}</div>
                  </div>
                ))}
                <div className="rounded-md border bg-muted/20 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />Last update
                  </div>
                  <div className="font-medium">{new Date(record.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick actions</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {readinessQ.isLoading
                    ? "Loading available actions from server…"
                    : "Only actions the server has authorised in the current state are enabled."}
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {ACTIONS.map((a) => {
                  const Icon = a.icon;
                  const enabled = readinessQ.isLoading ? false : allowed.has(a.action);
                  const onClick = () => {
                    if (!enabled) return;
                    if (a.kind === "mgmt") setMgmt(a.variant);
                    if (a.kind === "fund") setFund(a.variant);
                    if (a.kind === "fin")  setFin(a.variant);
                    if (a.kind === "dep")  setDep(a.variant);
                  };
                  const destructive = a.destructive;
                  return (
                    <button
                      key={`${a.kind}:${a.variant}`}
                      type="button"
                      onClick={onClick}
                      disabled={!enabled}
                      title={!enabled ? "Not available in the current admission state" : a.hint}
                      className={cn(
                        "group flex items-start gap-3 rounded-lg border p-3 text-left transition",
                        enabled ? "hover:bg-muted/40" : "cursor-not-allowed opacity-50",
                        enabled && destructive && "hover:border-rose-400/50 hover:bg-rose-500/5",
                      )}
                    >
                      <div className={cn(
                        "grid h-9 w-9 place-items-center rounded-md bg-muted/50 text-primary ring-1 ring-border",
                        destructive && "text-rose-600 dark:text-rose-300",
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          {a.label}
                          {!enabled && !readinessQ.isLoading && (
                            <Lock className="h-3 w-3 text-muted-foreground" aria-label="Not available" />
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{a.hint}</div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />Timeline
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  Audit trail from admission wizards, notes and status changes.
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {history.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
                    <CircleDashed className="h-3.5 w-3.5" />No history yet.
                  </div>
                ) : (
                  <ol className="max-h-[520px] divide-y overflow-y-auto">
                    {[...history].reverse().map((h, i) => (
                      <li key={i} className="flex gap-3 p-3 text-xs">
                        <div className="flex flex-col items-center">
                          <span className="grid h-6 w-6 place-items-center rounded-full border bg-background text-[10px] font-semibold text-primary">
                            {history.length - i}
                          </span>
                          {i < history.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div className="font-medium">{h.action}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(h.at).toLocaleString()}
                            </div>
                          </div>
                          {h.note && <div className="mt-0.5 text-muted-foreground">{h.note}</div>}
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" />{h.by}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          {readiness && readiness.blockingChecksCount > 0 && (
            <Card className="border-rose-400/40 bg-rose-500/5">
              <CardContent className="flex items-start gap-3 p-4 text-xs text-rose-700 dark:text-rose-300">
                <CircleAlert className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-medium">Billing checks are blocking finalisation</div>
                  <div>{readiness.blockingChecksCount} blocking · {readiness.warningChecksCount} warnings. Resolve via <b>Billing checks</b> before finalising the bill.</div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AdmissionManagementWizard variant={mgmt} open={!!mgmt} onOpenChange={(v) => !v && setMgmt(null)} onCompleted={invalidate} />
      <AdmissionFundingWizard    variant={fund} open={!!fund} onOpenChange={(v) => !v && setFund(null)} onCompleted={invalidate} />
      <AdmissionFinancialWizard  variant={fin}  open={!!fin}  onOpenChange={(v) => !v && setFin(null)}  onCompleted={invalidate} />
      <AdmissionDepartureWizard  variant={dep}  open={!!dep}  onOpenChange={(v) => !v && setDep(null)}  onCompleted={invalidate}
        initialAdmissionId={admissionId} ifMatchVersion={readiness?.version} />
    </div>
  );
}

export const Route = createFileRoute("/_app/admissions/$admissionId")({
  head: ({ params }) => ({
    meta: [
      { title: `Admission ${params.admissionId} — Impilo` },
      { name: "description", content: `Admission workspace for ${params.admissionId}: readiness pills, available actions and audit timeline.` },
      { property: "og:title", content: `Admission ${params.admissionId} — Impilo` },
      { property: "og:description", content: "Readiness-driven inpatient workspace with server-authorised actions and audit timeline." },
    ],
  }),
  component: AdmissionWorkspaceRoute,
});
