import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  LogOut, LayoutDashboard, UserPlus,
  ArrowRightLeft, Search, ListChecks, LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleWorklist } from "@/components/worklist/module-worklist";
import { AdmissionProcessSelector } from "@/modules/admissions/components/process-selector";
import { AdmissionCreationWizard, type CreationVariant } from "@/modules/admissions/components/creation-wizard";
import { AdmissionManagementWizard, type ManagementVariant } from "@/modules/admissions/components/management-wizard";
import { AdmissionFundingWizard, type FundingVariant } from "@/modules/admissions/components/funding-wizard";
import { AdmissionFinancialWizard, type FinancialVariant } from "@/modules/admissions/components/financial-wizard";
import { AdmissionDepartureWizard, type DepartureVariant } from "@/modules/admissions/components/departure-wizard";
import type { WorklistConfig } from "@/components/worklist/types";
import { PatientBanner } from "@/components/patient-banner";

const worklistConfig: WorklistConfig = {
  moduleKey: "admissions",
  name: "Admissions worklist",
  tagline: "Current inpatients, transfers pending and discharge-ready cases.",
  exportable: true,
  defaultSortBy: "updatedAt",
  defaultSortDir: "desc",
  pageSize: 25,
  statusMap: {
    admitted: { label: "Admitted", tone: "success" },
    pending: { label: "Pending", tone: "warning" },
    transferred: { label: "Transferred", tone: "info" },
    discharged: { label: "Discharged", tone: "muted" },
    cancelled: { label: "Cancelled", tone: "destructive" },
    discontinued: { label: "Discontinued", tone: "destructive" },
  },
  columns: [
    { key: "id", label: "Admission #", sortable: true, width: "140px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient", sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{r.title}</div>
          {r.subtitle && <div className="truncate text-[11px] text-muted-foreground">{r.subtitle}</div>}
        </div>
      ) },
    { key: "Ward", label: "Ward / Bed",
      render: (r) => <span>{String(r.fields["Ward"] ?? r.fields["To Ward"] ?? "—")}{r.fields["Bed"] ? ` · ${r.fields["Bed"]}` : ""}</span> },
    { key: "Admitting practitioner", label: "Practitioner",
      render: (r) => String(r.fields["Admitting practitioner"] ?? r.fields["Practitioner"] ?? "—") },
    { key: "Auth", label: "Auth",
      render: (r) => {
        const auth = String(r.fields["Auth"] ?? r.fields["Authorisation ref"] ?? "").trim();
        if (!auth || auth.toLowerCase() === "none") {
          return <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-600 dark:text-rose-400">No-auth</span>;
        }
        return <span className="font-mono text-[11px]">{auth}</span>;
      } },
    { key: "status", label: "Status",
      render: (r) => {
        const map: Record<string, { label: string; cls: string }> = {
          admitted: { label: "Admitted", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          pending: { label: "Pending", cls: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
          transferred: { label: "Transferred", cls: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
          discharged: { label: "Discharged", cls: "border-border bg-muted/60 text-muted-foreground" },
          cancelled: { label: "Cancelled", cls: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400" },
          discontinued: { label: "Discontinued", cls: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400" },
        };
        const cfg = map[r.status] ?? { label: r.status, cls: "border-border bg-muted/60 text-muted-foreground" };
        return <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium " + cfg.cls}>{cfg.label}</span>;
      } },
    { key: "updatedAt", label: "Updated", sortable: true, defaultVisible: false,
      render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt || r.createdAt).toLocaleString("en-ZA")}</span> },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select", options: [
      { value: "admitted", label: "Admitted" },
      { value: "pending", label: "Pending" },
      { value: "transferred", label: "Transferred" },
      { value: "discharged", label: "Discharged" },
      { value: "cancelled", label: "Cancelled" },
    ] },
    { key: "Ward", label: "Ward", kind: "text", placeholder: "e.g. Ward 3B" },
    { key: "updated", label: "Updated between", kind: "date-range" },
    { key: "noAuthOnly", label: "No-auth flagged only", kind: "boolean" },
  ],
  savedViews: [
    { key: "no-auth", label: "No-auth admissions", description: "All admissions flagged as no-authorisation.",
      filters: { noAuthOnly: true } },
    { key: "discharge-ready", label: "Discharge ready", description: "Admitted cases ready for discharge review.",
      filters: { status: "admitted" } },
    { key: "pending-in", label: "Pending admissions", description: "Preadmissions awaiting bed allocation.",
      filters: { status: "pending" } },
  ],
  rowActions: [
    { key: "open", label: "Open in guided workflow", launchesGuidedWorkflow: true, permission: "view" },
    { key: "transferred", label: "Transfer / move ward", targetStep: "changes", launchesGuidedWorkflow: true, permission: "manage",
      visibleWhen: (r) => r.status === "admitted" },
    { key: "discharged", label: "Discharge patient", targetStep: "discharge", launchesGuidedWorkflow: true, permission: "manage",
      visibleWhen: (r) => r.status === "admitted" },
    { key: "cancelled", label: "Cancel admission", destructive: true, requiresReason: true, permission: "manage",
      visibleWhen: (r) => r.status === "pending" || r.status === "admitted" },
  ],
  bulkActions: [],
};

const CREATION_KEYS = new Set<CreationVariant>(["admit", "convert-pre", "direct-admit", "emergency-admit", "no-auth-admit"]);
const MANAGEMENT_KEYS = new Set<ManagementVariant>(["view-admission", "patient-location", "allocate-bed", "move-ward", "change-practitioner", "register-birth"]);
const FUNDING_KEYS = new Set<FundingVariant>(["capture-auth", "funding-change", "auth-enquiry"]);
const FINANCIAL_KEYS = new Set<FinancialVariant>(["misc-charge", "billing-checks", "finalise-bill"]);
const DEPARTURE_KEYS = new Set<DepartureVariant>(["discharge", "predischarge", "undischarge", "cancel-admission", "discontinue", "amend-admission", "notes-documents"]);

