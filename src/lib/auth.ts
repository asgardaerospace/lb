import { createServerSupabase } from "@/lib/supabase/server";

export type UserRole =
  | "asgard_admin"
  | "supplier_admin"
  | "supplier_user"
  | "buyer_admin"
  | "buyer_user";

export type UserStatus = "active" | "invited" | "disabled";

export interface SessionUser {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<SessionUser> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError("Not authenticated", 401);

  const { data, error } = await supabase
    .from("users")
    .select("id, organization_id, email, role, status")
    .eq("id", user.id)
    .single();
  if (error || !data) throw new AuthError("User profile not found", 401);
  if (data.status !== "active") throw new AuthError("User is not active", 403);
  return data as SessionUser;
}

export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export const requireAsgardAdmin = () => requireRole(["asgard_admin"]);
export const requireSupplierAdmin = () => requireRole(["supplier_admin"]);

/**
 * Returns the current session user, or `null` when:
 *   - the user is unauthenticated (401)
 *   - the user row is missing / disabled (401/403)
 *   - Supabase env vars are absent (preview deployments without secrets)
 *   - the network call to Supabase fails for any reason
 *
 * It NEVER throws. Use this in UI-preview surfaces (role dashboards,
 * shell, landing screens) so that a missing session/env does not crash
 * the page. API routes must continue to use `requireUser` / `requireRole`
 * so they return 401/403 as expected.
 */
export async function getOptionalUser(): Promise<SessionUser | null> {
  try {
    return await requireUser();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // Log in dev only — on Vercel we want quiet preview-mode fallbacks.
      console.warn(
        "[auth] getOptionalUser falling back to preview mode:",
        err instanceof Error ? err.message : err,
      );
    }
    return null;
  }
}

/**
 * True when the request cannot be resolved to a real authenticated user.
 * Callers may use this to decide whether to render illustrative preview
 * data or real data from Supabase.
 */
export async function isPreviewMode(): Promise<boolean> {
  return (await getOptionalUser()) === null;
}
