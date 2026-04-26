import { PageHeader } from "@/components/shell/PageHeader";
import { CardSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <>
      <PageHeader
        eyebrow="Supplier · Capability"
        title="Company Equipment"
        subtitle="Maintain your machine list and process capabilities so the routing engine can match work to your envelope."
      />
      <div className="space-y-4">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </div>
    </>
  );
}
