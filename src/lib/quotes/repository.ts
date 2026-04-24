import { createServerSupabase } from "@/lib/supabase/server";
import type { Job, Quote, QuoteStatus } from "@/lib/quotes/types";

const QUOTE_COLUMNS =
  "id, work_package_id, supplier_organization_id, quoted_price, lead_time_days, minimum_order_quantity, quote_notes, status, submitted_at, reviewed_at, reviewed_by, review_notes, created_at, updated_at, created_by";

const JOB_COLUMNS =
  "id, work_package_id, supplier_organization_id, quote_id, status, due_date, created_at, updated_at, created_by";

// ---------- quotes ----------

export async function getQuoteById(id: string): Promise<Quote | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Quote | null) ?? null;
}

export async function getQuoteFor(
  workPackageId: string,
  supplierOrgId: string,
): Promise<Quote | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_COLUMNS)
    .eq("work_package_id", workPackageId)
    .eq("supplier_organization_id", supplierOrgId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Quote | null) ?? null;
}

export async function listQuotesForSupplier(
  supplierOrgId: string,
): Promise<Quote[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_COLUMNS)
    .eq("supplier_organization_id", supplierOrgId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Quote[];
}

export async function listQuotesByStatus(
  statuses: QuoteStatus[],
): Promise<Quote[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_COLUMNS)
    .in("status", statuses)
    .order("submitted_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Quote[];
}

interface QuoteInsert {
  work_package_id: string;
  supplier_organization_id: string;
  status: QuoteStatus;
  quoted_price?: string | number | null;
  lead_time_days?: number | null;
  minimum_order_quantity?: number | null;
  quote_notes?: string | null;
  submitted_at?: string | null;
  created_by: string;
}

export async function insertQuote(input: QuoteInsert): Promise<Quote> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      work_package_id: input.work_package_id,
      supplier_organization_id: input.supplier_organization_id,
      status: input.status,
      quoted_price: input.quoted_price ?? null,
      lead_time_days: input.lead_time_days ?? null,
      minimum_order_quantity: input.minimum_order_quantity ?? null,
      quote_notes: input.quote_notes ?? null,
      submitted_at: input.submitted_at ?? null,
      created_by: input.created_by,
    })
    .select(QUOTE_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Quote;
}

export async function setQuoteStatus(
  id: string,
  nextStatus: QuoteStatus,
  patch: {
    reviewed_by?: string;
    reviewed_at?: string | null;
    review_notes?: string | null;
  } = {},
): Promise<Quote> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("quotes")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
      ...patch,
    })
    .eq("id", id)
    .select(QUOTE_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Quote;
}

// ---------- jobs ----------

interface JobInsert {
  work_package_id: string;
  supplier_organization_id: string;
  quote_id: string | null;
  due_date: string | null;
  created_by: string;
}

export async function insertJob(input: JobInsert): Promise<Job> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      work_package_id: input.work_package_id,
      supplier_organization_id: input.supplier_organization_id,
      quote_id: input.quote_id,
      status: "awarded",
      due_date: input.due_date,
      created_by: input.created_by,
    })
    .select(JOB_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as Job;
}

// ---------- supplier inbox ----------
// Returns routing decisions assigned to this supplier (quote_requested) plus
// any quote row they've already submitted or declined, for rendering the
// unified supplier quote inbox.

export interface SupplierInboxEntry {
  routing_decision_id: string;
  work_package_id: string;
  work_package_name: string;
  rfq_title: string;
  rfq_priority: string;
  rfq_required_delivery_date: string | null;
  quote_requested_at: string | null;
  existing_quote: Quote | null;
}

export async function listSupplierInbox(
  supplierOrgId: string,
): Promise<SupplierInboxEntry[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("routing_decisions")
    .select(
      `id, work_package_id, quote_requested_at,
       work_packages!inner(
         id, package_name,
         rfqs!inner(rfq_title, priority, required_delivery_date)
       )`,
    )
    .eq("supplier_organization_id", supplierOrgId)
    .eq("routing_status", "quote_requested")
    .order("quote_requested_at", {
      ascending: false,
      nullsFirst: false,
    });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    work_package_id: string;
    quote_requested_at: string | null;
    work_packages: {
      id: string;
      package_name: string;
      rfqs: {
        rfq_title: string;
        priority: string;
        required_delivery_date: string | null;
      };
    };
  }>;

  const entries: SupplierInboxEntry[] = [];
  for (const row of rows) {
    const existing = await getQuoteFor(row.work_package_id, supplierOrgId);
    entries.push({
      routing_decision_id: row.id,
      work_package_id: row.work_package_id,
      work_package_name: row.work_packages.package_name,
      rfq_title: row.work_packages.rfqs.rfq_title,
      rfq_priority: row.work_packages.rfqs.priority,
      rfq_required_delivery_date:
        row.work_packages.rfqs.required_delivery_date,
      quote_requested_at: row.quote_requested_at,
      existing_quote: existing,
    });
  }
  return entries;
}
