import { createServiceSupabase } from "@/lib/supabase/server";

export type AuditAction =
  | "supplier_profile.submitted"
  | "supplier_profile.approved"
  | "supplier_profile.rejected"
  | "supplier_profile.revisions_requested"
  | "program.created"
  | "rfq.created"
  | "rfq.submitted"
  | "work_package.created"
  | "routing_decision.created"
  | "routing_decision.quote_requested";

export type AuditEntityType =
  | "supplier_profile"
  | "program"
  | "rfq"
  | "work_package"
  | "routing_decision";

export interface AuditEvent {
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  user_id: string;
  organization_id: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const supabase = createServiceSupabase();
  const { error } = await supabase.from("audit_logs").insert({
    action: event.action,
    entity_type: event.entity_type,
    entity_id: event.entity_id,
    user_id: event.user_id,
    organization_id: event.organization_id,
    metadata: event.metadata ?? {},
  });
  if (error) {
    throw new Error(`Audit write failed: ${error.message}`);
  }
}
