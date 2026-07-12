import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, UserPlus, Filter } from "lucide-react";
import { PageHeader, StatusChip } from "@/components/app-shell";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { MOCK_PATIENTS, type MockPatient } from "@/lib/mock/patients";
import { useAuth } from "@/lib/auth/auth-context";
import { ALL_FACILITIES } from "@/rules/facilities";
import { formatSADate, formatRelative } from "@/rules/formatting";

export const Route = createFileRoute("/_app/patients")({
  head: () => ({
    meta: [
      { title: "Patients — Impilo" },
      { name: "description", content: "Searchable and filterable list of patients across facilities." },
    ],
  }),
  component: PatientsList,
});

function PatientsList() {
  const { activeFacility } = useAuth();
  const [scheme, setScheme] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [ageBand, setAgeBand] = useState<string>("");

  const schemes = useMemo(() => Array.from(new Set(MOCK_PATIENTS.map((p) => p.scheme))).sort(), []);

  const scoped = useMemo(() => {
    return MOCK_PATIENTS.filter((p) => {
      if (activeFacility !== ALL_FACILITIES) {
        const idOrName = activeFacility;
        if (p.facility !== idOrName) {
          // scope by facility ID also
          const match = MOCK_PATIENTS.some((x) => x.facility === p.facility);
          if (!match) return false;
        }
      }
      if (scheme && p.scheme !== scheme) return false;
      if (status && p.status !== status) return false;
      if (ageBand === "u30" && p.age >= 30) return false;
      if (ageBand === "30-60" && (p.age < 30 || p.age > 60)) return false;
      if (ageBand === "60+" && p.age <= 60) return false;
      return true;
    });
  }, [activeFacility, scheme, status, ageBand]);

  const columns: DataTableColumn<MockPatient>[] = [
    {
      key: "name", header: "Patient",
      sortValue: (r) => r.lastName + r.firstName,
      filterValue: (r) => `${r.fullName} ${r.mrn} ${r.id}`,
      render: (r) => (
        <Link to="/patients/$id" params={{ id: r.id }} className="group block">
          <div className="font-medium text-foreground group-hover:text-primary">{r.fullName}</div>
          <div className="text-[11px] text-muted-foreground">{r.mrn} · {r.id}</div>
        </Link>
      ),
    },
    { key: "dob", header: "DOB", sortValue: (r) => r.dob, render: (r) => <span className="text-xs">{formatSADate(r.dob)} <span className="text-muted-foreground">({r.age})</span></span> },
    { key: "gender", header: "Sex", sortValue: (r) => r.gender, render: (r) => <span className="text-xs">{r.gender}</span> },
    { key: "scheme", header: "Scheme", sortValue: (r) => r.scheme, filterValue: (r) => r.scheme, render: (r) => <span className="text-xs">{r.scheme}</span> },
    { key: "facility", header: "Facility", sortValue: (r) => r.facility, filterValue: (r) => r.facility, render: (r) => <span className="text-xs text-muted-foreground">{r.facility}</span> },
    { key: "practitioner", header: "Practitioner", sortValue: (r) => r.practitioner, render: (r) => <span className="text-xs">{r.practitioner}</span>, hidden: true },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <StatusChip status={r.status} /> },
    { key: "updatedAt", header: "Updated", sortValue: (r) => r.updatedAt, render: (r) => <span className="text-xs text-muted-foreground">{formatRelative(r.updatedAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Clinical · Patients"
        title="Patients"
        description="Search, filter and register patients across facilities. Facility scope applies to this list."
        actions={
          <PermissionGate permission="patients:create">
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow">
              <UserPlus className="h-4 w-4" /> Register patient
            </button>
          </PermissionGate>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card/50 p-3 text-xs text-muted-foreground">
        <Users className="h-4 w-4 text-primary" />
        <span>{scoped.length} patient{scoped.length === 1 ? "" : "s"} in current scope</span>
      </div>

      <DataTable
        id="patients"
        columns={columns}
        rows={scoped}
        rowKey={(p) => p.id}
        searchPlaceholder="Search by name, MRN or patient ID…"
        toolbarFilters={
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={scheme} onChange={(e) => setScheme(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs">
              <option value="">All schemes</option>
              {schemes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs">
              <option value="">All statuses</option>
              {["active", "pending", "review", "closed", "failed", "discharged"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={ageBand} onChange={(e) => setAgeBand(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs">
              <option value="">Any age</option>
              <option value="u30">Under 30</option>
              <option value="30-60">30–60</option>
              <option value="60+">60+</option>
            </select>
          </div>
        }
      />
    </>
  );
}
