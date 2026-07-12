import { createFileRoute } from "@tanstack/react-router";
import { AdminSectionPage, sectionHead } from "@/components/admin/section-page";
import { SECTIONS } from "@/components/admin/actions";

const section = SECTIONS.find((s) => s.key === "documents")!;

export const Route = createFileRoute("/_app/admin/documents")({
  head: () => sectionHead(section),
  component: () => <AdminSectionPage sectionKey="documents" />,
});
