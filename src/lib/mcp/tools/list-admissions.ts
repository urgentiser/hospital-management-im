import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_admissions",
  title: "List admissions",
  description:
    "List current and recent hospital admissions across Life Healthcare facilities. Optionally filter by facility or status.",
  inputSchema: {
    facility: z.string().optional().describe("Filter by facility name."),
    status: z
      .enum(["admitted", "discharged", "transferred", "pending"])
      .optional()
      .describe("Filter by admission status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ facility, status }) => {
    const { admissions } = await import("@/lib/mock-data");
    let rows = admissions as readonly (typeof admissions)[number][];
    if (facility) {
      const q = facility.toLowerCase();
      rows = rows.filter((a) => a.facility.toLowerCase().includes(q));
    }
    if (status) rows = rows.filter((a) => a.status === status);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { admissions: rows, count: rows.length },
    };
  },
});
