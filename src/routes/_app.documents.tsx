import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, ShieldCheck, Archive, Download, FileText, AlertTriangle } from "lucide-react";
import { PageHeader, StatusChip, Card } from "@/components/app-shell";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { MOCK_DOCUMENTS, type DocumentRecord } from "@/lib/mock/documents";
import { documentUploadSchema } from "@/rules/schemas";
import { formatSADateTime } from "@/rules/formatting";

export const Route = createFileRoute("/_app/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Impilo" },
      { name: "description", content: "Upload, preview and archive patient and operational documents." },
    ],
  }),
  component: DocumentsPage,
});

function humanSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function DocumentsPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [preview, setPreview] = useState<DocumentRecord | null>(null);

  const rows = category ? MOCK_DOCUMENTS.filter((d) => d.category === category) : MOCK_DOCUMENTS;

  const handleFile = async (file: File) => {
    const parsed = documentUploadSchema.safeParse({
      patientId: "P-10241",
      category: "Other",
      fileName: file.name,
      sizeBytes: file.size,
      mime: file.type || "application/octet-stream",
    });
    if (!parsed.success) {
      toast.error("Upload rejected", { description: parsed.error.issues[0]?.message ?? "Invalid file" });
      return;
    }
    setProgress(0);
    for (let i = 1; i <= 10; i++) {
      await new Promise((r) => setTimeout(r, 60));
      setProgress(i * 10);
    }
    toast.success("Uploaded", { description: `${file.name} · scanning for viruses…` });
    setTimeout(() => toast.success("Scan clean", { description: file.name }), 900);
  };

  const columns: DataTableColumn<DocumentRecord>[] = [
    { key: "file", header: "File", sortValue: (r) => r.fileName, filterValue: (r) => `${r.fileName} ${r.patientName}`, render: (r) => (
      <button onClick={() => setPreview(r)} className="flex items-center gap-2 text-left">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{r.fileName}</div>
          <div className="text-[11px] text-muted-foreground">{r.patientName}</div>
        </div>
      </button>
    ) },
    { key: "category", header: "Category", sortValue: (r) => r.category, render: (r) => <span className="text-xs">{r.category}</span> },
    { key: "size", header: "Size", sortValue: (r) => r.sizeBytes, render: (r) => <span className="text-xs">{humanSize(r.sizeBytes)}</span> },
    { key: "facility", header: "Facility", sortValue: (r) => r.facility, render: (r) => <span className="text-xs text-muted-foreground">{r.facility}</span> },
    { key: "state", header: "Status", sortValue: (r) => r.state, render: (r) => (
      <div>
        <StatusChip status={r.state} />
        {r.rejectionReason && <div className="mt-1 flex items-center gap-1 text-[10px] text-destructive"><AlertTriangle className="h-3 w-3" />{r.rejectionReason}</div>}
      </div>
    ) },
    { key: "uploaded", header: "Uploaded", sortValue: (r) => r.uploadedAt, render: (r) => <span className="text-xs text-muted-foreground">{formatSADateTime(r.uploadedAt)}</span> },
    { key: "actions", header: "Actions", render: (r) => (
      <div className="flex items-center gap-1">
        <PermissionGate permission="documents:download">
          <button onClick={() => toast.success("Downloading…", { description: r.fileName })} className="rounded-md border border-border p-1"><Download className="h-3 w-3" /></button>
        </PermissionGate>
        <PermissionGate permission="documents:archive">
          <button onClick={() => toast.info("Archived", { description: r.fileName })} className="rounded-md border border-border p-1"><Archive className="h-3 w-3" /></button>
        </PermissionGate>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Operational · Documents"
        title="Documents"
        description="Upload with validation, virus scanning, categorisation and archival."
        actions={
          <PermissionGate permission="documents:upload">
            <button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow">
              <UploadCloud className="h-4 w-4" /> Upload document
            </button>
          </PermissionGate>
        }
      />

      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        className="hidden"
      />

      {progress > 0 && progress < 100 && (
        <Card className="mb-4 p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span>Uploading…</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div style={{ width: `${progress}%` }} className="h-full bg-primary transition-all" /></div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="h-3 w-3" /> File will be scanned before it becomes available.</div>
        </Card>
      )}

      <DataTable
        id="documents"
        columns={columns}
        rows={rows}
        rowKey={(d) => d.id}
        searchPlaceholder="Search by file name, patient or category…"
        toolbarFilters={
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs">
            <option value="">All categories</option>
            {["Consent", "Discharge Summary", "Pathology", "Radiology", "Referral", "Invoice", "Authorisation", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        }
      />

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{preview.category}</div>
                <div className="font-medium">{preview.fileName}</div>
              </div>
              <StatusChip status={preview.state} />
            </div>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
              Preview placeholder ({preview.mime})
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              Uploaded by {preview.uploadedBy} · {formatSADateTime(preview.uploadedAt)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
