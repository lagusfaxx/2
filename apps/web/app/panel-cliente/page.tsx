"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, resolveMediaUrl } from "../../lib/api";

type Favorite = {
  id: string;
  professional: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
  };
};

type ViewItem = {
  id: string;
  createdAt: string;
  profile: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
    profileType: string;
  };
};

type ServiceRequest = {
  id: string;
  status: string;
  professional: { id: string; displayName: string | null; username: string };
  createdAt: string;
};

type MeResponse = {
  user: { anonymousMode: boolean } | null;
};

export default function PanelClientePage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [views, setViews] = useState<ViewItem[]>([]);
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      apiFetch<{ favorites: Favorite[] }>("/favorites"),
      apiFetch<{ views: ViewItem[] }>("/profile/views"),
      apiFetch<{ requests: ServiceRequest[] }>("/services/requests?as=client"),
      apiFetch<MeResponse>("/auth/me")
    ])
      .then(([fav, view, service, me]) => {
        setFavorites(fav.favorites);
        setViews(view.views);
        setServices(service.requests);
        setAnonymousMode(Boolean(me.user?.anonymousMode));
        setError(null);
      })
      .catch((e: any) => setError(e?.message || "No se pudo cargar el panel"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAnonymous = async () => {
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({ anonymousMode: String(!anonymousMode) })
      });
      setAnonymousMode((prev) => !prev);
    } catch (e: any) {
      setError(e?.message || "No se pudo actualizar la privacidad");
    }
  };

  if (loading) return <div className="text-white/70">Cargando panel...</div>;
  if (error) return <div className="text-red-200">{error}</div>;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Panel Cliente</h1>
        <p className="mt-2 text-sm text-white/70">Tus favoritos, historial y ajustes de privacidad.</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Modo anónimo</h2>
        <p className="mt-2 text-sm text-white/60">Oculta tu identidad al navegar y chatear según las reglas.</p>
        <button className="btn-primary mt-3" onClick={toggleAnonymous}>
          {anonymousMode ? "Desactivar" : "Activar"} modo anónimo
        </button>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Favoritos</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {favorites.map((fav) => (
            <div key={fav.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                  {fav.professional.avatarUrl ? (
                    <img
                      src={resolveMediaUrl(fav.professional.avatarUrl) || ""}
                      alt={fav.professional.username}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <div className="font-semibold">{fav.professional.displayName || fav.professional.username}</div>
                  <div className="text-xs text-white/50">@{fav.professional.username}</div>
                </div>
              </div>
              <div className="mt-3">
                <Link className="btn-secondary" href={`/profesionales/${fav.professional.id}`}>
                  Ver perfil
                </Link>
              </div>
            </div>
          ))}
          {!favorites.length ? <div className="text-sm text-white/50">Sin favoritos.</div> : null}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Historial de vistas</h2>
        <div className="mt-4 grid gap-3">
          {views.map((view) => (
            <div key={view.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex justify-between">
              <div>
                <div className="font-semibold">{view.profile.displayName || view.profile.username}</div>
                <div className="text-xs text-white/50">{new Date(view.createdAt).toLocaleString("es-CL")}</div>
              </div>
              <Link className="btn-secondary" href={`/profesionales/${view.profile.id}`}>
                Abrir
              </Link>
            </div>
          ))}
          {!views.length ? <div className="text-sm text-white/50">Sin historial de vistas.</div> : null}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Historial de servicios</h2>
        <div className="mt-4 grid gap-3">
          {services.map((service) => (
            <div key={service.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex justify-between">
              <div>
                <div className="font-semibold">{service.professional.displayName || service.professional.username}</div>
                <div className="text-xs text-white/50">{service.status}</div>
              </div>
              <Link className="btn-secondary" href={`/profesionales/${service.professional.id}`}>
                Ver
              </Link>
            </div>
          ))}
          {!services.length ? <div className="text-sm text-white/50">Sin servicios registrados.</div> : null}
        </div>
      </div>
    </div>
  );
}
