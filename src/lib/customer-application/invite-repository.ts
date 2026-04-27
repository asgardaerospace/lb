import { createServiceSupabase } from "@/lib/supabase/server";

export interface InviteResult {
  user_id: string | null;
  email: string;
  organization_id: string;
  role: "buyer_admin";
  status: "active" | "invited" | "placeholder";
  placeholder_mode: boolean;
  message: string;
}

export interface InviteHistoryEntry {
  id: string;
  email: string | null;
  invited_by: string | null;
  invited_by_email: string | null;
  placeholder_mode: boolean;
  outcome: string;
  timestamp: string;
}

export class InviteError extends Error {
  constructor(
    message: string,
    public status: number = 500,
  ) {
    super(message);
  }
}

interface InviteOptions {
  organizationId: string;
  email: string;
  invitedBy: string;
  invitedByOrganizationId: string;
}

/**
 * Provisions a buyer_admin for the given organization. Tries the Supabase
 * Auth admin invite; falls back to a placeholder audit entry if the auth
 * admin call is unavailable (env missing, project misconfigured, etc.).
 *
 * Idempotency: if a `users` row already exists for the email, the call is
 * a no-op for the row but still emits a fresh audit entry so the history
 * stays accurate.
 */
export async function inviteCustomerAdmin(
  opts: InviteOptions,
): Promise<InviteResult> {
  const supabase = createServiceSupabase();

  // 1. If we already have a users row for this email, just return success.
  const existingUser = await supabase
    .from("users")
    .select("id, organization_id, role, status")
    .eq("email", opts.email)
    .maybeSingle();

  if (existingUser.error) {
    throw new InviteError(
      `users lookup failed: ${existingUser.error.message}`,
    );
  }

  if (existingUser.data) {
    const u = existingUser.data as {
      id: string;
      organization_id: string;
      role: string;
      status: "active" | "invited" | "disabled";
    };
    if (u.organization_id !== opts.organizationId) {
      throw new InviteError(
        `Email ${opts.email} is already attached to a different organization (${u.organization_id.slice(0, 8)}). Use a different email.`,
        409,
      );
    }
    await writeAuditInvited(supabase, opts, {
      placeholder: false,
      outcome: "already_user",
      authUserId: u.id,
    });
    return {
      user_id: u.id,
      email: opts.email,
      organization_id: opts.organizationId,
      role: "buyer_admin",
      status: u.status === "disabled" ? "placeholder" : u.status,
      placeholder_mode: false,
      message: `User already exists in this organization (status=${u.status}). No new invite sent.`,
    };
  }

  // 2. Attempt a real Supabase Auth invite via the admin API.
  let authUserId: string | null = null;
  let authInviteError: string | null = null;

  try {
    // The auth.admin namespace is on the service-role client.
    const auth = (
      supabase as unknown as {
        auth: {
          admin: {
            inviteUserByEmail: (
              email: string,
              opts?: { data?: Record<string, unknown> },
            ) => Promise<{
              data: { user: { id: string; email: string } | null } | null;
              error: { message: string; status?: number } | null;
            }>;
          };
        };
      }
    ).auth.admin;
    if (typeof auth?.inviteUserByEmail === "function") {
      const inviteRes = await auth.inviteUserByEmail(opts.email, {
        data: {
          organization_id: opts.organizationId,
          intended_role: "buyer_admin",
        },
      });
      if (inviteRes.error) {
        authInviteError = inviteRes.error.message;
      } else if (inviteRes.data?.user) {
        authUserId = inviteRes.data.user.id;
      }
    } else {
      authInviteError =
        "Supabase auth.admin.inviteUserByEmail not available on this client";
    }
  } catch (err) {
    authInviteError =
      err instanceof Error ? err.message : "auth admin invite threw";
  }

  // 3. If auth invite succeeded, persist the operational users row.
  if (authUserId) {
    const ins = await supabase.from("users").insert({
      id: authUserId,
      organization_id: opts.organizationId,
      email: opts.email,
      role: "buyer_admin",
      status: "active",
    });
    if (ins.error) {
      // Auth user exists but users row failed — this is recoverable but
      // confusing. Surface it; the admin can retry once they understand
      // why (most likely a unique-email collision in `users`).
      throw new InviteError(
        `auth user provisioned but users insert failed: ${ins.error.message}`,
        500,
      );
    }
    await writeAuditInvited(supabase, opts, {
      placeholder: false,
      outcome: "auth_invited",
      authUserId,
    });
    return {
      user_id: authUserId,
      email: opts.email,
      organization_id: opts.organizationId,
      role: "buyer_admin",
      status: "active",
      placeholder_mode: false,
      message: `Invitation email sent. The user will land on /buyer/dashboard once they confirm.`,
    };
  }

  // 4. Fallback: placeholder. We could not provision an auth user; record
  // the intent and let an operator finish out-of-band.
  await writeAuditInvited(supabase, opts, {
    placeholder: true,
    outcome: "placeholder",
    authUserId: null,
    error: authInviteError,
  });

  return {
    user_id: null,
    email: opts.email,
    organization_id: opts.organizationId,
    role: "buyer_admin",
    status: "placeholder",
    placeholder_mode: true,
    message:
      authInviteError ??
      "Auth invite is not wired in this environment. The intent has been recorded; provision the auth user manually in the Supabase Dashboard.",
  };
}

