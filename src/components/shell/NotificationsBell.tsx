"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";

interface Notification {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

// Polling backstops Supabase Realtime — Realtime is best-effort, but the
// poll keeps the bell honest if the websocket drops or a delivery is missed.
// Cadence is generous because Realtime carries the live updates.
const POLL_INTERVAL_MS = 120_000;

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diff = Date.now() - ts;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const refresh = async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
      setLoaded(true);
    } catch {
      // ignore — keep current
    }
  };

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await refresh();
    };
    void tick();
    const t = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // Realtime: subscribe to inserts + updates on the user's notifications. We
  // resolve the auth user id inside the effect so we don't have to thread it
  // through props (the bell is rendered from a server shell). Falls back
  // gracefully if Supabase env or auth is unavailable.
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      let sb;
      try {
        sb = createBrowserSupabase();
      } catch {
        return;
      }
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (cancelled || !user) return;

      const channel = sb
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void refresh();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void refresh();
          },
        )
        .subscribe();

      cleanup = () => {
        sb.removeChannel(channel);
      };
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [open]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setItems((rows) =>
        rows.map((r) => ({ ...r, read_at: r.read_at ?? new Date().toISOString() })),
      );
      setUnread(0);
    } catch {
      // ignore
    }
  }

  async function markOne(id: string) {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setItems((rows) =>
        rows.map((r) =>
          r.id === id ? { ...r, read_at: r.read_at ?? new Date().toISOString() } : r,
        ),
      );
      setUnread((n) => Math.max(0, n - 1));
    } catch {
      // ignore
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-100"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-40 w-[360px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              Notifications
            </span>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="text-[11px] text-cyan-300 transition hover:text-cyan-200 disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
            {!loaded ? (
              <div className="px-3 py-6 text-center text-xs text-slate-500">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-slate-500">
                No notifications yet.
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {items.map((n) => {
                  const unreadDot = !n.read_at;
                  const inner = (
                    <div className="flex gap-2 px-3 py-2.5">
                      <span
                        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                          unreadDot ? "bg-cyan-400" : "bg-transparent"
                        }`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate text-sm ${
                              unreadDot ? "text-slate-100 font-medium" : "text-slate-400"
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            {formatRelative(n.created_at)}
                          </span>
                        </div>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                            {n.body}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.href ? (
                        <Link
                          href={n.href}
                          onClick={() => {
                            if (unreadDot) markOne(n.id);
                            setOpen(false);
                          }}
                          className="block transition hover:bg-slate-900/70"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => unreadDot && markOne(n.id)}
                          className="block w-full text-left transition hover:bg-slate-900/70"
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
