import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { admissions, authorisations, patients, kpis } from "@/lib/mock-data";

type ChatRequestBody = { messages?: unknown };

const SYSTEM = `You are Impilo AI, an assistant embedded in the Impilo hospital operations platform for Life Healthcare South Africa.

Scope: patients, admissions, scheme authorisations, wards, theatre bookings, pharmacy orders, billing, funding rules, and integration events across Life Healthcare hospitals (Life Fourways, Life Groenkloof, Life Kingsbury, Life Vincent Pallotti, Life The Glynnwood, Life East London, Life Westville, Life Entabeni).

Style:
- Be concise. Use short paragraphs and markdown tables/lists when helpful.
- When a user asks about live data (patients, admissions, authorisations, KPIs), call the relevant tool first and cite the record IDs (e.g. P-10241, ADM-88213, AUTH-40921).
- If the answer is not in the tools, say so and suggest which module in the platform to open (Patients, Admissions, Authorisations, Theatre, Pharmacy, Ward, Billing, etc.).
- Never invent MRNs, scheme decisions, or amounts.
- Currency is South African Rand (R).

You are a decision-support assistant, not a substitute for a clinician.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-2.5-flash");

        const tools = {
          list_patients: tool({
            description: "List patients on the Impilo platform. Optionally filter by facility name substring or status.",
            inputSchema: z.object({
              facility: z.string().optional().describe("Facility name substring, e.g. 'Fourways'."),
              status: z.enum(["active", "pending", "review", "closed", "failed"]).optional(),
            }),
            execute: async ({ facility, status }) => {
              return patients
                .filter((p) => (!facility || p.facility.toLowerCase().includes(facility.toLowerCase())) && (!status || p.status === status))
                .slice(0, 50);
            },
          }),
          list_admissions: tool({
            description: "List current and recent hospital admissions. Optionally filter by facility or status.",
            inputSchema: z.object({
              facility: z.string().optional(),
              status: z.enum(["admitted", "discharged", "transferred", "pending"]).optional(),
            }),
            execute: async ({ facility, status }) => {
              return admissions.filter(
                (a) => (!facility || a.facility.toLowerCase().includes(facility.toLowerCase())) && (!status || a.status === status),
              );
            },
          }),
          list_authorisations: tool({
            description: "List medical scheme pre-authorisations. Optional status filter.",
            inputSchema: z.object({
              status: z.enum(["approved", "pending", "declined", "review"]).optional(),
            }),
            execute: async ({ status }) => {
              return authorisations.filter((a) => !status || a.status === status);
            },
          }),
          get_patient: tool({
            description: "Look up a single patient by Impilo patient ID (e.g. 'P-10241') or MRN (e.g. 'MRN-0032411').",
            inputSchema: z.object({ idOrMrn: z.string().min(1) }),
            execute: async ({ idOrMrn }) => {
              const q = idOrMrn.toLowerCase();
              return patients.find((p) => p.id.toLowerCase() === q || p.mrn.toLowerCase() === q) ?? null;
            },
          }),
          platform_kpis: tool({
            description: "Return the current top-line KPIs shown on the Impilo dashboard (admissions, authorisations, theatre utilisation, failed integrations).",
            inputSchema: z.object({}),
            execute: async () => kpis,
          }),
        };

        const result = streamText({
          model,
          system: SYSTEM,
          messages: convertToModelMessages(messages as UIMessage[]),
          tools,
          stopWhen: stepCountIs(6),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          onError: (error) => {
            console.error("chat stream error", error);
            return error instanceof Error ? error.message : "Something went wrong";
          },
        });
      },
    },
  },
});
