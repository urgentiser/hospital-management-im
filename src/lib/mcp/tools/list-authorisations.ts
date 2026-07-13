import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireAuth } from "../require-auth";

export default defineTool({
  name: "list_authorisations",
  title: "List medical scheme authorisations",
  description:
    "List medical scheme pre-authorisations for procedures across the Impilo Life Healthcare platform. Optional status filter. Requires an authenticated Impilo user.",
  inputSchema: {
    status: z
      .enum(["approved", "pending", "declined", "review"])
      .optional()
      .describe("Filter by authorisation status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    const denied = requireAuth(ctx);
    if (denied) return denied;
    const { authorisations } = await import("@/lib/mock-data");
    const rows = status ? authorisations.filter((a) => a.status === status) : authorisations;
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { authorisations: rows, count: rows.length },
    };
  },
});
