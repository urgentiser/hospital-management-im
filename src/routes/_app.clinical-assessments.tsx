import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardList, Eye, LayoutGrid, ListChecks, PlayCircle, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleWorklist } from "@/components/worklist/module-worklist";
import type { WorklistConfig } from "@/components/worklist/types";
import { PatientBanner } from "@/components/patient-banner";
import { ClinicalAssessmentProcessSelector } from "@/modules/clinical-assessments/components/process-selector";
import { AssessmentJourneyWizard } from "@/modules/clinical-assessments/components/assessment-journey-wizard";
import { ViewAssessmentWizard } from "@/modules/clinical-assessments/components/view-assessment-wizard";
import { AssessmentDetailModal } from "@/modules/clinical-assessments/components/assessment-detail";

const worklistConfig: WorklistConfig = {
  moduleKey: "clinical-assessments",
  name: "Clinical assessments worklist",
  tagline: "Assessments in progress, awaiting completion or recently completed.",
  exportable: true,
  defaultSortBy: "updatedAt",
  defaultSortDir: "desc",
  pageSize: 25,
  statusMap: {
    Draft: { label: "Draft", tone: "muted" },
    InProgress: { label: "In progress", tone: "info" },
    Incomplete: { label: "Incomplete", tone: "warning" },
    Completed: { label: "Completed", tone: "success" },
    Corrected: { label: "Corrected", tone: "primary" },
    Cancelled: { label: "Cancelled", tone: "destructive" },
    AwaitingCountersignature: { label: "Awaiting sign-off", tone: "warning" },
  },
  columns: [
    { key: "id", label: "Assessment #", sortable: true, width: "150px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient", sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{r.title}</div>
          {r.subtitle && <div className="truncate text-[11px] text-muted-foreground">{r.subtitle}</div>}
        </div>
      ) },
    { key: "Type", label: "Type", render: (r) => String(r.fields["Type"] ?? "—") },
    { key: "Assessor", label: "Assessor", render: (r) => String(r.fields["Assessor"] ?? "—") },
    { key: "Facility", label: "Facility", render: (r) => String(r.fields["Facility"] ?? "—") },
    { key: "status", label: "State", render: (r) => <span className="font-medium">{r.status}</span> },
    { key: "updatedAt", label: "Updated", sortable: true, defaultVisible: false,
      render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt || r.createdAt).toLocaleString("en-ZA")}</span> },
  ],
  filters: [
    { key: "status", label: "State", kind: "select", options: [
      { value: "Draft", label: "Draft" },
      { value: "InProgress", label: "In progress" },
      { value: "Incomplete", label: "Incomplete" },
      { value: "Completed", label: "Completed" },
      { value: "Corrected", label: "Corrected" },
      { value: "Cancelled", label: "Cancelled" },
    ] },
    { key: "Type", label: "Assessment type", kind: "text", placeholder: "e.g. Pre-op" },
    { key: "updated", label: "Updated between", kind: "date-range" },
  ],
  savedViews: [
    { key: "in-progress", label: "In progress", description: "Assessments currently being captured.", filters: { status: "InProgress" } },
    { key: "drafts", label: "Draft only", description: "Draft assessments awaiting capture.", filters: { status: "Draft" } },
  ],
  rowActions: [
    { key: "open", label: "Open assessment", permission: "view" },
  ],
  bulkActions: [],
};

function ClinicalAssessmentsRoute() {
  const [tab, setTab] = useState<"processes" | "worklist">("processes");
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const launch = useMemo(() => (key: string) => {
    switch (key) {
      case "assess-patient":
      case "continue-assessment":
      case "link-preadmission":
      case "replace-patient":
      case "save-draft-exit":
      case "validate-assessment":
      case "complete-assessment":
        setJourneyOpen(true);
        return;
      case "view-assessment":
      case "search-assessments":
      case "view-clinical-record":
      case "assessment-history":
      case "correct-reopen":
      case "print-clinical-record":
        setViewOpen(true);
        return;
      default:
        toast.warning("Process not available", { description: `No handler registered for '${key}'.` });
    }
  }, []);

  return (
    <div className="space-y-6">
      <PatientBanner />
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Patient Care · Clinical Assessments
          </div>
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">Clinical assessments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Launch a guided clinical assessment or open the assessment browser.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => { setJourneyOpen(true); }}>
            <PlayCircle className="h-4 w-4" /> Assess patient
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setViewOpen(true)}>
            <Eye className="h-4 w-4" /> View assessment
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "processes" | "worklist")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="processes" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" /> Guided processes
          </TabsTrigger>
          <TabsTrigger value="worklist" className="gap-1.5">
            <ListChecks className="h-4 w-4" /> View assessments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
            <ClinicalAssessmentProcessSelector onLaunch={(p) => launch(p.key)} />
          </div>
        </TabsContent>

        <TabsContent value="worklist" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Use the full assessment browser for date, number and patient searches.
            </span>
            <Button size="sm" variant="outline" onClick={() => setViewOpen(true)}>
              <Search className="mr-1 h-3.5 w-3.5" /> Open assessment browser
            </Button>
          </div>
          <ModuleWorklist config={worklistConfig} />
        </TabsContent>
      </Tabs>

      <AssessmentJourneyWizard
        open={journeyOpen}
        onOpenChange={setJourneyOpen}
        onView={(rec) => { setDetailId(rec.id); setJourneyOpen(false); }}
      />
      <ViewAssessmentWizard open={viewOpen} onOpenChange={setViewOpen} />
      <AssessmentDetailModal
        assessmentId={detailId}
        open={detailId !== null}
        onOpenChange={(v) => !v && setDetailId(null)}
      />
    </div>
  );
}

export const Route = createFileRoute("/_app/clinical-assessments")({
  head: () => ({
    meta: [
      { title: "Clinical assessments — Impilo" },
      { name: "description", content: "Guided clinical assessments with structured capture, validation and completion." },
      { property: "og:title", content: "Clinical assessments — Impilo" },
      { property: "og:description", content: "Guided clinical assessments with structured capture, validation and completion." },
    ],
  }),
  component: ClinicalAssessmentsRoute,
});
