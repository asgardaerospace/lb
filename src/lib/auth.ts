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
