import { createServiceSupabase } from "@/lib/supabase/server";

export interface SupplierInviteResult {
  user_id: string | null;
  email: string;
  organization_id: string;
  role: "supplier_admin";
  status: "active" | "invited" | "placeholder";
  placeholder_mode: boolean;
  message: string;
}

export interface SupplierInviteHistoryEntry {
  id: string;
  email: string | null;
  invited_by: string | null;
  invited_by_email: string | null;
  placeholder_mode: boolean;
  outcome: string;
  timestamp: string;
}

export interface SupplierOperationalUserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export class SupplierInviteError extends Error {
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
 * Provisions a supplier_admin for the given supplier organization. Tries
 * the Supabase Auth admin invite; falls back to a placeholder audit
 * entry if the auth admin call is unavailable.
 *
 * Idempotency: if a `users` row already exists for the email in the same
 * organization, the call is a no-op for the row but emits a fresh audit
 * entry so the history stays accurate.
 */
export async function inviteSupplierAdmin(
  opts: InviteOptions,
): Promise<SupplierInviteResult> {
  const supabase = createServiceSupabase();

  // 1. If we already have a users row for this email, return success.
  const existingUser = await supabase
    .from("users")
    .select("id, organization_id, role, status")
    .eq("email", opts.email)
    .maybeSingle();

  if (existingUser.error) {
    throw new SupplierInviteError(
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
      throw new SupplierInviteError(
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
      role: "supplier_admin",
      status: u.status === "disabled" ? "placeholder" : u.status,
      placeholder_mode: false,
      message: `User already exists in this organization (status=${u.status}). No new invite sent.`,
    };
  }

  // 2. Attempt a real Supabase Auth invite via the admin API.
  let authUserId: string | null = null;
  let authInviteError: string | null = null;

  try {
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
          intended_role: "supplier_admin",
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
      role: "supplier_admin",
      status: "active",
    });
    if (ins.error) {
      throw new SupplierInviteError(
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
      role: "supplier_admin",
      status: "active",
      placeholder_mode: false,
      message:
        "Invitation email sent. The supplier will land on /supplier once they confirm.",
    };
  }

  // 4. Fallback: placeholder. Record the intent, let an operator finish out-of-band.
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
    role: "supplier_admin",
    status: "placeholder",
    placeholder_mode: true,
    message:
      authInviteError ??
      "Auth invite is not wired in this environment. The intent has been recorded; provision the auth user manually in the Supabase Dashboard.",
  };
}

export async function listSupplierInviteHistoryForOrganization(
  organizationId: string,
): Promise<SupplierInviteHistoryEntry[]> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, organization_id, action, metadata, timestamp")
    .eq("organization_id", organizationId)
    .eq("action", "supplier.invited")
    .order("timestamp", { ascending: false })
    .limit(20);
  if (error) {
    throw new SupplierInviteError(`audit_logs read failed: ${error.message}`);
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

export async function listUsersForSupplierOrganization(
  organizationId: string,
): Promise<SupplierOperationalUserRow[]> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new SupplierInviteError(`users list failed: ${error.message}`);
  }
  return (data ?? []) as unknown as SupplierOperationalUserRow[];
}

// ────────────────────────────────────────────────────────────────────────────
// Activation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Idempotently records a `supplier.activated` audit log entry for the
 * given user. Skips if one already exists for that user_id, or if the
 * user's organization is not a converted-supplier org (no
 * supplier_profiles row links back via source_application_id).
 *
 * Best-effort: any error is swallowed (logged in dev) so the calling
 * server component doesn't fail the page render.
 */
export async function recordSupplierActivationIfMissing(
  userId: string,
  organizationId: string,
): Promise<void> {
  try {
    const supabase = createServiceSupabase();

    // Cheap guard: only converted-supplier orgs get the activation log.
    // We use the source_application_id linkage added in 0016 as the marker —
    // pre-cutover supplier_profiles will be null and activation logs won't fire.
    const profileRes = await supabase
      .from("supplier_profiles")
      .select("id, source_application_id")
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (profileRes.error) {
      throw new Error(profileRes.error.message);
    }
    if (!profileRes.data) return;
    const profile = profileRes.data as {
      id: string;
      source_application_id: string | null;
    };
    if (!profile.source_application_id) return;

    const existing = await supabase
      .from("audit_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("action", "supplier.activated")
      .limit(1);
    if (existing.error) {
      throw new Error(existing.error.message);
    }
    if (existing.data && existing.data.length > 0) return;

    const ins = await supabase.from("audit_logs").insert({
      action: "supplier.activated",
      entity_type: "supplier_profile",
      entity_id: profile.id,
      user_id: userId,
      organization_id: organizationId,
      metadata: {
        source_application_id: profile.source_application_id,
      },
    });
    if (ins.error) {
      throw new Error(ins.error.message);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[supplier-application] activation log skipped:",
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
    action: "supplier.invited",
    entity_type: "organization",
    entity_id: opts.organizationId,
    user_id: opts.invitedBy,
    organization_id: opts.organizationId,
    metadata: {
      email: opts.email,
      role: "supplier_admin",
      placeholder_mode: params.placeholder,
      outcome: params.outcome,
      auth_user_id: params.authUserId,
      invited_from_organization_id: opts.invitedByOrganizationId,
      ...(params.error ? { error: params.error } : {}),
    },
  });
  if (res.error && process.env.NODE_ENV !== "production") {
    console.warn(
      "[supplier-application] invite audit insert failed:",
      res.error.message,
    );
  }
}
