import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import type { ActivityEvent } from "./types";

const COLUMNS = "id, timestamp, action, entity_type, entity_id, metadata, user_id";

interface RawAuditRow {
  id: string;
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  user_id: string | null;
}

function toEvent(row: RawAuditRow): ActivityEvent {
  return {
    id: row.id,
    timestamp: row.timestamp,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    metadata: row.metadata ?? {},
    actor_id: row.user_id,
  };
}

interface JobActivityInput {
  jobId: string;
  workPackageId: string;
  quoteId: string | null;
}

/**
 * Fetch the cross-entity activity stream for a job. Combines events tagged
 * directly to the job, the job's documents, the source quote, the parent
 * work package, and any routing decisions on that work package.
 *
 * Tolerant: returns [] on any failure so a transient Supabase outage does not
 * blow up the page render.
 */
export async function loadJobActivity({
  jobId,
  workPackageId,
  quoteId,
}: JobActivityInput): Promise<ActivityEvent[]> {
  try {
    const sb = createServiceSupabase();

    const queries: PromiseLike<{ data: RawAuditRow[] | null }>[] = [
      sb.from("audit_logs").select(COLUMNS).eq("entity_type", "job").eq("entity_id", jobId),
      sb
        .from("audit_logs")
        .select(COLUMNS)
        .eq("entity_type", "document")
        .eq("metadata->>target_entity_type", "job")
        .eq("metadata->>target_entity_id", jobId),
      sb
        .from("audit_logs")
        .select(COLUMNS)
        .eq("entity_type", "work_package")
        .eq("entity_id", workPackageId),
      sb
        .from("audit_logs")
        .select(COLUMNS)
        .eq("entity_type", "routing_decision")
        .eq("metadata->>work_package_id", workPackageId),
    ];

    if (quoteId) {
      queries.push(
        sb.from("audit_logs").select(COLUMNS).eq("entity_type", "quote").eq("entity_id", quoteId),
      );
    }

    const results = await Promise.all(queries);
    const rows: RawAuditRow[] = results.flatMap((r) => r.data ?? []);

    const seen = new Set<string>();
    const events: ActivityEvent[] = [];
    for (const r of rows) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      events.push(toEvent(r));
    }
    events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    return events;
  } catch {
    return [];
  }
}
