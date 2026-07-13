import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireAuth } from "../require-auth";

export default defineTool({
  name: "get_patient",
  title: "Get patient by ID or MRN",
  description:
    "Look up a single patient by Impilo patient ID (e.g. 'P-10241') or MRN (e.g. 'MRN-0032411'). Requires an authenticated Impilo user.",
  inputSchema: {
    idOrMrn: z.string().min(1).describe("Patient ID or Medical Record Number."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ idOrMrn }, ctx) => {
    const denied = requireAuth(ctx);
    if (denied) return denied;
    const { patients, admissions, authorisations } = await import("@/lib/mock-data");
    const q = idOrMrn.trim().toLowerCase();
    const patient = patients.find(
      (p) => p.id.toLowerCase() === q || p.mrn.toLowerCase() === q,
    );
    if (!patient) {
      return {
        content: [{ type: "text", text: `No patient found matching '${idOrMrn}'.` }],
        isError: true,
      };
    }
    const patientAdmissions = admissions.filter((a) => a.mrn === patient.mrn);
    const patientAuths = authorisations.filter((a) => a.patient === patient.name);
    const payload = { patient, admissions: patientAdmissions, authorisations: patientAuths };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
