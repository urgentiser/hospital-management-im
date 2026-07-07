import { createFileRoute } from "@tanstack/react-router";
import { PharmacySectionPage, sectionHead } from "@/components/pharmacy/section-page";
import { SECTIONS } from "@/components/pharmacy/actions";

const section = SECTIONS.find((s) => s.key === "labels-stock")!;

export const Route = createFileRoute("/_app/pharmacy/labels-stock")({
  head: () => sectionHead(section),
  component: () => <PharmacySectionPage sectionKey="labels-stock" />,
});
