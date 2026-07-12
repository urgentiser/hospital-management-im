import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { PageHeader, Card } from "@/components/app-shell";
import { MOCK_NOTIFICATIONS, type Notification } from "@/lib/mock/notifications";
import { formatRelative } from "@/rules/formatting";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Impilo" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [category, setCategory] = useState<string>("");

  const filtered = category ? items.filter((i) => i.category === category) : items;
  const unread = items.filter((i) => !i.read).length;

  return (
    <>
      <PageHeader
        eyebrow="Overview · Notifications"
        title="Notifications"
        description={`${unread} unread notification${unread === 1 ? "" : "s"}.`}
        actions={
          <button onClick={() => setItems(items.map((i) => ({ ...i, read: true })))} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3 text-xs">
        <Bell className="h-4 w-4 text-primary" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs">
          <option value="">All categories</option>
          {["Clinical", "Operational", "System", "Billing", "Security"].map((c) => <option key={c}>{c}</option>)}
        </select>
      </Card>

      <Card className="divide-y divide-border">
        {filtered.map((n) => (
          <button
            key={n.id}
            onClick={() => setItems(items.map((i) => i.id === n.id ? { ...i, read: true } : i))}
            className={"flex w-full items-start gap-3 p-4 text-left hover:bg-muted/40 " + (n.read ? "opacity-70" : "")}
          >
            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            <div className={"flex-1 " + (n.read ? "" : "font-medium")}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.category}</span>
                <span className="text-sm">{n.title}</span>
              </div>
              <div className="text-xs text-muted-foreground">{n.body}</div>
            </div>
            <div className="shrink-0 text-[11px] text-muted-foreground">{formatRelative(n.createdAt)}</div>
          </button>
        ))}
      </Card>
    </>
  );
}
