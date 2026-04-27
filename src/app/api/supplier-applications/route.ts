import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getOptionalUser } from "@/lib/auth";
import { supplierApplicationSubmitSchema } from "@/lib/supplier-application/types";
import { submitSupplierApplication } from "@/lib/supplier-application/repository";

/**
 * POST /api/supplier-applications
 *
 * Persists a submitted supplier intake into the supplier_applications
 * tables (parent + 4 child tables: certifications, machines, capabilities,
 * past_performance). Mirrors the security posture of the customer intake
 * endpoint: anon submissions are dev-only or env-flag-gated in production.
 *
 * Preview-mode short-circuit: if Supabase env vars are missing, the route
 * returns 200 with `{ preview_mode: true, application_id: null }` so the
 * wizard can fall through to the confirmation page.
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

  const parsed = supplierApplicationSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodError(parsed.error),
      },
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
            "Anonymous supplier-application submissions are disabled in this environment. Sign in or set LAUNCHBELT_ALLOW_ANON_INTAKE=1.",
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
    const submitted = await submitSupplierApplication(input, {
      authenticatedUserId: user?.id ?? null,
      authenticatedOrganizationId: user?.organization_id ?? null,
    });
    return NextResponse.json(
      {
        application_id: submitted.id,
        status: submitted.status,
        legal_name: submitted.legal_name,
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
