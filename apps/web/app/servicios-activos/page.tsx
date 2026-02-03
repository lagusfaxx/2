"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL, apiFetch, resolveMediaUrl } from "../../lib/api";

type ServiceRequest = {
  id: string;
  status: "PENDING_APPROVAL" | "ACTIVE" | "PENDING_EVALUATION" | "FINISHED";
  createdAt: string;
  professional: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
  };
};

type RequestsResponse = { requests: ServiceRequest[] };

export default function ServiciosActivosPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [ratingValue, setRatingValue] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiFetch<RequestsResponse>("/services/requests?as=client")
      .then((res) => {
        setRequests(res.requests.filter((r) => r.status !== "FINISHED"));
        setError(null);
      })
      .catch((e: any) => setError(e?.message || "No se pudieron cargar los servicios"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const source = new EventSource(`${API_URL}/realtime/stream`, { withCredentials: true });
    const refresh = () => load();
    source.addEventListener("service:update", refresh as EventListener);
    source.addEventListener("service:request", refresh as EventListener);
    return () => {
      source.close();
    };
  }, []);

  const sendRating = async (request: ServiceRequest) => {
    const rating = ratingValue[request.id];
    if (!rating) return;
    await apiFetch(`/ratings/professionals/${request.professional.id}`, {
      method: "POST",
      body: JSON.stringify({ rating })
    });
    await apiFetch(`/services/requests/${request.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "FINISHED" })
    });
    load();
  };

  const statusLabel: Record<ServiceRequest["status"], string> = {
    PENDING_APPROVAL: "Pendiente de Aprobación",
    ACTIVE: "Activo",
    PENDING_EVALUATION: "Pendiente de Evaluación",
    FINISHED: "Finalizado"
  };

  if (loading) return <div className="text-white/70">Cargando servicios...</div>;
  if (error) return <div className="text-red-200">{error}</div>;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Servicios Activos</h1>
        <p className="mt-2 text-sm text-white/70">Gestiona tus servicios en curso y pendientes.</p>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <div key={request.id} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                {request.professional.avatarUrl ? (
                  <img
                    src={resolveMediaUrl(request.professional.avatarUrl) || ""}
                    alt={request.professional.username}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div>
                <div className="font-semibold">{request.professional.displayName || request.professional.username}</div>
                <div className="text-xs text-white/50">{statusLabel[request.status]}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="btn-secondary" href={`/profesionales/${request.professional.id}`}>
                Ver perfil
              </Link>
              <Link className="btn-primary" href={`/chats/${request.professional.id}`}>
                Enviar mensaje
              </Link>
            </div>
            {request.status === "PENDING_EVALUATION" ? (
              <div className="mt-4">
                <div className="text-sm text-white/70">Calificar profesional</div>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      className={ratingValue[request.id] === value ? "btn-primary" : "btn-secondary"}
                      onClick={() => setRatingValue((prev) => ({ ...prev, [request.id]: value }))}
                    >
                      {"❤".repeat(value)}
                    </button>
                  ))}
                </div>
                <button className="btn-primary mt-3" onClick={() => sendRating(request)}>
                  Calificar
                </button>
              </div>
            ) : null}
          </div>
        ))}
        {!requests.length ? (
          <div className="card p-6 text-center text-white/70">No tienes servicios activos.</div>
        ) : null}
      </div>
    </div>
  );
}
