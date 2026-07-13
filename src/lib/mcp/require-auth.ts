import type { ToolContext } from "@lovable.dev/mcp-js";

export function requireAuth(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Not authenticated. Sign in to Impilo to use this tool.",
        },
      ],
      isError: true as const,
    };
  }
  return null;
}
