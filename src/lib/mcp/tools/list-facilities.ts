import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_facilities",
  title: "List Life Healthcare facilities",
  description:
    "List Life Healthcare hospitals available on the Impilo platform, with location, bed count, wards and theatres.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const { useWorkflowStore } = await import("@/lib/workflow-store");
    const facilities = useWorkflowStore.getState().items.facilities ?? [];
    const rows = facilities.map((f) => ({
      id: f.id,
      name: f.title,
      location: f.subtitle,
      status: f.status,
      ...f.fields,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { facilities: rows },
    };
  },
});
