export interface Notification {
  id: string;
  user_id: string;
  organization_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  body: string | null;
  href: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationDispatch {
  user_id: string;
  organization_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  body?: string | null;
  href?: string | null;
  metadata?: Record<string, unknown>;
}
