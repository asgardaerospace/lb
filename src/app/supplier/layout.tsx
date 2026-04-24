import { RoleShell } from "@/components/shell/RoleShell";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShell role="supplier">{children}</RoleShell>;
}
