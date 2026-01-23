// apps/web/components/Nav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch, resolveMediaUrl } from "../lib/api";
import CreatePostModal from "./CreatePostModal";
import Avatar from "./Avatar";
import useMe from "../hooks/useMe";

type Notification = {
  id: string;
  type: string;
  data: any;
  createdAt: string;
  readAt: string | null;
};

function Icon({
  name,
}: {
  name:
    | "home"
    | "reels"
    | "services"
    | "search"
    | "bell"
    | "chat"
    | "plus"
    | "settings"
    | "user";
}) {
  const common = "h-5 w-5";

  switch (name) {
    case "home":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" />
        </svg>
      );
    case "reels":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M7 4l4 6" />
          <path d="M11 4l4 6" />
          <path d="M15 4l4 6" />
          <path d="M10 10l6 4-6 4v-8Z" />
        </svg>
      );
    case "services":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />
        </svg>
      );
    case "search":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    case "bell":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );
    case "chat":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8Z" />
        </svg>
      );
    case "plus":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "settings":
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7Z" />
          <path d="M19.4 15a7.97 7.97 0 00.1-1 7.97 7.97 0 00-.1-1l2.1-1.6-2-3.4-2.5 1a7.8 7.8 0 00-1.7-1L15 2h-4l-.4 2.6a7.8 7.8 0 00-1.7 1l-2.5-1-2 3.4L6.6 12a7.97 7.97 0 00-.1 1 7.97 7.97 0 00.1 1L4.5 15.6l2 3.4 2.5-1a7.8 7.8 0 001.7 1L11 22h4l.4-2.6a7.8 7.8 0 001.7-1l2.5 1 2-3.4L19.4 15Z" />
        </svg>
      );
    case "user":
    default:
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21a8 8 0 10-16 0" />
          <circle cx="12" cy="8" r="4" />
        </svg>
      );
  }
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto inline-flex min-w-[22px] items-center justify-center rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white/90">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { me, loading } = useMe();

  const requireAuth = (fn: () => void) => {
    if (loading) return;
    if (!me?.user) {
      const next = pathname || "/";
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    fn();
  };

  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);

  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!me?.user) return;

    let alive = true;

    const load = async () => {
      try {
        const [notifs, inbox] = await Promise.allSettled([
          apiFetch<{ items: Notification[]; unread: number }>("/notifications"),
          apiFetch<{ unread: number }>("/messages/inbox"),
        ]);

        if (!alive) return;

        if (notifs.status === "fulfilled") {
          setNotifications(notifs.value.items || []);
          setUnreadNotifs(notifs.value.unread || 0);
        }

        if (inbox.status === "fulfilled") {
          setUnreadChats(inbox.value.unread || 0);
        }
      } catch {
        // ignore
      }
    };

    load();
    const id = setInterval(load, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [me]);

  const items = [
    { href: "/inicio", label: "Inicio", icon: "home" as const },
    { href: "/reels", label: "Reels", icon: "reels" as const },
    { href: "/servicios", label: "Servicios", icon: "services" as const },
  ];

  const secondary = [
    { action: () => setSearchOpen(true), label: "Buscar", icon: "search" as const },
    {
      action: () => requireAuth(() => setNotifsOpen((o) => !o)),
      label: "Notificaciones",
      icon: "bell" as const,
      badge: unreadNotifs,
    },
    {
      action: () => requireAuth(() => router.push("/chats")),
      label: "Mensajes",
      icon: "chat" as const,
      badge: unreadChats,
    },
    { action: () => requireAuth(() => setCreateOpen(true)), label: "Crear", icon: "plus" as const },
  ];

  const profileHref = me?.user?.username ? `/perfil/${me.user.username}` : "/dashboard";

  return (
    <>
      <aside className="hidden md:flex w-[260px] flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="p-3 flex items-center justify-between">
          <Link href="/inicio" className="flex items-center gap-2">
            <img src="/brand/logo.svg" alt="UZEED" className="h-7 w-auto" />
          </Link>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Colapsar"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="px-2">
          <div className="grid gap-1">
            {items.map((it) => {
              const active = pathname?.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                    active ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span className={`text-white/90 ${active ? "" : "text-white/75"}`}>
                    <Icon name={it.icon} />
                  </span>
                  {!collapsed ? <span className="font-medium">{it.label}</span> : null}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 border-t border-white/10 pt-3 grid gap-1">
            {secondary.map((it) => {
              const key = it.label;
              const active = (it as any).href ? pathname?.startsWith((it as any).href) : false;
              const content = (
                <>
                  <span className={`text-white/90 ${active ? "" : "text-white/75"}`}>
                    <Icon name={it.icon} />
                  </span>
                  {!collapsed ? <span className="font-medium">{it.label}</span> : null}
                  {!collapsed && typeof (it as any).badge === "number" ? <Badge count={(it as any).badge} /> : null}
                </>
              );
              if ((it as any).href) {
                return (
                  <Link
                    key={key}
                    href={(it as any).href}
                    className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                      active ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    {content}
                  </Link>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  onClick={(it as any).action}
                  className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition hover:bg-white/5"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto p-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            {me?.user ? (
              <>
                <Link href={profileHref} className="flex items-center gap-3">
                  <Avatar src={me.user.avatarUrl} alt={me.user.username} size={40} />
                  {!collapsed ? (
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{me.user.displayName || me.user.username}</div>
                      <div className="text-xs text-white/70 truncate">@{me.user.username}</div>
                    </div>
                  ) : null}
                </Link>
                {!collapsed ? (
                  <div className="mt-3 grid gap-1">
                    <Link
                      href="/configuracion"
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                    >
                      <Icon name="settings" />
                      <span>Configuración</span>
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await apiFetch("/auth/logout", { method: "POST" });
                        } catch {}
                        router.push("/login");
                      }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                    >
                      <span className="h-5 w-5 rounded-full border border-white/20" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                onClick={() => router.push(`/login?next=${encodeURIComponent(pathname || "/")}`)}
                className="w-full rounded-2xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Modals */}
      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Notifications drawer */}
      {notifsOpen ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setNotifsOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm border-l border-white/10 bg-black/70 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-white">Notificaciones</div>
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
                onClick={() => setNotifsOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              {notifications.length ? (
                notifications.slice(0, 25).map((n) => (
                  <div key={n.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-sm text-white/90">{n.type}</div>
                    <div className="text-xs text-white/60">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  Sin notificaciones.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Search drawer (placeholder) */}
      {searchOpen ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSearchOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-full max-w-sm border-r border-white/10 bg-black/70 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-white">Buscar</div>
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
                onClick={() => setSearchOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              (WIP) búsqueda
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