function AdmissionsRoute() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"worklist" | "processes">("worklist");
  const processesRef = useRef<HTMLDivElement>(null);
  const [wizardVariant, setWizardVariant] = useState<CreationVariant | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [mgmtVariant, setMgmtVariant] = useState<ManagementVariant | null>(null);
  const [mgmtOpen, setMgmtOpen] = useState(false);
  const [fundVariant, setFundVariant] = useState<FundingVariant | null>(null);
  const [fundOpen, setFundOpen] = useState(false);
  const [finVariant, setFinVariant] = useState<FinancialVariant | null>(null);
  const [finOpen, setFinOpen] = useState(false);
  const [depVariant, setDepVariant] = useState<DepartureVariant | null>(null);
  const [depOpen, setDepOpen] = useState(false);


  // Aliases for registry keys that map onto an existing wizard variant.
  const FUNDING_ALIASES: Record<string, FundingVariant> = {
    "medical-aid": "funding-change",
  };
  const FINANCIAL_ALIASES: Record<string, FinancialVariant> = {
    "invoices-statements": "finalise-bill",
    "statement-of-account": "finalise-bill",
  };
  // Registry keys that open a saved worklist view instead of a wizard.
  const WORKLIST_VIEWS: Record<string, { savedView?: string; filters?: Record<string, unknown>; label: string }> = {
    "no-auth-board":     { savedView: "no-auth", label: "No-authorisation admissions" },
    "rejected-hospital": { filters: { status: "pending" }, label: "Rejected authorisations — hospital" },
    "rejected-group":    { filters: { status: "pending" }, label: "Rejected authorisations — group" },
    "past-coid":         { filters: { status: "discharged" }, label: "Past COID admissions" },
    "past-injury":       { filters: { status: "discharged" }, label: "Past injury admissions" },
    "past-poisoning":    { filters: { status: "discharged" }, label: "Past poisoning admissions" },
  };

  const launchProcess = (key: string) => {
    if (CREATION_KEYS.has(key as CreationVariant)) { setWizardVariant(key as CreationVariant); setWizardOpen(true); return; }
    if (MANAGEMENT_KEYS.has(key as ManagementVariant)) { setMgmtVariant(key as ManagementVariant); setMgmtOpen(true); return; }
    if (FUNDING_KEYS.has(key as FundingVariant)) { setFundVariant(key as FundingVariant); setFundOpen(true); return; }
    if (FINANCIAL_KEYS.has(key as FinancialVariant)) { setFinVariant(key as FinancialVariant); setFinOpen(true); return; }
    if (DEPARTURE_KEYS.has(key as DepartureVariant)) { setDepVariant(key as DepartureVariant); setDepOpen(true); return; }

    if (key in FUNDING_ALIASES) { setFundVariant(FUNDING_ALIASES[key]); setFundOpen(true); return; }
    if (key in FINANCIAL_ALIASES) { setFinVariant(FINANCIAL_ALIASES[key]); setFinOpen(true); return; }

    if (key === "dashboard") { navigate({ to: "/admissions/dashboard" }); return; }

    if (key in WORKLIST_VIEWS) {
      const view = WORKLIST_VIEWS[key];
      setTab("worklist");
      toast.info(view.label, { description: "Opened in the live worklist." });
      return;
    }

    toast.warning("Process not available", { description: `No handler registered for '${key}'.` });
  };


  return (
    <div className="space-y-6">
      <PatientBanner />
      {/* Header — compact, single row of business priorities */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Clinical · Admissions</div>
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">Admissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live inpatient board. Admit, move and discharge with guided workflows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => { setWizardVariant("admit"); setWizardOpen(true); }}>
            <UserPlus className="h-4 w-4" /> Admit patient
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => launchProcess("move-ward")}>
            <ArrowRightLeft className="h-4 w-4" /> Transfer
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => launchProcess("discharge")}>
            <LogOut className="h-4 w-4" /> Discharge
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to="/admissions/dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
          </Button>
        </div>
      </header>


      {/* Focus tabs — Worklist first (default), Processes on demand */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "worklist" | "processes")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="worklist" className="gap-1.5">
            <ListChecks className="h-4 w-4" /> Live worklist
          </TabsTrigger>
          <TabsTrigger value="processes" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" /> All processes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="worklist" className="space-y-4">
          <ModuleWorklist config={worklistConfig} />
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          <div ref={processesRef} className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
            <AdmissionProcessSelector onLaunch={(process) => launchProcess(process.key)} />
          </div>
        </TabsContent>
      </Tabs>

      <AdmissionCreationWizard variant={wizardVariant} open={wizardOpen} onOpenChange={setWizardOpen} />
      <AdmissionManagementWizard variant={mgmtVariant} open={mgmtOpen} onOpenChange={setMgmtOpen} />
      <AdmissionFundingWizard variant={fundVariant} open={fundOpen} onOpenChange={setFundOpen} />
      <AdmissionFinancialWizard variant={finVariant} open={finOpen} onOpenChange={setFinOpen} />
      <AdmissionDepartureWizard variant={depVariant} open={depOpen} onOpenChange={setDepOpen} />
    </div>
  );
}

// Suppress unused-search warning
void Search;

export const Route = createFileRoute("/_app/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Impilo" },
      { name: "description", content: "Live inpatient worklist with guided admit, transfer and discharge workflows." },
      { property: "og:title", content: "Admissions — Impilo" },
      { property: "og:description", content: "Live inpatient worklist with guided admit, transfer and discharge workflows." },
    ],
  }),
  component: AdmissionsRoute,
});
