"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, resolveMediaUrl } from "../../lib/api";
import useMe from "../../hooks/useMe";
import Nav from "../../components/Nav";
import Avatar from "../../components/Avatar";

type ReelPost = {
  id: string;
  caption?: string | null;
  createdAt: string;
  media: Array<{
    id: string;
    url: string;
    mimeType?: string | null;
    type?: string | null;
  }>;
  author: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  _count?: { likes?: number; comments?: number };
};

function isVideo(mimeType?: string | null, url?: string) {
  if (mimeType?.startsWith("video/")) return true;
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

function clampIndex(i: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(max - 1, i));
}

export default function ReelsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const { me, isLoading: meLoading } = useMe();

  const [items, setItems] = useState<ReelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const activePost = useMemo(() => items[active], [items, active]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiFetch("/feed/reels", { method: "GET" });
        if (cancelled) return;

        const list = Array.isArray(data?.items) ? (data.items as ReelPost[]) : (Array.isArray(data) ? (data as ReelPost[]) : []);
        setItems(list);
        setActive(0);
      } catch (e: any) {
        if (cancelled) return;
        const msg = typeof e?.message === "string" ? e.message : "No se pudieron cargar los reels.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Autoplay del video activo (y pausar el resto)
  useEffect(() => {
    const current = activePost;
    if (!current) return;

    const id = current.id;
    Object.entries(videoRefs.current).forEach(([key, el]) => {
      if (!el) return;
      if (key === id) return;
      try {
        el.pause();
        el.currentTime = 0;
      } catch {}
    });

    const el = videoRefs.current[id];
    if (!el) return;

    const tryPlay = async () => {
      try {
        el.muted = muted;
        await el.play();
      } catch {
        // Autoplay puede fallar en algunos navegadores: se queda en preview con CTA
      }
    };

    tryPlay();
  }, [activePost, muted]);

  // Scroll snap: detectar index activo
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!best) return;

        const idx = Number((best.target as HTMLElement).dataset["index"] ?? "0");
        if (!Number.isNaN(idx)) setActive((prev) => (prev === idx ? prev : idx));
      },
      { root, threshold: [0.6, 0.75, 0.9] }
    );

    const children = Array.from(root.querySelectorAll("[data-reel='1']"));
    children.forEach((c) => observer.observe(c));

    return () => observer.disconnect();
  }, [items.length]);

  const goLogin = () => {
    const next = encodeURIComponent(pathname || "/reels");
    router.push(`/login?next=${next}`);
  };

  const canSee = !meLoading ? !!me : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Nav />
        <div className="mx-auto max-w-md px-4 py-10">
          <div className="text-sm text-white/70">Cargando reels…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Nav />
        <div className="mx-auto max-w-md px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">No se pudieron cargar los reels</div>
            <div className="mt-1 text-sm text-white/70">{error}</div>
            <button
              onClick={() => router.refresh()}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Nav />
        <div className="mx-auto max-w-md px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-base font-semibold">Aún no hay reels</div>
            <div className="mt-1 text-sm text-white/70">Cuando los creadores suban reels, aparecerán aquí.</div>
          </div>
        </div>
      </div>
    );
  }

  // Contenedor full-height con safe-area + espacio bottom-nav
  return (
    <div className="min-h-screen bg-black text-white">
      <Nav />
      <div
        ref={containerRef}
        className="mx-auto w-full max-w-md overflow-y-auto"
        style={{
          height: "calc(100dvh - 56px)",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((post, idx) => {
          const m = post.media?.[0];
          const rawUrl = m?.url || "";
          const url = resolveMediaUrl(rawUrl);

          const video = isVideo(m?.mimeType, rawUrl);

          return (
            <div
              key={post.id}
              data-reel="1"
              data-index={idx}
              className="relative w-full"
              style={{
                height: "calc(100dvh - 56px)",
                scrollSnapAlign: "start",
              }}
            >
              {/* Media */}
              <div className="absolute inset-0">
                {video ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[post.id] = el;
                    }}
                    className="h-full w-full object-cover"
                    src={url}
                    playsInline
                    preload="metadata"
                    muted={muted}
                    loop
                    onError={() => {
                      // fallback: si el video falla, lo dejamos en placeholder
                    }}
                  />
                ) : (
                  // Si no es video, lo renderizamos como imagen
                  // (en reels a veces llegan imágenes)
                  <img className="h-full w-full object-cover" src={url} alt={post.caption || "reel"} />
                )}

                {/* Gradientes overlays */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
              </div>

              {/* CTA premium si no hay sesión (gating IG-like) */}
              {!canSee && (
                <div className="absolute inset-x-4 top-4 z-20 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur">
                  <div className="text-sm font-semibold">Inicia sesión para continuar</div>
                  <div className="mt-1 text-xs text-white/70">Activa tu sesión para ver mensajes, notificaciones y publicar.</div>
                  <button
                    onClick={goLogin}
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  >
                    Iniciar sesión
                  </button>
                </div>
              )}

              {/* Controles */}
              <div
                className="absolute right-4 z-20 flex flex-col items-center gap-4"
                style={{ bottom: "calc(env(safe-area-inset-bottom) + 108px)" }}
              >
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40 backdrop-blur"
                  aria-label={muted ? "Activar sonido" : "Silenciar"}
                  title={muted ? "Activar sonido" : "Silenciar"}
                >
                  {muted ? (
                    <span className="text-xs font-semibold">MUT</span>
                  ) : (
                    <span className="text-xs font-semibold">SND</span>
                  )}
                </button>

                {/* Navegación rápida */}
                <button
                  onClick={() => {
                    const next = clampIndex(active + 1, items.length);
                    setActive(next);
                    const el = containerRef.current?.querySelector(`[data-index='${next}']`) as HTMLElement | null;
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40 backdrop-blur"
                  aria-label="Siguiente"
                  title="Siguiente"
                >
                  <span className="text-xs font-semibold">↓</span>
                </button>

                <button
                  onClick={() => {
                    const prev = clampIndex(active - 1, items.length);
                    setActive(prev);
                    const el = containerRef.current?.querySelector(`[data-index='${prev}']`) as HTMLElement | null;
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40 backdrop-blur"
                  aria-label="Anterior"
                  title="Anterior"
                >
                  <span className="text-xs font-semibold">↑</span>
                </button>
              </div>

              {/* Author overlay */}
              <div className="absolute left-5 right-20" style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}>
                <Link href={`/perfil/${post.author.username}`} className="inline-flex items-center gap-3">
                  <Avatar src={post.author.avatarUrl} alt={post.author.username} size={40} className="border-white/20" />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {post.author.displayName || post.author.username}
                    </div>
                    <div className="text-xs text-white/70">@{post.author.username}</div>
                    {post.caption ? <div className="mt-1 line-clamp-2 text-xs text-white/80">{post.caption}</div> : null}
                  </div>
                </Link>
              </div>

              {/* Placeholder premium si el video queda negro (fallback visual) */}
              {video && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-6">
                  <div
                    className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70 backdrop-blur"
                    style={{ marginBottom: "calc(env(safe-area-inset-bottom) + 56px)" }}
                  >
                    Tip: toca MUT para activar sonido
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
