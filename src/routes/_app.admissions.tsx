import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { admissions } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Impilo" },
      { name: "description", content: "Manage active, discharged and transferred admissions." },
    ],
  }),
  component: AdmissionsPage,
});

function AdmissionsPage() {
  const active = admissions.filter((a) => a.status === "admitted").length;
  const discharged = admissions.filter((a) => a.status === "discharged").length;
  const transferred = admissions.filter((a) => a.status === "transferred").length;
  return (
    <>
      <PageHeader
        eyebrow="Clinical · Admissions Service"
        title="Admissions"
        description="Real-time bed movements, admissions, transfers, and discharges across all facilities."
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-90">
            <Plus className="h-4 w-4" /> New admission
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Currently admitted", value: active },
          { label: "Discharged (7d)", value: discharged },
          { label: "Transferred (7d)", value: transferred },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-2 font-display text-4xl tracking-tight">{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Ref</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Facility</th>
                <th className="px-5 py-3 font-medium">Ward / Bed</th>
                <th className="px-5 py-3 font-medium">Admitted</th>
                <th className="px-5 py-3 font-medium">LOS</th>
                <th className="px-5 py-3 font-medium">Practitioner</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {admissions.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-mono text-xs">{a.id}</td>
                  <td className="px-5 py-3">
                    <div>{a.patient}</div>
                    <div className="text-[11px] text-muted-foreground">{a.mrn}</div>
                  </td>
                  <td className="px-5 py-3">{a.facility}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {a.ward} · Bed {a.bed}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{a.admittedAt}</td>
                  <td className="px-5 py-3">{a.los}d</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.practitioner}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
