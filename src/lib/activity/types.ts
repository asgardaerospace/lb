export interface ActivityEvent {
  id: string;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  actor_id: string | null;
}

export interface RenderedActivity {
  id: string;
  timestamp: string;
  title: string;
  detail: string | null;
  tone: "neutral" | "info" | "good" | "warn" | "bad";
}

export function renderActivityEvent(event: ActivityEvent): RenderedActivity {
  const md = event.metadata;
  const str = (k: string): string | null => {
    const v = md[k];
    return typeof v === "string" ? v : null;
  };

  switch (event.action) {
    case "job.created":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Job created",
        detail: str("job_number") ? `Job ${str("job_number")}` : null,
        tone: "info",
      };
    case "job.status_updated":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: `Status updated to ${str("status") ?? "—"}`,
        detail: str("note"),
        tone: "info",
      };
    case "job.status_overridden":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: `Status overridden to ${str("status") ?? "—"}`,
        detail: str("note") ?? "Asgard admin override",
        tone: "warn",
      };
    case "job.issue_flagged":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Issue flagged",
        detail: str("note"),
        tone: "bad",
      };
    case "document.uploaded":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Document uploaded",
        detail: str("file_name"),
        tone: "neutral",
      };
    case "document.downloaded":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Document downloaded",
        detail: str("file_name"),
        tone: "neutral",
      };
    case "quote.submitted":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Quote submitted",
        detail: null,
        tone: "info",
      };
    case "quote.accepted":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Quote accepted",
        detail: null,
        tone: "good",
      };
    case "quote.rejected":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Quote rejected",
        detail: str("reason"),
        tone: "bad",
      };
    case "quote.declined":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Quote declined by supplier",
        detail: str("reason"),
        tone: "warn",
      };
    case "work_package.created":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Work package created",
        detail: str("title"),
        tone: "info",
      };
    case "routing_decision.created":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Supplier routed",
        detail: null,
        tone: "info",
      };
    case "routing_decision.quote_requested":
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: "Quote requested from supplier",
        detail: null,
        tone: "info",
      };
    default:
      return {
        id: event.id,
        timestamp: event.timestamp,
        title: event.action.replace(/_/g, " "),
        detail: null,
        tone: "neutral",
      };
  }
}
