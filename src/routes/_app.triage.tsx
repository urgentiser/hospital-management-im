import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LayoutGrid, ListChecks, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientBanner } from "@/components/patient-banner";
import { useAuth } from "@/security/auth-provider";
import { hasPermission, Permissions } from "@/security/permissions";
import { TriageProcessSelector } from "@/modules/triage/components/process-selector";
import { TriagePatientWizard } from "@/modules/triage/components/triage-patient-wizard";
import { TriageList } from "@/modules/triage/components/triage-list";
import { TriageDetailModal } from "@/modules/triage/components/triage-detail";

type DetailMode = "view" | "attend" | "reassess" | "complete";

function TriageRoute() {
  const { principal } = useAuth();
  const canCreate = hasPermission(principal, Permissions.TriageCreate);

  const [tab, setTab] = useState<"processes" | "list">("processes");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>("view");
  const [listVersion, setListVersion] = useState(0);

  function launch(key: string) {
    switch (key) {
      case "triage-patient":
        if (!canCreate) { toast.error("You do not have permission to triage patients."); return; }
        setWizardOpen(true);
        return;
      case "triage-list":
        setTab("list");
        return;
      default:
        toast.warning("Process not available");
    }
  }

  function openDetail(id: string, mode: DetailMode) {
    setDetailId(id);
    setDetailMode(mode);
  }

  return (
    <div className="space-y-6">
      <PatientBanner />

      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Clinical · Triage
          </div>
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">Triage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register arriving patients, record observations and severity, then attend, reassess and complete triage from the facility list.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => canCreate && setWizardOpen(true)}
            disabled={!canCreate}
            title={canCreate ? "Triage a new patient" : "You do not have permission to triage patients."}
          >
            <Stethoscope className="h-4 w-4" /> Triage Patient
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "processes" | "list")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="processes" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" /> Guided processes
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <ListChecks className="h-4 w-4" /> Triage list
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
            <TriageProcessSelector onLaunch={(p) => launch(p.key)} />
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <TriageList
            key={listVersion}
            onView={(id) => openDetail(id, "view")}
            onAttend={(id) => openDetail(id, "attend")}
            onReassess={(id) => openDetail(id, "reassess")}
            onComplete={(id) => openDetail(id, "complete")}
          />
        </TabsContent>
      </Tabs>

      <TriagePatientWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCompleted={() => setListVersion((v) => v + 1)}
        onView={(rec) => { setWizardOpen(false); openDetail(rec.id, "view"); }}
      />

      <TriageDetailModal
        triageId={detailId}
        mode={detailMode}
        open={detailId !== null}
        onOpenChange={(v) => !v && setDetailId(null)}
        onChanged={() => setListVersion((v) => v + 1)}
      />
    </div>
  );
}

export const Route = createFileRoute("/_app/triage")({
  head: () => ({
    meta: [
      { title: "Triage — Impilo" },
      { name: "description", content: "Register arriving patients, capture observations and severity, then attend, reassess and complete triage from the facility list." },
      { property: "og:title", content: "Triage — Impilo" },
      { property: "og:description", content: "Register arriving patients, capture observations and severity, then attend, reassess and complete triage from the facility list." },
    ],
  }),
  component: TriageRoute,
});
