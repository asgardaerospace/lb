import AdminApplicationReview from "@/components/supplier-application/AdminApplicationReview";

export const dynamic = "force-dynamic";

export default async function AdminSupplierApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminApplicationReview id={id} />;
}
