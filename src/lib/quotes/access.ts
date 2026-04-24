import { AuthError } from "@/lib/auth";
import { getRoutingDecisionById } from "@/lib/routing/repository";
import type { RoutingDecision } from "@/lib/routing/types";

/**
 * Load a routing_decision and verify it belongs to the caller's supplier org
 * and has been moved to quote_requested. Used as the entry point for every
 * supplier quote action so competitor rows stay invisible.
 */
export async function loadRequestForSupplier(
  routingDecisionId: string,
  supplierOrgId: string,
): Promise<RoutingDecision> {
  const rd = await getRoutingDecisionById(routingDecisionId);
  if (!rd) throw new AuthError("Quote request not found", 404);
  if (rd.supplier_organization_id !== supplierOrgId) {
    throw new AuthError("Forbidden", 403);
  }
  if (rd.routing_status !== "quote_requested") {
    throw new AuthError("Quote request not active", 409);
  }
  return rd;
}
