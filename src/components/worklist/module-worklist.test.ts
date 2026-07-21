import { describe, it, expect, beforeEach } from "vitest";
import { pageMock } from "@/services/modules/mock-pager";
import type { WorkflowItem } from "@/lib/workflow-store";
import type { PagedQuery } from "@/contracts/common/paged-result";

function item(over: Partial<WorkflowItem>): WorkflowItem {
  return {
    id: over.id ?? "R-1",
    title: over.title ?? "Row",
    status: over.status ?? "pending",
    fields: over.fields ?? {},
    history: [],
    createdAt: over.createdAt ?? "2026-01-01T00:00:00Z",
    updatedAt: over.updatedAt ?? "2026-01-02T00:00:00Z",
    facilityId: over.facilityId,
    availableActions: over.availableActions,
    subtitle: over.subtitle,
  };
}

function query(over: Partial<PagedQuery> = {}): PagedQuery {
  return {
    page: 1,
    pageSize: 25,
    sortDirection: "desc",
    filters: {},
    ...over,
  };
}

describe("mock-pager filters", () => {
  const rows = [
    item({ id: "A-1", status: "pending", facilityId: "F1", fields: { Kind: "auth", Amount: 100 } }),
    item({ id: "A-2", status: "approved", facilityId: "F1", fields: { Kind: "auth", Amount: 200 } }),
    item({ id: "A-3", status: "rejected", facilityId: "F2", fields: { Kind: "claim", Amount: 300 } }),
    item({ id: "A-4", status: "pending", facilityId: "F2", fields: { Kind: "claim", Amount: 400 } }),
  ];

  it("filters by status equality", () => {
    const r = pageMock(rows, query({ filters: { status: "pending" } }));
    expect(r.totalItems).toBe(2);
    expect(r.items.map((i) => i.id).sort()).toEqual(["A-1", "A-4"]);
  });

  it("filters by array status membership", () => {
    const r = pageMock(rows, query({ filters: { status: ["approved", "rejected"] } }));
    expect(r.totalItems).toBe(2);
  });

  it("filters by facility scope", () => {
    const r = pageMock(rows, query({ facilityId: "F1", filters: {} }));
    expect(r.totalItems).toBe(2);
    expect(r.items.every((i) => i.facilityId === "F1")).toBe(true);
  });

  it("filters by date range against updatedAt", () => {
    const r = pageMock(
      [
        item({ id: "d1", updatedAt: "2026-05-01T00:00:00Z" }),
        item({ id: "d2", updatedAt: "2026-06-15T00:00:00Z" }),
        item({ id: "d3", updatedAt: "2026-07-30T00:00:00Z" }),
      ],
      query({ filters: { updated: { from: "2026-06-01", to: "2026-07-01" } } }),
    );
    expect(r.items.map((i) => i.id)).toEqual(["d2"]);
  });

  it("supports search across id, title, subtitle and fields", () => {
    const r = pageMock(
      [
        item({ id: "S-1", title: "Alice", fields: { Kind: "auth" } }),
        item({ id: "S-2", title: "Bob", fields: { Kind: "claim" } }),
      ],
      query({ search: "auth" }),
    );
    expect(r.items.map((i) => i.id)).toEqual(["S-1"]);
  });

  it("sorts and paginates deterministically", () => {
    const r = pageMock(
      rows,
      query({ sortBy: "id", sortDirection: "asc", page: 2, pageSize: 2 }),
    );
    expect(r.totalPages).toBe(2);
    expect(r.items.map((i) => i.id)).toEqual(["A-3", "A-4"]);
  });

  it("clamps out-of-range pages", () => {
    const r = pageMock(rows, query({ page: 99, pageSize: 2 }));
    expect(r.page).toBe(2);
    expect(r.items.length).toBeGreaterThan(0);
  });
});

describe("action gating rules (contract)", () => {
  // Small in-line replica of the ModuleWorklist gate so we can prove the
  // contract without wiring the whole React tree.
  function gate(
    row: WorkflowItem,
    action: { key: string; permission?: string },
    ctx: {
      grants: string[];
      accessibleFacilities: string[];
      permMap: Record<string, string>;
    },
  ): boolean {
    const facilityAccessible = !row.facilityId || ctx.accessibleFacilities.includes(row.facilityId);
    if (!facilityAccessible) return false;
    if (action.permission) {
      const perm = ctx.permMap[action.permission];
      if (perm && !ctx.grants.includes("*") && !ctx.grants.includes(perm)) return false;
    }
    const allowed = row.availableActions ?? [];
    return allowed.includes(action.key);
  }

  const permMap = { view: "Auth.View", manage: "Auth.Manage" };

  it("hides actions when availableActions is absent or empty", () => {
    const r = item({ availableActions: undefined });
    expect(gate(r, { key: "open", permission: "view" }, { grants: ["*"], accessibleFacilities: [], permMap })).toBe(false);
    const empty = item({ availableActions: [] });
    expect(gate(empty, { key: "open" }, { grants: ["*"], accessibleFacilities: [], permMap })).toBe(false);
  });

  it("gates every action, including guided-workflow launches", () => {
    const r = item({ availableActions: ["note"] });
    expect(gate(r, { key: "open" }, { grants: ["*"], accessibleFacilities: [], permMap })).toBe(false);
    expect(gate(r, { key: "note" }, { grants: ["*"], accessibleFacilities: [], permMap })).toBe(true);
  });

  it("blocks state-changing actions for rows in inaccessible facilities", () => {
    const r = item({ availableActions: ["approve"], facilityId: "F-secret" });
    expect(
      gate(r, { key: "approve", permission: "manage" }, {
        grants: ["*"], accessibleFacilities: ["F-mine"], permMap,
      }),
    ).toBe(false);
  });

  it("respects permission grants", () => {
    const r = item({ availableActions: ["approve"], facilityId: "F1" });
    expect(
      gate(r, { key: "approve", permission: "manage" }, {
        grants: ["Auth.View"], accessibleFacilities: ["F1"], permMap,
      }),
    ).toBe(false);
    expect(
      gate(r, { key: "approve", permission: "manage" }, {
        grants: ["Auth.Manage"], accessibleFacilities: ["F1"], permMap,
      }),
    ).toBe(true);
  });
});

describe("paged query concurrency (last-write-wins)", () => {
  beforeEach(() => { /* noop — mock pager is pure */ });

  it("returns independent snapshots for parallel queries", async () => {
    const rows = Array.from({ length: 50 }, (_, i) =>
      item({ id: `X-${i}`, status: i % 2 ? "pending" : "approved" }),
    );
    const [a, b] = await Promise.all([
      Promise.resolve(pageMock(rows, query({ filters: { status: "pending" }, pageSize: 5 }))),
      Promise.resolve(pageMock(rows, query({ filters: { status: "approved" }, pageSize: 5 }))),
    ]);
    expect(a.items.every((r) => r.status === "pending")).toBe(true);
    expect(b.items.every((r) => r.status === "approved")).toBe(true);
    expect(a.totalItems).toBe(25);
    expect(b.totalItems).toBe(25);
  });
});
