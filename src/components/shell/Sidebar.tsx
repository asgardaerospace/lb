"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  group?: string;
}

interface SidebarProps {
  items: NavItem[];
  roleLabel: string;
  userLabel?: string;
  userEmail?: string;
}

export function Sidebar({ items, roleLabel, userLabel, userEmail }: SidebarProps) {
  const pathname = usePathname();

  const groups = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.group ?? "";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-800/80 bg-[#050a14]">
      <div className="flex h-16 items-center border-b border-slate-800/80 px-5">
        <Logo />
      </div>

      <div className="border-b border-slate-800/80 px-5 py-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Current context
        </div>
        <div className="mt-1 text-sm font-medium text-slate-200">{roleLabel}</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
        {Object.entries(groups).map(([group, groupItems]) => (
          <div key={group} className="mb-4">
            {group && (
              <div className="px-3 pb-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-600">
                {group}
              </div>
            )}
            <ul className="space-y-0.5">
              {groupItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                        active
                          ? "bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-400/20"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                      }`}
                    >
                      {item.icon && (
                        <span className="flex h-4 w-4 items-center justify-center text-slate-500">
                          {item.icon}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {(userLabel || userEmail) && (
        <div className="border-t border-slate-800/80 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-cyan-300">
              {(userLabel ?? userEmail ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              {userLabel && (
                <div className="truncate text-xs font-medium text-slate-200">
                  {userLabel}
                </div>
              )}
              {userEmail && (
                <div className="truncate text-[11px] text-slate-500">
                  {userEmail}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
