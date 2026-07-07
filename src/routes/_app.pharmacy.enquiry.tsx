import { createFileRoute } from "@tanstack/react-router";
import { PharmacySectionPage, sectionHead } from "@/components/pharmacy/section-page";
import { SECTIONS } from "@/components/pharmacy/actions";

const section = SECTIONS.find((s) => s.key === "enquiry")!;

export const Route = createFileRoute("/_app/pharmacy/enquiry")({
  head: () => sectionHead(section),
  component: () => <PharmacySectionPage sectionKey="enquiry" />,
});
