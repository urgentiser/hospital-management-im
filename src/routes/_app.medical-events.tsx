import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatusChip, Card } from "@/components/app-shell";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { MOCK_MEDICAL_EVENTS, type MedicalEvent } from "@/lib/mock/medical-events";
import { formatSADateTime } from "@/rules/formatting";

export const Route = createFileRoute("/_app/medical-events")({
  head: () => ({ meta: [{ title: "Medical Events — Impilo" }] }),
  component: MedicalEventsList,
});

function MedicalEventsList() {
  const columns: DataTableColumn<MedicalEvent>[] = [
    { key: "type", header: "Type", sortValue: (r) => r.type, render: (r) => <span className="text-xs">{r.type}</span> },
    { key: "summary", header: "Summary", filterValue: (r) => r.summary, render: (r) => <span className="text-sm">{r.summary}</span> },
    { key: "patient", header: "Patient", filterValue: (r) => r.patientName, render: (r) => (
      <Link to="/patients/$id" params={{ id: r.patientId }} className="text-xs hover:text-primary">{r.patientName}</Link>
    ) },
    { key: "clinician", header: "Clinician", sortValue: (r) => r.clinician, render: (r) => <span className="text-xs">{r.clinician}</span> },
    { key: "facility", header: "Facility", sortValue: (r) => r.facility, render: (r) => <span className="text-xs text-muted-foreground">{r.facility}</span> },
    { key: "at", header: "When", sortValue: (r) => r.at, render: (r) => <span className="text-xs text-muted-foreground">{formatSADateTime(r.at)}</span> },
  ];

  return (
    <>
      <PageHeader eyebrow="Clinical · Medical Events" title="Medical events" description="Observations, prescriptions, procedures, results and clinical notes." />
      <Card className="mb-4 p-3 text-xs text-muted-foreground">{MOCK_MEDICAL_EVENTS.length} events on record</Card>
      <DataTable id="medical-events" columns={columns} rows={MOCK_MEDICAL_EVENTS} rowKey={(e) => e.id} searchPlaceholder="Search events…" />
      <div className="sr-only"><StatusChip status="active" /></div>
    </>
  );
}
