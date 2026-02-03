"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, resolveMediaUrl } from "../../../lib/api";

type Professional = {
  id: string;
  displayName: string | null;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  serviceCategory: string | null;
  serviceDescription: string | null;
  city: string | null;
  address: string | null;
  isActive: boolean;
  isOnline: boolean;
  plan: string | null;
  rating: number | null;
  media: { id: string; type: "IMAGE" | "VIDEO"; url: string }[];
};

type ProfessionalResponse = { professional: Professional };

type FavoriteResponse = { favorite: { id: string } };

type RatingResponse = { rating: { id: string; rating: number } };

export default function ProfessionalProfilePage() {
  const params = useParams();
  const id = String(params.id || "");
  const [profile, setProfile] = useState<Professional | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ProfessionalResponse>(`/professionals/${id}`)
      .then((res) => {
        setProfile(res.professional);
        setError(null);
      })
      .catch((e: any) => setError(e?.message || "No se pudo cargar la ficha"))
      .finally(() => setLoading(false));

    apiFetch<{ favorites: { professional: { id: string } }[] }>("/favorites")
      .then((fav) => setFavorite(fav.favorites.some((f) => f.professional.id === id)))
      .catch(() => null);
  }, [id]);

  const toggleFavorite = async () => {
    try {
      if (!favorite) {
        await apiFetch<FavoriteResponse>(`/favorites/${id}`, { method: "POST" });
        setFavorite(true);
      } else {
        await apiFetch(`/favorites/${id}`, { method: "DELETE" });
        setFavorite(false);
      }
    } catch (e: any) {
      setError(e?.message || "No se pudo actualizar favoritos");
    }
  };

  const submitRating = async () => {
    if (ratingValue < 1) return;
    try {
      await apiFetch<RatingResponse>(`/ratings/professionals/${id}`, {
        method: "POST",
        body: JSON.stringify({ rating: ratingValue, comment })
      });
      setComment("");
    } catch (e: any) {
      setError(e?.message || "No se pudo enviar la calificación");
    }
  };

  if (loading) return <div className="text-white/70">Cargando perfil...</div>;
  if (error) return <div className="text-red-200">{error}</div>;
  if (!profile) return null;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/10 border border-white/10 overflow-hidden">
              {profile.avatarUrl ? (
                <img src={resolveMediaUrl(profile.avatarUrl) || ""} alt={profile.username} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{profile.displayName || profile.username}</h1>
              <p className="text-sm text-white/60">
                {profile.serviceCategory || "Profesional"} · {profile.isOnline ? "Online" : "Offline"}
              </p>
              <p className="text-xs text-white/50">Rating {profile.rating ?? "N/D"} · Plan {profile.plan ?? "Básico"}</p>
            </div>
          </div>
          <button className="btn-secondary" onClick={toggleFavorite}>
            {favorite ? "❤ En favoritos" : "♡ Agregar a favoritos"}
          </button>
        </div>
        <p className="mt-4 text-sm text-white/70">{profile.serviceDescription || profile.bio || "Perfil profesional"}</p>
        <div className="mt-4 flex gap-2">
          <Link className="btn-primary" href={`/chats/${profile.id}`}>
            Enviar mensaje
          </Link>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Galería</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.media?.map((item) => (
            <img
              key={item.id}
              src={resolveMediaUrl(item.url) || ""}
              alt="Galería"
              className="h-40 w-full rounded-xl object-cover"
            />
          ))}
          {!profile.media?.length ? <div className="text-sm text-white/50">Sin fotos disponibles.</div> : null}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Calificar profesional</h2>
        <p className="mt-2 text-sm text-white/60">1 a 5 corazones (comentario opcional).</p>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              className={ratingValue === value ? "btn-primary" : "btn-secondary"}
              onClick={() => setRatingValue(value)}
            >
              {"❤".repeat(value)}
            </button>
          ))}
        </div>
        <textarea
          className="input mt-4 min-h-[120px]"
          placeholder="Comentario opcional"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button className="btn-primary mt-3" onClick={submitRating}>
          Calificar
        </button>
      </div>
    </div>
  );
}