/**
 * Read invite history for an organization out of audit_logs. Most-recent first.
 */
export async function listInviteHistoryForOrganization(
  organizationId: string,
): Promise<InviteHistoryEntry[]> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, organization_id, action, metadata, timestamp")
    .eq("organization_id", organizationId)
    .eq("action", "customer.invited")
    .order("timestamp", { ascending: false })
    .limit(20);
  if (error) {
    throw new InviteError(`audit_logs read failed: ${error.message}`);
  }

  const inviterIds = Array.from(
    new Set(
      (data ?? [])
        .map((r) => (r as { user_id: string | null }).user_id)
        .filter((v): v is string => !!v),
    ),
  );
  let inviterEmail = new Map<string, string>();
  if (inviterIds.length) {
    const usersRes = await supabase
      .from("users")
      .select("id, email")
      .in("id", inviterIds);
    if (!usersRes.error && usersRes.data) {
      inviterEmail = new Map(
        (usersRes.data as { id: string; email: string }[]).map((u) => [
          u.id,
          u.email,
        ]),
      );
    }
  }

  return (data ?? []).map((r) => {
    const row = r as {
      id: string;
      user_id: string | null;
      action: string;
      metadata: Record<string, unknown> | null;
      timestamp: string;
    };
    const meta = row.metadata ?? {};
    return {
      id: row.id,
      email: typeof meta.email === "string" ? meta.email : null,
      invited_by: row.user_id,
      invited_by_email: row.user_id
        ? (inviterEmail.get(row.user_id) ?? null)
        : null,
      placeholder_mode: meta.placeholder_mode === true,
      outcome:
        typeof meta.outcome === "string" ? meta.outcome : "unspecified",
      timestamp: row.timestamp,
    };
  });
}

/**
 * Returns active operational users on a customer organization. Used by the
 * admin detail page so reviewers can see who can already log in.
 */
export interface OperationalUserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export async function listUsersForOrganization(
  organizationId: string,
): Promise<OperationalUserRow[]> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new InviteError(`users list failed: ${error.message}`);
  }
  return (data ?? []) as unknown as OperationalUserRow[];
}

// ────────────────────────────────────────────────────────────────────────────
// Activation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Idempotently records a `customer.activated` audit log entry for the given
 * user. Skips if one already exists for that user_id, or if the user's
 * organization is not a converted customer (no customer_profiles row).
 *
 * Best-effort: any error is swallowed (logged in dev) so the calling
 * server component doesn't fail the page render.
 */
export async function recordCustomerActivationIfMissing(
  userId: string,
  organizationId: string,
): Promise<void> {
  try {
    const supabase = createServiceSupabase();

    // Cheap guard: only converted-customer organizations get the activation log.
    const profileRes = await supabase
      .from("customer_profiles")
      .select("id, source_application_id")
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (profileRes.error) {
      throw new Error(profileRes.error.message);
    }
    if (!profileRes.data) return; // not a converted-customer org

    // Idempotency: only insert the activation log once per user.
    const existing = await supabase
      .from("audit_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("action", "customer.activated")
      .limit(1);
    if (existing.error) {
      throw new Error(existing.error.message);
    }
    if (existing.data && existing.data.length > 0) return;

    const ins = await supabase.from("audit_logs").insert({
      action: "customer.activated",
      entity_type: "customer_profile",
      entity_id: (profileRes.data as { id: string }).id,
      user_id: userId,
      organization_id: organizationId,
      metadata: {
        source_application_id:
          (profileRes.data as { source_application_id: string | null })
            .source_application_id ?? null,
      },
    });
    if (ins.error) {
      throw new Error(ins.error.message);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[customer-application] activation log skipped:",
        err instanceof Error ? err.message : err,
      );
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────────────

interface AuditInviteParams {
  placeholder: boolean;
  outcome: string;
  authUserId: string | null;
  error?: string | null;
}

async function writeAuditInvited(
  supabase: ReturnType<typeof createServiceSupabase>,
  opts: InviteOptions,
  params: AuditInviteParams,
): Promise<void> {
  const res = await supabase.from("audit_logs").insert({
    action: "customer.invited",
    entity_type: "organization",
    entity_id: opts.organizationId,
    user_id: opts.invitedBy,
    organization_id: opts.organizationId,
    metadata: {
      email: opts.email,
      role: "buyer_admin",
      placeholder_mode: params.placeholder,
      outcome: params.outcome,
      auth_user_id: params.authUserId,
      invited_from_organization_id: opts.invitedByOrganizationId,
      ...(params.error ? { error: params.error } : {}),
    },
  });
  if (res.error && process.env.NODE_ENV !== "production") {
    console.warn(
      "[customer-application] invite audit insert failed:",
      res.error.message,
    );
  }
}
