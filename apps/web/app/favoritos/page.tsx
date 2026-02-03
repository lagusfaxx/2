"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, resolveMediaUrl } from "../../lib/api";

type Favorite = {
  id: string;
  createdAt: string;
  professional: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
    category: string | null;
    rating: number | null;
  };
};

type FavoritesResponse = { favorites: Favorite[] };

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<FavoritesResponse>("/favorites")
      .then((res) => {
        setFavorites(res.favorites);
        setError(null);
      })
      .catch((e: any) => setError(e?.message || "No se pudieron cargar los favoritos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white/70">Cargando favoritos...</div>;
  if (error) return <div className="text-red-200">{error}</div>;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Favoritos</h1>
        <p className="mt-2 text-sm text-white/70">Profesionales guardadas para acceso rápido.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {favorites.map((fav) => (
          <div key={fav.id} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
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
                <div className="text-xs text-white/50">{fav.professional.category || "Profesional"}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-white/50">Rating {fav.professional.rating ?? "N/D"}</div>
            <div className="mt-4 flex gap-2">
              <Link className="btn-secondary" href={`/profesionales/${fav.professional.id}`}>
                Ver perfil
              </Link>
              <Link className="btn-primary" href={`/chats/${fav.professional.id}`}>
                Enviar mensaje
              </Link>
            </div>
          </div>
        ))}
        {!favorites.length ? (
          <div className="card p-6 text-center text-white/70">No tienes favoritos aún.</div>
        ) : null}
      </div>
    </div>
  );
}
