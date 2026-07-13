import { defineMcp } from "@lovable.dev/mcp-js";
import listFacilitiesTool from "./tools/list-facilities";
import listPatientsTool from "./tools/list-patients";
import listAdmissionsTool from "./tools/list-admissions";
import getPatientTool from "./tools/get-patient";
import listAuthorisationsTool from "./tools/list-authorisations";

export default defineMcp({
  name: "impilo-mcp",
  title: "Impilo — Life Healthcare Platform",
  version: "0.1.0",
  instructions:
    "Read-only access to the Impilo modern healthcare platform for Life Healthcare. Use these tools to look up facilities, patients, admissions and medical-scheme authorisations across Life Healthcare hospitals (Fourways, Groenkloof, Kingsbury, Vincent Pallotti, Glynnwood, East London, Westville, Entabeni).",
  tools: [
    listFacilitiesTool,
    listPatientsTool,
    listAdmissionsTool,
    getPatientTool,
    listAuthorisationsTool,
  ],
});
