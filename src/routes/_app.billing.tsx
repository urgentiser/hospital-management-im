import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CreditCard, RotateCcw, Undo2, Receipt as ReceiptIcon, FileCheck2 } from "lucide-react";
import { PageHeader, StatusChip, Card } from "@/components/app-shell";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { MOCK_ACCOUNTS, MOCK_PAYMENTS, type AccountSummary } from "@/lib/mock/payments";
import { useAuth } from "@/lib/auth/auth-context";
import { ALL_FACILITIES, FACILITIES } from "@/rules/facilities";
import { formatZAR, formatSADateTime } from "@/rules/formatting";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({
    meta: [
      { title: "Billing & Payments — Impilo" },
      { name: "description", content: "Account summaries, outstanding balances, payments, refunds and reconciliation." },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const { activeFacility } = useAuth();
  const [tab, setTab] = useState<"accounts" | "payments" | "reconciliation">("accounts");

  const scopedAccounts = useMemo(() => MOCK_ACCOUNTS.filter((a) => {
    if (activeFacility === ALL_FACILITIES) return true;
    const name = FACILITIES.find((f) => f.id === activeFacility)?.name;
    return a.facility === name;
  }), [activeFacility]);

  const totalOutstanding = scopedAccounts.reduce((s, a) => s + a.outstanding, 0);
  const totalPaid = scopedAccounts.reduce((s, a) => s + a.paid, 0);
  const totalCharges = scopedAccounts.reduce((s, a) => s + a.totalCharges, 0);

  const accountCols: DataTableColumn<AccountSummary>[] = [
    { key: "account", header: "Account", sortValue: (r) => r.accountId, filterValue: (r) => `${r.accountId} ${r.patientName}`, render: (r) => (
      <div>
        <div className="font-medium">{r.accountId}</div>
        <div className="text-[11px] text-muted-foreground">{r.patientName}</div>
      </div>
    ) },
    { key: "facility", header: "Facility", sortValue: (r) => r.facility, render: (r) => <span className="text-xs">{r.facility}</span> },
    { key: "scheme", header: "Scheme", sortValue: (r) => r.scheme, render: (r) => <span className="text-xs">{r.scheme}</span> },
    { key: "charges", header: "Charges", sortValue: (r) => r.totalCharges, render: (r) => <span className="text-xs">{formatZAR(r.totalCharges)}</span> },
    { key: "paid", header: "Paid", sortValue: (r) => r.paid, render: (r) => <span className="text-xs text-emerald-500">{formatZAR(r.paid)}</span> },
    { key: "outstanding", header: "Outstanding", sortValue: (r) => r.outstanding, render: (r) => <span className={"text-xs font-medium " + (r.outstanding > 0 ? "text-warning" : "text-muted-foreground")}>{formatZAR(r.outstanding)}</span> },
    { key: "activity", header: "Last activity", sortValue: (r) => r.lastActivity, render: (r) => <span className="text-xs text-muted-foreground">{formatSADateTime(r.lastActivity)}</span> },
    { key: "actions", header: "Actions", render: (r) => (
      <div className="flex items-center gap-1">
        <PermissionGate permission="billing:capture-payment">
          <button onClick={() => toast.success("Payment captured", { description: `${r.accountId} — ${formatZAR(r.outstanding || 1500)}` })} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px]">
            <CreditCard className="h-3 w-3" /> Capture
          </button>
        </PermissionGate>
        <PermissionGate permission="billing:refund">
          <button onClick={() => toast.info("Refund initiated")} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px]">
            <RotateCcw className="h-3 w-3" /> Refund
          </button>
        </PermissionGate>
        <PermissionGate permission="billing:reverse">
          <button onClick={() => toast.info("Reversal requested")} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px]">
            <Undo2 className="h-3 w-3" /> Reverse
          </button>
        </PermissionGate>
      </div>
    ) },
  ];

  const paymentCols: DataTableColumn<typeof MOCK_PAYMENTS[number]>[] = [
    { key: "id", header: "Payment", sortValue: (r) => r.id, render: (r) => <span className="text-xs font-mono">{r.id}</span> },
    { key: "account", header: "Account", sortValue: (r) => r.accountId, render: (r) => <span className="text-xs">{r.accountId}</span> },
    { key: "patient", header: "Patient", render: (r) => <span className="text-xs">{r.patientName}</span> },
    { key: "method", header: "Method", sortValue: (r) => r.method, render: (r) => <span className="text-xs">{r.method}</span> },
    { key: "amount", header: "Amount", sortValue: (r) => r.amount, render: (r) => <span className="text-xs">{formatZAR(r.amount)}</span> },
    { key: "ref", header: "Reference", render: (r) => <span className="font-mono text-[11px]">{r.reference}</span> },
    { key: "at", header: "Received", sortValue: (r) => r.receivedAt, render: (r) => <span className="text-xs text-muted-foreground">{formatSADateTime(r.receivedAt)}</span> },
    { key: "state", header: "Status", sortValue: (r) => r.state, render: (r) => <StatusChip status={r.state} /> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Operational · Billing & Payments"
        title="Billing & Payments"
        description="Capture payments, process refunds and reverse transactions with a full reconciliation timeline."
        actions={
          <PermissionGate permission="billing:capture-payment">
            <button onClick={() => toast.success("Payment capture started")} className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow">
              <CreditCard className="h-4 w-4" /> Capture payment
            </button>
          </PermissionGate>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Kpi label="Total charges" value={formatZAR(totalCharges)} />
        <Kpi label="Paid" value={formatZAR(totalPaid)} tone="success" />
        <Kpi label="Outstanding" value={formatZAR(totalOutstanding)} tone="warning" />
      </div>

      <nav className="mb-4 flex items-center gap-1 overflow-x-auto">
        {(["accounts", "payments", "reconciliation"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={"rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize " + (tab === t ? "border-primary/40 bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground")}>{t}</button>
        ))}
      </nav>

      {tab === "accounts" && (
        <DataTable id="accounts" columns={accountCols} rows={scopedAccounts} rowKey={(a) => a.accountId} searchPlaceholder="Search account or patient…" />
      )}
      {tab === "payments" && (
        <DataTable id="payments" columns={paymentCols} rows={MOCK_PAYMENTS} rowKey={(p) => p.id} searchPlaceholder="Search payment ID, account or patient…" />
      )}
      {tab === "reconciliation" && (
        <Card className="p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Reconciliation timeline</div>
          <ol className="relative space-y-4 border-l border-border pl-4 text-sm">
            <TL action="Bank statement imported" by="Finance" at="2026-07-11T07:00:00Z" />
            <TL action={`${MOCK_PAYMENTS.filter((p) => p.state === "cleared").length} payments cleared`} by="Bank Gateway" at="2026-07-11T06:00:00Z" />
            <TL action="2 payments held for review" by="Finance" at="2026-07-10T22:00:00Z" note="Reference mismatch" />
            <TL action="Statement generated" by="Billing" at="2026-07-10T18:00:00Z" />
          </ol>
          <PermissionGate permission="billing:reconcile">
            <button onClick={() => toast.success("Reconciliation complete")} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
              <FileCheck2 className="h-3.5 w-3.5" /> Mark reconciled
            </button>
          </PermissionGate>
        </Card>
      )}
    </>
  );
}

function Kpi({ label, value, tone = "muted" }: { label: string; value: string; tone?: "muted" | "success" | "warning" | "danger" }) {
  const toneClass = { muted: "text-foreground", success: "text-emerald-500", warning: "text-warning", danger: "text-destructive" }[tone];
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={"mt-1 font-display text-2xl " + toneClass}>{value}</div>
    </Card>
  );
}

function TL({ action, by, at, note }: { action: string; by: string; at: string; note?: string }) {
  return (
    <li className="relative">
      <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
      <div className="font-medium">{action}</div>
      <div className="text-xs text-muted-foreground">{by} · {formatSADateTime(at)}{note ? ` — ${note}` : ""}</div>
    </li>
  );
}
