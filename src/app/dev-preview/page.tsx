import { notFound } from "next/navigation";
import { DevPreviewClient } from "./DevPreviewClient";

export const dynamic = "force-dynamic";

export default function DevPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <DevPreviewClient />;
}
