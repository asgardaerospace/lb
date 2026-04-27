import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getOptionalUser } from "@/lib/auth";
import { customerApplicationSubmitSchema } from "@/lib/customer-application/types";
import { submitCustomerApplication } from "@/lib/customer-application/repository";

/**
 * POST /api/customer-applications
 *
 * Phase 2: persists a submitted customer onboarding wizard payload into the
 * intake tables added by migration 0012. NOT a public anonymous endpoint
 * yet — anon submissions are opt-in:
 *
 *   - Authenticated buyer/admin → always accepted; submitted_by + org
 *     captured.
 *   - Unauthenticated request:
 *       * In dev (NODE_ENV !== 'production')   → accepted with intake_email
 *       * In production                        → requires the explicit env
 *         var `LAUNCHBELT_ALLOW_ANON_INTAKE=1` (off by default). If unset,
 *         responds with 401 + `{ error: 'anon_disabled' }`.
 *
 * Phase 5 will replace the env-var gate with a proper public flow
 * (rate-limit, CAPTCHA, email verification).
 *
 * Preview mode: if Supabase env vars are missing entirely, returns
 * `{ preview_mode: true }` with HTTP 200 so the wizard can surface a
 * "responses are not saved yet" message and still route to /onboarding/confirmation.
 */
export const dynamic = "force-dynamic";

const SUPABASE_URL = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_SERVICE_ROLE_KEY = "SUPABASE_SERVICE_ROLE_KEY";

function isPreviewEnvironment() {
  return (
    !process.env[SUPABASE_URL] || !process.env[SUPABASE_SERVICE_ROLE_KEY]
  );
}

function isAnonAllowedHere() {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.LAUNCHBELT_ALLOW_ANON_INTAKE === "1";
}

export async function POST(req: NextRequest) {
  // Preview short-circuit — keep the wizard usable without Supabase wired.
  if (isPreviewEnvironment()) {
    return NextResponse.json(
      {
        preview_mode: true,
        application_id: null,
        message:
          "Supabase env vars are not set. The submission was accepted in preview mode but no row was written.",
      },
      { status: 200 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsed = customerApplicationSubmitSchema.safeParse(body);
  if (!parsed.success) {
    const message = formatZodError(parsed.error);
    return NextResponse.json(
      { error: "Validation failed", details: message },
      { status: 422 },
    );
  }
  const input = parsed.data;

  const user = await getOptionalUser();

  if (!user) {
    if (!isAnonAllowedHere()) {
      return NextResponse.json(
        {
          error: "anon_disabled",
          message:
            "Anonymous customer-application submissions are disabled in this environment. Sign in or set LAUNCHBELT_ALLOW_ANON_INTAKE=1.",
        },
        { status: 401 },
      );
    }
    if (!input.intake_email) {
      return NextResponse.json(
        {
          error: "intake_email_required",
          message:
            "intake_email is required for anonymous submissions so we can follow up.",
        },
        { status: 422 },
      );
    }
  }

  try {
    const submitted = await submitCustomerApplication(input, {
      authenticatedUserId: user?.id ?? null,
      authenticatedOrganizationId: user?.organization_id ?? null,
    });
    return NextResponse.json(
      {
        application_id: submitted.id,
        status: submitted.status,
        derived_tier: submitted.derived_tier,
        preview_mode: false,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "submit_failed", message },
      { status: 500 },
    );
  }
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}
