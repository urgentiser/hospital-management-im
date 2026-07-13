import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_patients",
  title: "List patients",
  description:
    "List patients on the Impilo Life Healthcare platform. Optionally filter by facility name (e.g. 'Life Fourways') or clinical status.",
  inputSchema: {
    facility: z.string().optional().describe("Filter by facility name, e.g. 'Life Fourways'."),
    status: z
      .enum(["active", "pending", "review", "closed", "failed"])
      .optional()
      .describe("Filter by workflow status."),
    limit: z.number().int().min(1).max(200).optional().describe("Maximum number of rows to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ facility, status, limit }) => {
    const { patients } = await import("@/lib/mock-data");
    let rows = patients as readonly (typeof patients)[number][];
    if (facility) {
      const q = facility.toLowerCase();
      rows = rows.filter((p) => p.facility.toLowerCase().includes(q));
    }
    if (status) rows = rows.filter((p) => p.status === status);
    if (limit) rows = rows.slice(0, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { patients: rows, count: rows.length },
    };
  },
});
