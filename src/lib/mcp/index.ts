import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listFacilitiesTool from "./tools/list-facilities";
import listPatientsTool from "./tools/list-patients";
import listAdmissionsTool from "./tools/list-admissions";
import getPatientTool from "./tools/get-patient";
import listAuthorisationsTool from "./tools/list-authorisations";

// The OAuth issuer must be the direct Supabase host, not the .lovable.cloud proxy.
// VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "impilo-mcp",
  title: "Impilo — Life Healthcare Platform",
  version: "0.2.0",
  instructions:
    "Authenticated access to the Impilo modern healthcare platform for Life Healthcare. Sign in as an Impilo user to look up facilities, patients, admissions and medical-scheme authorisations across Life Healthcare hospitals.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listFacilitiesTool,
    listPatientsTool,
    listAdmissionsTool,
    getPatientTool,
    listAuthorisationsTool,
  ],
});
