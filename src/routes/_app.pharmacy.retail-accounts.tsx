import { createFileRoute } from "@tanstack/react-router";
import { PharmacySectionPage, sectionHead } from "@/components/pharmacy/section-page";
import { SECTIONS } from "@/components/pharmacy/actions";

const section = SECTIONS.find((s) => s.key === "retail-accounts")!;

export const Route = createFileRoute("/_app/pharmacy/retail-accounts")({
  head: () => sectionHead(section),
  component: () => <PharmacySectionPage sectionKey="retail-accounts" />,
});
