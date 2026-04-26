import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import type { Notification, NotificationDispatch } from "./types";

const COLUMNS =
  "id, user_id, organization_id, action, entity_type, entity_id, title, body, href, metadata, read_at, created_at";

/**
 * Insert one or more notification rows. Writes go through the service role to
 * bypass RLS — recipients may belong to different orgs than the actor.
 */
export async function insertNotifications(
  rows: NotificationDispatch[],
): Promise<void> {
  if (rows.length === 0) return;
  const sb = createServiceSupabase();
  const { error } = await sb.from("notifications").insert(
    rows.map((r) => ({
      user_id: r.user_id,
      organization_id: r.organization_id,
      action: r.action,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      title: r.title,
      body: r.body ?? null,
      href: r.href ?? null,
      metadata: r.metadata ?? {},
    })),
  );
  if (error) throw new Error(`Notification insert failed: ${error.message}`);
}

export async function listForUser(
  userId: string,
  limit = 30,
): Promise<Notification[]> {
  const sb = createServiceSupabase();
  const { data, error } = await sb
    .from("notifications")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Notification list failed: ${error.message}`);
  return (data ?? []) as Notification[];
}

export async function countUnread(userId: string): Promise<number> {
  const sb = createServiceSupabase();
  const { count, error } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new Error(`Notification count failed: ${error.message}`);
  return count ?? 0;
}

export async function markRead(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const sb = createServiceSupabase();
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new Error(`Notification update failed: ${error.message}`);
}

export async function markAllRead(userId: string): Promise<void> {
  const sb = createServiceSupabase();
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new Error(`Notification update failed: ${error.message}`);
}
