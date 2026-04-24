import { AuthError } from "@/lib/auth";
import { getProgramById, getRfqById } from "@/lib/rfq/repository";
import type { Rfq } from "@/lib/rfq/types";

/**
 * Load an rfq, verify it belongs to the caller's org, return it.
 * Throws AuthError(404|403) on miss/mismatch so handlers can propagate.
 */
export async function loadRfqForOrg(
  rfqId: string,
  orgId: string,
): Promise<Rfq> {
  const rfq = await getRfqById(rfqId);
  if (!rfq) throw new AuthError("RFQ not found", 404);
  const program = await getProgramById(rfq.program_id);
  if (!program) throw new AuthError("RFQ not found", 404);
  if (program.buyer_organization_id !== orgId) {
    throw new AuthError("Forbidden", 403);
  }
  return rfq;
}
