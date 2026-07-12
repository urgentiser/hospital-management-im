import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Radio, RotateCcw, PlayCircle, EyeOff, Download, Search as SearchIcon,
  ClipboardCheck, ChevronRight, ShieldAlert,
} from "lucide-react";
import { Card, StatusChip } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkflowItem } from "@/lib/workflow-store";

type RetryEntry = { attempt: number; at: string; result: string; note?: string };
type TimelineEntry = { at: string; hop: string; outcome: string };

function parseJson<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string" || !v) return fallback;
  try { return JSON.parse(v) as T; } catch { return fallback; }
}

export function IntegrationsDetailTable({ items }: { items: WorkflowItem[] }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return items
      .filter((i) => String(i.fields["Kind"] ?? "") === "Event" || !!i.fields["Message type"])
      .filter((i) => {
        if (!q) return true;
        const hay = [
          i.title, i.subtitle ?? "", i.id,
          String(i.fields["Queue"] ?? ""), String(i.fields["Message type"] ?? ""),
          String(i.fields["Entity ID"] ?? ""), String(i.fields["Correlation"] ?? ""),
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
  }, [items, query]);

  const active = rows.find((r) => r.id === openId) ?? rows[0] ?? null;

  const doAction = (label: string) =>
    toast.success(`${label} queued`, { description: active ? `${active.id} · ${active.title}` : undefined });

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Service bus</div>
            <div className="font-display text-base font-semibold">Message detail</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5">
          <SearchIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Queue · type · entity · correlation…"
            className="h-7 w-64 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Reference</th>
                  <th className="px-3 py-2 text-left font-medium">Queue · Subscription</th>
                  <th className="px-3 py-2 text-left font-medium">Message type</th>
                  <th className="px-3 py-2 text-left font-medium">Source → Target</th>
                  <th className="px-3 py-2 text-left font-medium">Entity</th>
                  <th className="px-3 py-2 text-right font-medium">Attempts</th>
                  <th className="px-3 py-2 text-right font-medium">Latency</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      No messages match your search.
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const isActive = active?.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setOpenId(r.id)}
                      className={
                        "cursor-pointer transition-colors " +
                        (isActive ? "bg-primary/5" : "hover:bg-muted/30")
                      }
                    >
                      <td className="px-3 py-2 font-mono text-[11px] text-foreground">
                        <div>{r.id}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{String(r.fields["Correlation"] ?? "")}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="truncate font-medium">{String(r.fields["Queue"] ?? "—")}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{String(r.fields["Subscription"] ?? "—")}</div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px]">{String(r.fields["Message type"] ?? r.title)}</td>
                      <td className="px-3 py-2">
                        <span className="text-foreground">{String(r.fields["Source"] ?? "—")}</span>
                        <ChevronRight className="mx-1 inline h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground">{String(r.fields["Target"] ?? "—")}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div>{String(r.fields["Entity"] ?? "—")}</div>
                        <div className="text-[10px] text-muted-foreground">{String(r.fields["Entity ID"] ?? "")}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{String(r.fields["Attempts"] ?? 0)}</td>
                      <td className="px-3 py-2 text-right font-mono">{String(r.fields["Latency (ms)"] ?? 0)}ms</td>
                      <td className="px-3 py-2"><StatusChip status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <Card className="border-primary/20 bg-background/60 p-4">
          {!active ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Select a message to inspect.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-mono text-[11px] text-muted-foreground">{active.id} · {String(active.fields["Correlation"] ?? "")}</div>
                  <div className="mt-0.5 truncate font-display text-sm font-semibold">{String(active.fields["Message type"] ?? active.title)}</div>
                </div>
                <StatusChip status={active.status} />
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                <DlRow label="Queue" value={String(active.fields["Queue"] ?? "—")} mono />
                <DlRow label="Subscription" value={String(active.fields["Subscription"] ?? "—")} mono />
                <DlRow label="Source" value={String(active.fields["Source"] ?? "—")} />
                <DlRow label="Target" value={String(active.fields["Target"] ?? "—")} />
                <DlRow label="Entity" value={`${String(active.fields["Entity"] ?? "—")} · ${String(active.fields["Entity ID"] ?? "")}`} />
                <DlRow label="Enqueued" value={String(active.fields["Enqueued"] ?? "—")} mono />
                <DlRow label="Processed" value={String(active.fields["Processed"] ?? "—")} mono />
                <DlRow label="Attempts" value={String(active.fields["Attempts"] ?? 0)} />
              </dl>

              {String(active.fields["Error code"] ?? "") && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                    <ShieldAlert className="h-3 w-3" /> Error
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-destructive">{String(active.fields["Error code"])}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{String(active.fields["Error message"] ?? "")}</div>
                </div>
              )}

              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Retry history</div>
                <ul className="space-y-1">
                  {parseJson<RetryEntry[]>(active.fields["Retry log"], []).map((r) => (
                    <li key={r.attempt} className="flex items-center gap-2 text-[11px]">
                      <span className="inline-flex h-4 w-6 items-center justify-center rounded border border-border bg-muted/40 font-mono text-[10px]">#{r.attempt}</span>
                      <span className="font-mono text-muted-foreground">{r.at}</span>
                      <StatusChip status={r.result} />
                      {r.note && <span className="truncate text-muted-foreground">· {r.note}</span>}
                    </li>
                  ))}
                  {parseJson<RetryEntry[]>(active.fields["Retry log"], []).length === 0 && (
                    <li className="text-[11px] text-muted-foreground">No retries recorded.</li>
                  )}
                </ul>
              </div>

              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Processing timeline</div>
                <ol className="relative space-y-1.5 border-l border-border pl-3">
                  {parseJson<TimelineEntry[]>(active.fields["Timeline"], []).map((t, i) => (
                    <li key={i} className="text-[11px]">
                      <span className="absolute -left-[5px] mt-1 h-2 w-2 rounded-full bg-primary" />
                      <span className="font-mono text-muted-foreground">{t.at}</span>
                      <span className="mx-1.5 rounded border border-border bg-muted/40 px-1 py-px font-mono text-[10px]">{t.hop}</span>
                      <span className="text-foreground">{t.outcome}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                <Button size="sm" variant="outline" onClick={() => doAction("Review")}>
                  <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Review
                </Button>
                <Button size="sm" variant="outline" onClick={() => doAction("Retry")}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Retry
                </Button>
                <Button size="sm" variant="outline" onClick={() => doAction("Replay")}>
                  <PlayCircle className="mr-1 h-3.5 w-3.5" /> Replay
                </Button>
                <Button size="sm" variant="outline" onClick={() => doAction("Ignore")}>
                  <EyeOff className="mr-1 h-3.5 w-3.5" /> Ignore
                </Button>
                <Button size="sm" variant="outline" onClick={() => doAction("Download error")}>
                  <Download className="mr-1 h-3.5 w-3.5" /> Download error
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Card>
  );
}

function DlRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={"truncate text-right text-foreground " + (mono ? "font-mono" : "")}>{value}</dd>
    </>
  );
}
