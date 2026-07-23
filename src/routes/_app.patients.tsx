import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Eye, LayoutGrid, ListChecks, Printer, Search, UserPlus, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleWorklist } from "@/components/worklist/module-worklist";
import type { WorklistConfig } from "@/components/worklist/types";
import { PatientBanner } from "@/components/patient-banner";
import { PatientMaintenanceProcessSelector } from "@/modules/patient-maintenance/components/process-selector";
import { RegisterPatientWizard } from "@/modules/patient-maintenance/components/register-patient-wizard";
import { UpdateContactWizard } from "@/modules/patient-maintenance/components/update-contact-wizard";
import { PastDocumentsWizard } from "@/modules/patient-maintenance/components/past-documents-wizard";
import { PatientProfileModal } from "@/modules/patient-maintenance/components/patient-profile";
import { PatientBrowserModal } from "@/modules/patient-maintenance/components/patient-browser";

const worklistConfig: WorklistConfig = {
  moduleKey: "patients",
  name: "Patient maintenance worklist",
  tagline: "Registrations, contact updates and document reprints tracked against this facility.",
  exportable: true,
  defaultSortBy: "updatedAt",
  defaultSortDir: "desc",
  pageSize: 25,
  statusMap: {
    active: { label: "Active", tone: "success" },
    pending: { label: "Pending", tone: "warning" },
    invited: { label: "Invited", tone: "info" },
    inactive: { label: "Inactive", tone: "muted" },
  },
  columns: [
    { key: "id", label: "Reference", sortable: true, width: "150px",
      render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "title", label: "Patient / activity", sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{r.title}</div>
          {r.subtitle && <div className="truncate text-[11px] text-muted-foreground">{r.subtitle}</div>}
        </div>
      ) },
    { key: "kind", label: "Action", render: (r) => <span className="text-xs">{r.kind}</span> },
    { key: "Facility", label: "Facility", render: (r) => String(r.fields["Facility"] ?? r.fields["facility"] ?? "—") },
    { key: "status", label: "Status", render: (r) => <span className="font-medium capitalize">{r.status}</span> },
    { key: "updatedAt", label: "Updated", sortable: true,
      render: (r) => <span className="text-[11px] text-muted-foreground">{new Date(r.updatedAt || r.createdAt).toLocaleString("en-ZA")}</span> },
  ],
  filters: [
    { key: "status", label: "Status", kind: "select", options: [
      { value: "active", label: "Active" },
      { value: "pending", label: "Pending" },
      { value: "invited", label: "Invited" },
      { value: "inactive", label: "Inactive" },
    ] },
    { key: "kind", label: "Action", kind: "text", placeholder: "e.g. Register Patient" },
    { key: "updated", label: "Updated between", kind: "date-range" },
  ],
  savedViews: [
    { key: "recent-registrations", label: "Recent registrations", description: "Newly registered patients.", filters: { kind: "Register Patient" } },
    { key: "contact-updates", label: "Contact updates", description: "Contact-detail changes.", filters: { kind: "Update Contact Details" } },
  ],
  rowActions: [{ key: "open", label: "Open activity", permission: "view" }],
  bulkActions: [],
};

function PatientMaintenanceRoute() {
  const [tab, setTab] = useState<"processes" | "worklist">("processes");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [contactPatientId, setContactPatientId] = useState<string | null>(null);
  const [printPatientId, setPrintPatientId] = useState<string | null>(null);

  const openProfile = (id: string) => { setBrowserOpen(false); setProfileId(id); };
  const openContact = (id: string | null) => { setContactPatientId(id); setContactOpen(true); };
  const openPrint = (id: string | null) => { setPrintPatientId(id); setPrintOpen(true); };

  const launch = useMemo(() => (key: string) => {
    switch (key) {
      case "register-patient":
        setRegisterOpen(true); return;
      case "search-patient":
      case "view-profile":
      case "view-document-history":
      case "resolve-duplicate":
        setBrowserOpen(true); return;
      case "update-contact":
        openContact(null); return;
      case "print-past-documents":
        openPrint(null); return;
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
            Front Office · Patient Maintenance
          </div>
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">Patient maintenance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register patients, keep demographics and contact details current, and reprint historic documents.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => setRegisterOpen(true)}>
            <UserPlus className="h-4 w-4" /> Register patient
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setBrowserOpen(true)}>
            <Search className="h-4 w-4" /> Search patient
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openContact(null)}>
            <Users className="h-4 w-4" /> Update contact
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openPrint(null)}>
            <Printer className="h-4 w-4" /> Print documents
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "processes" | "worklist")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="processes" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" /> Guided processes
          </TabsTrigger>
          <TabsTrigger value="worklist" className="gap-1.5">
            <ListChecks className="h-4 w-4" /> Activity worklist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
            <PatientMaintenanceProcessSelector onLaunch={(p) => launch(p.key)} />
          </div>
        </TabsContent>

        <TabsContent value="worklist" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Use the patient directory for name, MRN and identifier searches.
            </span>
            <Button size="sm" variant="outline" onClick={() => setBrowserOpen(true)}>
              <Search className="mr-1 h-3.5 w-3.5" /> Open patient directory
            </Button>
          </div>
          <ModuleWorklist config={worklistConfig} />
        </TabsContent>
      </Tabs>

      <RegisterPatientWizard
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onOpenProfile={(id) => setProfileId(id)}
      />
      <UpdateContactWizard
        open={contactOpen}
        onOpenChange={(v) => { setContactOpen(v); if (!v) setContactPatientId(null); }}
        initialPatientId={contactPatientId}
      />
      <PastDocumentsWizard
        open={printOpen}
        onOpenChange={(v) => { setPrintOpen(v); if (!v) setPrintPatientId(null); }}
        initialPatientId={printPatientId}
      />
      <PatientBrowserModal
        open={browserOpen}
        onOpenChange={setBrowserOpen}
        onOpenPatient={openProfile}
      />
      <PatientProfileModal
        patientId={profileId}
        open={profileId !== null}
        onOpenChange={(v) => !v && setProfileId(null)}
        onUpdateContact={(id) => { setProfileId(null); openContact(id); }}
        onPrintDocuments={(id) => { setProfileId(null); openPrint(id); }}
      />
    </div>
  );
}

export const Route = createFileRoute("/_app/patients")({
  head: () => ({
    meta: [
      { title: "Patient Maintenance — Impilo" },
      { name: "description", content: "Register patients, keep records current and reprint documents in a guided, mock-driven workspace." },
      { property: "og:title", content: "Patient Maintenance — Impilo" },
      { property: "og:description", content: "Register patients, keep records current and reprint documents in a guided, mock-driven workspace." },
    ],
  }),
  component: PatientMaintenanceRoute,
});
