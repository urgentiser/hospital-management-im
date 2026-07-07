import { createFileRoute } from "@tanstack/react-router";
import { PharmacySectionPage, sectionHead } from "@/components/pharmacy/section-page";
import { SECTIONS } from "@/components/pharmacy/actions";

const section = SECTIONS.find((s) => s.key === "ward-theatre")!;

export const Route = createFileRoute("/_app/pharmacy/ward-theatre")({
  head: () => sectionHead(section),
  component: () => <PharmacySectionPage sectionKey="ward-theatre" />,
});
