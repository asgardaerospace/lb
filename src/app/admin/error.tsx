"use client";

import { PreviewErrorFallback } from "@/components/shell/PreviewErrorFallback";

export default function AdminSegmentError({
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
      dashboardHref="/admin"
      dashboardLabel="Operations Control Center"
    />
  );
}
