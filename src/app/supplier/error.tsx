"use client";

import { PreviewErrorFallback } from "@/components/shell/PreviewErrorFallback";

export default function SupplierSegmentError({
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
      dashboardHref="/supplier"
      dashboardLabel="Partner Dashboard"
    />
  );
}
