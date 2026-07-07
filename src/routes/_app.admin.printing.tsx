import { createFileRoute } from "@tanstack/react-router";
import { AdminSectionPage, sectionHead } from "@/components/admin/section-page";
import { SECTIONS } from "@/components/admin/actions";

const section = SECTIONS.find((s) => s.key === "printing")!;

export const Route = createFileRoute("/_app/admin/printing")({
  head: () => sectionHead(section),
  component: () => <AdminSectionPage sectionKey="printing" />,
});
