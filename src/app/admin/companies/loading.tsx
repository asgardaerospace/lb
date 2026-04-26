import { PageHeader } from "@/components/shell/PageHeader";
import { KpiSkeleton, TableSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <>
      <PageHeader
        eyebrow="Admin · Directory"
        title="Companies"
        subtitle="Buyers and suppliers registered on Launchbelt."
      />
      <KpiSkeleton count={5} />
      <TableSkeleton toolbar rows={6} columns={5} />
    </>
  );
}
