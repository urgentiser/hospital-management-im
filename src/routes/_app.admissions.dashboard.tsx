/**
 * Admissions — Operational Dashboard (Phase I).
 *
 * Live occupancy, length-of-stay distribution, no-authorisation board by
 * facility and discharge-ready pipeline. Reads through the typed admissions
 * service with TanStack Query so it stays in sync with wizard submissions.
 * Exposes a CSV export of the current filtered dataset.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BedDouble, Clock, LogOut, ShieldAlert, Building2, Download, RefreshCw,
  ArrowLeft, Activity, Timer, ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiCard } from "@/components/ui-kit/kpi-card";
import { cn } from "@/lib/utils";
import { admissionsService } from "@/services/modules/admissions.service";
import type { WorkflowItem } from "@/lib/workflow-store";

const HOUR = 1000 * 60 * 60;

function daysBetween(from: string, to = new Date().toISOString()): number {
  const d = (new Date(to).getTime() - new Date(from).getTime()) / (HOUR * 24);
  return Math.max(0, Math.round(d * 10) / 10);
}

function facilityOf(r: WorkflowItem): string {
  return String(r.fields["Facility"] ?? r.facilityId ?? "Unassigned");
}

function toCsv(rows: WorkflowItem[]): string {
  const header = ["Admission", "Patient", "Facility", "Ward", "Bed", "Practitioner", "Auth", "Status", "LOS (days)", "Updated"];
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) => [
    r.id,
    r.title,
    facilityOf(r),
    r.fields["Ward"] ?? r.fields["To Ward"] ?? "",
    r.fields["Bed"] ?? "",
    r.fields["Admitting practitioner"] ?? r.fields["Practitioner"] ?? "",
    r.fields["Auth"] ?? r.fields["Authorisation ref"] ?? "",
    r.status,
    daysBetween(r.createdAt, r.updatedAt || new Date().toISOString()),
    r.updatedAt,
  ].map(escape).join(","));
  return [header.join(","), ...lines].join("\n");
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function AdmissionsDashboardRoute() {
  const [facility, setFacility] = useState<string>("__all");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admissions", "dashboard"],
    queryFn: ({ signal }) => admissionsService.listRecords(
      { page: 1, pageSize: 500, filters: {} },
      signal,
    ),
    staleTime: 15_000,
  });

  const allItems = data?.items ?? [];
  const facilities = useMemo(
    () => Array.from(new Set(allItems.map(facilityOf))).sort(),
    [allItems],
  );
  const items = useMemo(
    () => facility === "__all" ? allItems : allItems.filter((i) => facilityOf(i) === facility),
    [allItems, facility],
  );

  const admitted    = items.filter((i) => i.status === "admitted").length;
  const pending     = items.filter((i) => i.status === "pending").length;
  const discharged  = items.filter((i) => i.status === "discharged").length;
  const cancelled   = items.filter((i) => i.status === "cancelled" || i.status === "discontinued").length;
  const noAuth      = items.filter((i) => String(i.fields["Auth"] ?? "").toLowerCase() === "none").length;

  // Length-of-stay distribution across currently admitted patients
  const losBuckets = useMemo(() => {
    const buckets = [
      { key: "0-1", label: "< 1 day",  count: 0 },
      { key: "1-3", label: "1–3 days", count: 0 },
      { key: "3-7", label: "3–7 days", count: 0 },
      { key: "7-14",label: "7–14 days",count: 0 },
      { key: "14+", label: "14+ days", count: 0 },
    ];
    for (const i of items.filter((x) => x.status === "admitted")) {
      const d = daysBetween(i.createdAt);
      if (d < 1) buckets[0].count++;
      else if (d < 3) buckets[1].count++;
      else if (d < 7) buckets[2].count++;
      else if (d < 14) buckets[3].count++;
      else buckets[4].count++;
    }
    return buckets;
  }, [items]);
  const losMax = Math.max(1, ...losBuckets.map((b) => b.count));

  const byFacility = useMemo(() => {
    const map = new Map<string, { admitted: number; pending: number; noAuth: number; total: number }>();
    for (const i of allItems) {
      const f = facilityOf(i);
      const row = map.get(f) ?? { admitted: 0, pending: 0, noAuth: 0, total: 0 };
      row.total++;
      if (i.status === "admitted") row.admitted++;
      if (i.status === "pending")  row.pending++;
      if (String(i.fields["Auth"] ?? "").toLowerCase() === "none") row.noAuth++;
      map.set(f, row);
    }
    return Array.from(map.entries())
      .map(([facilityName, v]) => ({ facilityName, ...v }))
      .sort((a, b) => b.admitted - a.admitted);
  }, [allItems]);

  const dischargeReady = useMemo(
    () => items
      .filter((i) => i.status === "admitted" && daysBetween(i.createdAt) >= 3)
      .sort((a, b) => daysBetween(b.createdAt) - daysBetween(a.createdAt))
      .slice(0, 8),
    [items],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admissions"><ArrowLeft className="mr-1 h-4 w-4" />Admissions</Link>
          </Button>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Operational dashboard</div>
            <div className="text-lg font-semibold">Live occupancy &amp; discharge pipeline</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={facility} onValueChange={setFacility}>
            <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="All facilities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All facilities</SelectItem>
              {facilities.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-1 h-3.5 w-3.5", isFetching && "animate-spin")} />Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => download(`admissions-${Date.now()}.csv`, toCsv(items))} disabled={!items.length}>
            <Download className="mr-1 h-3.5 w-3.5" />Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Currently admitted" value={admitted} icon={BedDouble} tone="success" hint="Live inpatient census" />
            <KpiCard label="Pending admission" value={pending} icon={Clock} tone="warning" hint="Awaiting bed / readiness" />
            <KpiCard label="No-authorisation" value={noAuth} icon={ShieldAlert} tone="destructive" hint="Requires follow-up" />
            <KpiCard label="Discharged (visible)" value={discharged} icon={LogOut} tone="info" hint={`${cancelled} cancelled or discontinued`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />Length-of-stay distribution
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  Currently admitted patients, bucketed by days since admission.
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {losBuckets.map((b) => (
                  <div key={b.key} className="grid grid-cols-[100px_1fr_40px] items-center gap-3 text-xs">
                    <div className="text-muted-foreground">{b.label}</div>
                    <div className="h-2 rounded-full bg-muted/60">
                      <div
                        className="h-2 rounded-full bg-primary/70 transition-all"
                        style={{ width: `${(b.count / losMax) * 100}%` }}
                      />
                    </div>
                    <div className="text-right font-medium tabular-nums">{b.count}</div>
                  </div>
                ))}
                {admitted === 0 && (
                  <div className="text-xs text-muted-foreground">No admitted patients in the current filter.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />Discharge-ready
                </CardTitle>
                <div className="text-xs text-muted-foreground">Admitted &ge; 3 days — candidates for pre-discharge review.</div>
              </CardHeader>
              <CardContent className="p-0">
                {dischargeReady.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground">Nothing flagged.</div>
                ) : (
                  <ol className="divide-y">
                    {dischargeReady.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                        <Link
                          to="/admissions/$admissionId"
                          params={{ admissionId: r.id }}
                          className="min-w-0 flex-1 truncate font-medium hover:underline"
                        >
                          {r.title}
                        </Link>
                        <Badge variant="outline" className="text-[10px]">{daysBetween(r.createdAt)}d</Badge>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />Facility board
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                Occupancy, pending admissions and no-authorisation counts per facility.
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Facility</th>
                      <th className="px-3 py-2 text-right">Admitted</th>
                      <th className="px-3 py-2 text-right">Pending</th>
                      <th className="px-3 py-2 text-right">No-auth</th>
                      <th className="px-3 py-2 text-right">Total visible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {byFacility.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No admissions loaded.</td></tr>
                    ) : byFacility.map((row) => (
                      <tr key={row.facilityName} className="hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{row.facilityName}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.admitted}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.pending}</td>
                        <td className={cn("px-3 py-2 text-right tabular-nums", row.noAuth > 0 && "text-rose-600 dark:text-rose-400 font-medium")}>{row.noAuth}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Activity className="h-3 w-3" />Auto-refreshes on wizard completion and every manual refresh.
          </div>
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_app/admissions/dashboard")({
  head: () => ({
    meta: [
      { title: "Admissions dashboard — Impilo" },
      { name: "description", content: "Live inpatient occupancy, length-of-stay analytics, no-authorisation board and discharge-ready pipeline." },
      { property: "og:title", content: "Admissions dashboard — Impilo" },
      { property: "og:description", content: "Operational bed-board, LOS analytics and discharge pipeline for every Life Healthcare facility." },
    ],
  }),
  component: AdmissionsDashboardRoute,
});
