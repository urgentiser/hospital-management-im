import { createFileRoute } from "@tanstack/react-router";
import { AdminSectionPage, sectionHead } from "@/components/admin/section-page";
import { SECTIONS } from "@/components/admin/actions";

const section = SECTIONS.find((s) => s.key === "support")!;

export const Route = createFileRoute("/_app/admin/support")({
  head: () => sectionHead(section),
  component: () => <AdminSectionPage sectionKey="support" />,
});
