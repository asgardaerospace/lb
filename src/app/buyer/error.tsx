"use client";

import { PreviewErrorFallback } from "@/components/shell/PreviewErrorFallback";

export default function BuyerSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PreviewErrorFallback
      error={error}
      reset={reset}
      dashboardHref="/buyer/dashboard"
      dashboardLabel="Mission Control"
    />
  );
}
