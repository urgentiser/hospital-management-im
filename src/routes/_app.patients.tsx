import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, StatusChip } from "@/components/app-shell";
import { patients } from "@/lib/mock-data";
import { Filter, Plus, Download } from "lucide-react";

export const Route = createFileRoute("/_app/patients")({
  head: () => ({
    meta: [
      { title: "Patients — Impilo" },
      { name: "description", content: "Unified patient index across facilities and schemes." },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Clinical · Patient Service"
        title="Patients"
        description="Search, review, and manage patient records across every facility. Data sourced via patient BFF."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm hover:bg-card">
              <Filter className="h-4 w-4 text-muted-foreground" /> Filters
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm hover:bg-card">
              <Download className="h-4 w-4 text-muted-foreground" /> Export
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-90">
              <Plus className="h-4 w-4" /> New patient
            </button>
          </>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">MRN</th>
                <th className="px-5 py-3 font-medium">Scheme</th>
                <th className="px-5 py-3 font-medium">Facility</th>
                <th className="px-5 py-3 font-medium">Practitioner</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xs font-medium">
                        {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.gender} · {p.dob}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{p.mrn}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.scheme}</td>
                  <td className="px-5 py-3">{p.facility}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.practitioner}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={p.status} />
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{p.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
