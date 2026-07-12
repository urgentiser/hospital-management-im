import { createFileRoute } from "@tanstack/react-router";
import {
  Inbox, ClipboardCheck, UserPlus, Timer, Send, RotateCcw, AlertTriangle, PlayCircle,
} from "lucide-react";
import { ModuleConsole, type ModuleConsoleConfig } from "@/components/module-console";

const config: ModuleConsoleConfig = {
  moduleKey: "workflow-inbox",
  eyebrow: "Organisation · Workflow Inbox",
  title: "Workflow Inbox",
  description: "One inbox for every approval, hand-off and follow-up across teams — with SLA countdowns and delegation.",
  heroHeadline: "Your queue. One place.",
  heroBlurb: "Approvals, reviews and hand-offs from every module surface here with SLA timers, so nothing gets forgotten.",
  heroBadge: "Live · Tasks",
  heroCtas: [
    { label: "Claim next task", sectionKey: "act", primary: true },
    { label: "Delegate", sectionKey: "delegate" },
    { label: "Escalate", sectionKey: "escalate" },
  ],
  overviewKpis: (items) => [
    { label: "Tasks", value: items.length, icon: Inbox, accent: "from-primary/30 to-transparent" },
    { label: "Assigned", value: items.filter((i) => i.status === "assigned").length, icon: UserPlus, accent: "from-sky-500/30 to-transparent" },
    { label: "In progress", value: items.filter((i) => i.status === "in-progress").length, icon: PlayCircle, accent: "from-amber-500/30 to-transparent", tone: "warning" },
    { label: "Completed", value: items.filter((i) => i.status === "completed").length, icon: ClipboardCheck, accent: "from-emerald-500/30 to-transparent", tone: "success" },
  ],
  sections: [
    {
      key: "act", title: "Act on Tasks", tagline: "Claim · complete",
      description: "Claim a task, complete it, or send it back with a note.",
      icon: PlayCircle, accent: "from-primary/25 via-sky-500/15 to-transparent", ring: "ring-primary/30",
      actions: [
        { key: "claim", label: "Claim Task", icon: UserPlus, hint: "Take ownership of a task", kind: "Task", startStatus: "in-progress",
          fields: [
            { name: "taskId", label: "Task ID", required: true },
            { name: "note", label: "Note" },
          ]},
        { key: "complete", label: "Complete", icon: ClipboardCheck, hint: "Mark as complete with outcome", kind: "Complete", startStatus: "completed",
          fields: [
            { name: "taskId", label: "Task ID", required: true },
            { name: "outcome", label: "Outcome", type: "textarea", required: true },
          ]},
        { key: "reject", label: "Send Back", icon: RotateCcw, hint: "Return to origin with reason", kind: "Send back", startStatus: "returned",
          fields: [
            { name: "taskId", label: "Task ID", required: true },
            { name: "reason", label: "Reason", type: "textarea", required: true },
          ]},
      ],
    },
    {
      key: "delegate", title: "Delegate & Assign", tagline: "Route · own",
      description: "Reassign or delegate a task to another owner or group.",
      icon: Send, accent: "from-emerald-500/25 via-teal-500/15 to-transparent", ring: "ring-emerald-400/30",
      actions: [
        { key: "reassign", label: "Reassign", icon: Send, hint: "Send to a different owner", kind: "Reassign", startStatus: "assigned",
          fields: [
            { name: "taskId", label: "Task ID", required: true },
            { name: "assignee", label: "New assignee", required: true },
            { name: "reason", label: "Reason" },
          ]},
        { key: "out-of-office", label: "Out of Office", icon: Timer, hint: "Set a delegate window", kind: "OOO", startStatus: "active",
          fields: [
            { name: "assignee", label: "Delegate", required: true },
            { name: "from", label: "From", placeholder: "YYYY-MM-DD" },
            { name: "to", label: "To", placeholder: "YYYY-MM-DD" },
          ]},
      ],
    },
    {
      key: "escalate", title: "Escalate & SLA", tagline: "SLA · watch",
      description: "Escalate breached tasks and watch SLA burn.",
      icon: AlertTriangle, accent: "from-amber-500/25 via-orange-500/15 to-transparent", ring: "ring-amber-400/30",
      actions: [
        { key: "escalate", label: "Escalate Task", icon: AlertTriangle, hint: "Escalate to a manager", kind: "Escalate", startStatus: "escalated",
          fields: [
            { name: "taskId", label: "Task ID", required: true },
            { name: "manager", label: "Escalate to", required: true },
            { name: "reason", label: "Reason", type: "textarea", required: true },
          ], destructive: true },
      ],
    },
  ],
  businessFlow: {
    moduleKey: "workflow-inbox",
    title: "Claim · Complete · Route",
    purpose: "Every hand-off, approval or follow-up in the platform lands in one inbox with an SLA, an owner and a clear next step.",
    legacySource: "Rich/Platform/WorkflowInbox.Implet",
    routeFamily: ["/workflow-inbox", "/workflow-inbox/{taskId}"],
    completionKind: "Task",
    completionStatus: "completed",
    completionLabel: "Task completed",
    titleFrom: (v) => `Task · ${v.taskId ?? ""}`,
    subtitleFrom: (v) => [v.assignee, v.reason].filter(Boolean).join(" · "),
    events: ["TaskAssigned", "TaskClaimed", "TaskCompleted", "TaskReturned", "TaskReassigned", "TaskEscalated"],
    handoffs: ["Authorisations", "Case Management", "Ward Management", "Billing"],
    globalRules: [
      "Every task has a single owner and an SLA; unassigned tasks route to the group queue.",
      "Out-of-office windows automatically redirect tasks to a nominated delegate.",
      "Breached SLAs escalate one management level up automatically.",
      "Completing a task publishes the outcome back to the originating module.",
    ],
    acceptance: [
      "Claim a task, complete it and observe the outcome propagate to its origin.",
      "Reassign a task; the previous owner loses it, the new owner sees it.",
      "Miss an SLA; the task auto-escalates and a notification is sent.",
    ],
    steps: [
      { key: "arrive", title: "Task arrives", description: "A domain module publishes a task with owner, priority and SLA.",
        events: ["TaskAssigned"] },
      { key: "notify", title: "Notify owner", description: "Owner is notified via preferred channel and the inbox badge updates.",
        checklist: ["Preferred channel notified", "Inbox badge updated"] },
      { key: "claim", title: "Owner claims", description: "Owner claims the task; group queue lock is released.",
        fields: [{ name: "taskId", label: "Task ID", required: true }],
        events: ["TaskClaimed"] },
      { key: "work", title: "Do the work", description: "Owner opens the linked record and performs the required action.",
        fields: [{ name: "note", label: "Progress note", type: "textarea" }] },
      { key: "sla", title: "SLA watch", description: "SLA countdown runs; nearing breach triggers a nudge.",
        rules: ["Nudge at 75% of SLA", "Auto-escalate at breach"] },
      { key: "decide", title: "Complete, return or reassign", description: "Complete with outcome, send back with reason, or reassign to a colleague.",
        fields: [{ name: "outcome", label: "Outcome / reason", type: "textarea" }],
        events: ["TaskCompleted", "TaskReturned", "TaskReassigned"] },
      { key: "escalate", title: "Escalate if needed", description: "Breached tasks escalate one management level up.",
        events: ["TaskEscalated"] },
      { key: "publish", title: "Publish outcome", description: "Outcome flows back to the originating module and audit.",
        events: ["TaskCompleted"] },
    ],
  },
};

export const Route = createFileRoute("/_app/workflow-inbox")({
  head: () => ({
    meta: [
      { title: "Workflow Inbox — Impilo" },
      { name: "description", content: config.description },
    ],
  }),
  component: () => <ModuleConsole config={config} />,
});
