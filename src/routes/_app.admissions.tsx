import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BedDouble, Plus, Filter } from "lucide-react";
import { PageHeader, StatusChip, Card } from "@/components/app-shell";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { MOCK_ADMISSIONS, type MockAdmission } from "@/lib/mock/admissions";
import { useAuth } from "@/lib/auth/auth-context";
import { ALL_FACILITIES, FACILITIES } from "@/rules/facilities";
import { formatSADateTime, pluralise } from "@/rules/formatting";

export const Route = createFileRoute("/_app/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Impilo" },
      { name: "description", content: "Worklist of active and recent admissions across facilities." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ new: (s.new as string) ?? "" }),
  component: AdmissionsList,
});

function AdmissionsList() {
  const { activeFacility } = useAuth();
  const [state, setState] = useState<string>("");
  const [type, setType] = useState<string>("");

  const rows = useMemo(() => {
    return MOCK_ADMISSIONS.filter((a) => {
      if (activeFacility !== ALL_FACILITIES) {
        const facilityName = FACILITIES.find((f) => f.id === activeFacility)?.name;
        if (facilityName && a.facility !== facilityName) return false;
      }
      if (state && a.state !== state) return false;
      if (type && a.admissionType !== type) return false;
      return true;
    });
  }, [activeFacility, state, type]);

  const columns: DataTableColumn<MockAdmission>[] = [
    {
      key: "id", header: "Admission",
      sortValue: (r) => r.id, filterValue: (r) => `${r.id} ${r.patientName} ${r.mrn}`,
      render: (r) => (
        <Link to="/admissions/$id" params={{ id: r.id }} className="block">
          <div className="font-medium">{r.id}</div>
          <div className="text-[11px] text-muted-foreground">{r.patientName} · {r.mrn}</div>
        </Link>
      ),
    },
    { key: "type", header: "Type", sortValue: (r) => r.admissionType, render: (r) => <span className="text-xs">{r.admissionType}</span> },
    { key: "facility", header: "Facility", sortValue: (r) => r.facility, render: (r) => <span className="text-xs text-muted-foreground">{r.facility}</span> },
    { key: "ward", header: "Ward / Bed", sortValue: (r) => r.ward, render: (r) => <span className="text-xs">{r.ward} · {r.bed}</span> },
    { key: "diagnosis", header: "Diagnosis", filterValue: (r) => r.diagnosis, render: (r) => <span className="text-xs text-muted-foreground">{r.diagnosis}</span> },
    { key: "practitioner", header: "Practitioner", sortValue: (r) => r.practitioner, render: (r) => <span className="text-xs">{r.practitioner}</span>, hidden: true },
    { key: "scheme", header: "Scheme", sortValue: (r) => r.scheme, render: (r) => <span className="text-xs">{r.scheme}</span> },
    { key: "auth", header: "Auth", render: (r) => r.authorisation ? <span className="text-xs">{r.authorisation}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: "los", header: "LOS", sortValue: (r) => r.los, render: (r) => <span className="text-xs">{pluralise(r.los, "day")}</span> },
    { key: "admittedAt", header: "Admitted", sortValue: (r) => r.admittedAt, render: (r) => <span className="text-xs text-muted-foreground">{formatSADateTime(r.admittedAt)}</span> },
    { key: "state", header: "Status", sortValue: (r) => r.state, render: (r) => <StatusChip status={r.state} /> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Clinical · Admissions"
        title="Admissions"
        description="Create, allocate, transfer and discharge admissions with a full event timeline."
        actions={
          <PermissionGate permission="admissions:create">
            <Link to="/admissions/new" className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow">
              <Plus className="h-4 w-4" /> New admission
            </Link>
          </PermissionGate>
        }
      />

      <Card className="mb-4 flex items-center gap-2 p-3 text-xs text-muted-foreground">
        <BedDouble className="h-4 w-4 text-primary" />
        <span>{rows.length} admission{rows.length === 1 ? "" : "s"} in current scope</span>
      </Card>

      <DataTable
        id="admissions"
        columns={columns}
        rows={rows}
        rowKey={(a) => a.id}
        searchPlaceholder="Search by ID, patient or diagnosis…"
        toolbarFilters={
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={state} onChange={(e) => setState(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs">
              <option value="">All states</option>
              {["admitted", "bed-allocated", "in-theatre", "transferred", "discharged", "cancelled", "draft"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs">
              <option value="">All types</option>
              {["Elective", "Emergency", "Maternity", "Day Case", "Transfer"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        }
      />
    </>
  );
}
