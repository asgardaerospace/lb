import { RoleShell } from "@/components/shell/RoleShell";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShell role="buyer">{children}</RoleShell>;
}
