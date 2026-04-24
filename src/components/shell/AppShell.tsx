import { Sidebar, type NavItem } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
  nav: NavItem[];
  roleLabel: string;
  userLabel?: string;
  userEmail?: string;
  topbarRight?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  nav,
  roleLabel,
  userLabel,
  userEmail,
  topbarRight,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)] text-slate-200">
      <Sidebar
        items={nav}
        roleLabel={roleLabel}
        userLabel={userLabel}
        userEmail={userEmail}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar right={topbarRight} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1400px] px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
