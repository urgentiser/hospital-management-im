import { defineTool } from "@lovable.dev/mcp-js";
import { requireAuth } from "../require-auth";

const FACILITIES = [
  { id: "LHC-FOU", name: "Life Fourways Hospital", location: "Fourways, Johannesburg", beds: 260, wards: 12, theatres: 8 },
  { id: "LHC-GRP", name: "Life Groenkloof Hospital", location: "Pretoria", beds: 210, wards: 10, theatres: 6 },
  { id: "LHC-KGM", name: "Life Kingsbury Hospital", location: "Claremont, Cape Town", beds: 200, wards: 10, theatres: 6 },
  { id: "LHC-VIN", name: "Life Vincent Pallotti Hospital", location: "Pinelands, Cape Town", beds: 210, wards: 11, theatres: 7 },
  { id: "LHC-EMP", name: "Life The Glynnwood", location: "Benoni, Ekurhuleni", beds: 230, wards: 11, theatres: 7 },
  { id: "LHC-EAS", name: "Life East London Private Hospital", location: "East London", beds: 180, wards: 9, theatres: 5 },
  { id: "LHC-WLG", name: "Life Westville Hospital", location: "Westville, Durban", beds: 240, wards: 12, theatres: 7 },
  { id: "LHC-ENT", name: "Life Entabeni Hospital", location: "Berea, Durban", beds: 280, wards: 13, theatres: 8 },
];

export default defineTool({
  name: "list_facilities",
  title: "List Life Healthcare facilities",
  description:
    "List Life Healthcare hospitals available on the Impilo platform, with location, bed count, wards and theatres. Requires an authenticated Impilo user.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx) => {
    const denied = requireAuth(ctx);
    if (denied) return denied;
    return {
      content: [{ type: "text", text: JSON.stringify(FACILITIES, null, 2) }],
      structuredContent: { facilities: FACILITIES },
    };
  },
});
