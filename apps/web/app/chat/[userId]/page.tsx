"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, API_URL, resolveMediaUrl } from "../../../lib/api";

type Message = {
  id: string;
  fromId: string;
  toId: string;
  body: string;
  createdAt: string;
};

type ChatUser = {
  id: string;
  displayName: string | null;
  username: string;
  avatarUrl: string | null;
  profileType: string;
  city: string | null;
};

type MeResponse = {
  user: { id: string; displayName: string | null; username: string } | null;
};

export default function ChatPage() {
  const params = useParams();
  const userId = String(params.userId || "");
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<ChatUser | null>(null);
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [serviceRequestId, setServiceRequestId] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<string | null>(null);

  async function load() {
    const [meResp, msgResp, requestResp] = await Promise.all([
      apiFetch<MeResponse>("/auth/me"),
      apiFetch<{ messages: Message[]; other: ChatUser }>(`/messages/${userId}`),
      apiFetch<{ requests: any[] }>(`/services/requests?as=client`)
    ]);
    if (!meResp.user) {
      window.location.href = "/login";
      return;
    }
    setMe(meResp.user);
    setMessages(msgResp.messages);
    setOther(msgResp.other);
    const existing = requestResp.requests.find((r) => r.professional?.id === userId);
    if (existing) {
      setServiceRequestId(existing.id);
      setServiceStatus(existing.status);
    }
  }

  useEffect(() => {
    load()
      .catch((e: any) => {
        if (e?.status === 403) {
          setError("No puedes iniciar chat con este perfil. Suscríbete o espera a que habilite mensajes.");
        } else {
          setError(e?.message || "Error");
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const source = new EventSource(`${API_URL}/realtime/stream`, { withCredentials: true });
    const onMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { message: Message };
        const message = payload.message;
        if (message.fromId === userId || message.toId === userId) {
          setMessages((prev) => [...prev, message]);
        }
      } catch {
        return;
      }
    };
    const onService = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { requestId: string; status: string; professionalId: string; clientId: string };
        if (payload.professionalId === userId || payload.clientId === userId) {
          setServiceRequestId(payload.requestId);
          setServiceStatus(payload.status);
        }
      } catch {
        return;
      }
    };

    source.addEventListener("message:new", onMessage as EventListener);
    source.addEventListener("service:update", onService as EventListener);
    source.addEventListener("service:request", onService as EventListener);
    return () => {
      source.close();
    };
  }, [userId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!legalAccepted) {
      setError("Debes aceptar la advertencia legal antes de chatear.");
      return;
    }
    if (!body.trim() && !attachment) return;
    try {
      if (attachment) {
        const form = new FormData();
        form.append("file", attachment);
        const res = await fetch(`${API_URL}/messages/${userId}/attachment`, {
          method: "POST",
          credentials: "include",
          body: form
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`ATTACHMENT_FAILED ${res.status}: ${t}`);
        }
        const payload = (await res.json()) as { message: Message };
        setMessages((prev) => [...prev, payload.message]);
        setAttachment(null);
      }
      if (body.trim()) {
        const msg = await apiFetch<{ message: Message }>(`/messages/${userId}`, {
          method: "POST",
          body: JSON.stringify({ body })
        });
        setMessages((prev) => [...prev, msg.message]);
        setBody("");
      }
    } catch (e: any) {
      setError(e?.message || "No se pudo enviar el mensaje");
    }
  }

  if (loading) return <div className="text-white/70">Cargando chat...</div>;
  if (error) return <div className="text-red-200">{error}</div>;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
            {other?.avatarUrl ? (
              <img
                src={resolveMediaUrl(other.avatarUrl) || ""}
                alt={other.username}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <h1 className="text-lg font-semibold">{other?.displayName || other?.username || "Chat"}</h1>
            {other ? (
              <p className="text-xs text-white/60">
                @{other.username} • {other.profileType === "SHOP" ? "Negocio" : other.profileType === "PROFESSIONAL" ? "Profesional" : "Creadora"}
                {other.city ? ` • ${other.city}` : ""}
              </p>
            ) : (
              <p className="text-xs text-white/60">Conversación segura para coordinar.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs text-amber-100">
          Advertencia legal: este chat es interno y sujeto a normas de seguridad. Al continuar aceptas el uso responsable
          de la plataforma.
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={legalAccepted}
              onChange={(e) => setLegalAccepted(e.target.checked)}
            />
            Acepto la advertencia legal.
          </label>
        </div>
        <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-2">
          {messages.map((m) => {
            const isImage = m.body.startsWith("ATTACHMENT_IMAGE:");
            const imageUrl = isImage ? resolveMediaUrl(m.body.replace("ATTACHMENT_IMAGE:", "")) : null;
            return (
              <div
                key={m.id}
                className={`rounded-xl px-4 py-3 text-sm ${
                  m.fromId === me?.id ? "bg-purple-500/20 text-white ml-auto" : "bg-white/5 text-white/80"
                }`}
              >
                {isImage && imageUrl ? (
                  <img src={imageUrl} alt="Adjunto" className="max-w-[220px] rounded-lg border border-white/10" />
                ) : (
                  <div>{m.body}</div>
                )}
                <div className="mt-1 text-[10px] text-white/40">
                  {new Date(m.createdAt).toLocaleString("es-CL")}
                </div>
              </div>
            );
          })}
          {!messages.length ? <div className="text-white/50">Aún no hay mensajes.</div> : null}
        </div>

        <form onSubmit={send} className="mt-4 flex flex-wrap gap-3 items-center">
          <input
            className="input flex-1"
            placeholder="Escribe tu mensaje..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className="text-xs text-white/70"
          />
          <button className="btn-primary">Enviar</button>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className="btn-secondary"
            onClick={async () => {
              try {
                const res = await apiFetch<{ request: { id: string; status: string } }>("/services/requests", {
                  method: "POST",
                  body: JSON.stringify({ professionalId: userId })
                });
                setServiceRequestId(res.request.id);
                setServiceStatus(res.request.status);
              } catch (e: any) {
                setError(e?.message || "No se pudo solicitar el servicio");
              }
            }}
          >
            SOLICITAR SERVICIO
          </button>
          {serviceStatus ? (
            <span className="text-xs text-white/60">Estado: {serviceStatus}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
