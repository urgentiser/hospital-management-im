import { createFileRoute } from "@tanstack/react-router";
import { AdminSectionPage, sectionHead } from "@/components/admin/section-page";
import { SECTIONS } from "@/components/admin/actions";

const section = SECTIONS.find((s) => s.key === "billing")!;

export const Route = createFileRoute("/_app/admin/billing")({
  head: () => sectionHead(section),
  component: () => <AdminSectionPage sectionKey="billing" />,
});
