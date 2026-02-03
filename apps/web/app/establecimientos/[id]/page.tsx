"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, resolveMediaUrl } from "../../../lib/api";

type Establishment = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
  rating: number | null;
  media: { id: string; type: "IMAGE" | "VIDEO"; url: string }[];
};

type EstablishmentResponse = { establishment: Establishment };

type RatingResponse = { rating: { id: string; rating: number } };

export default function EstablishmentProfilePage() {
  const params = useParams();
  const id = String(params.id || "");
  const [profile, setProfile] = useState<Establishment | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<EstablishmentResponse>(`/establishments/${id}`)
      .then((res) => {
        setProfile(res.establishment);
        setError(null);
      })
      .catch((e: any) => setError(e?.message || "No se pudo cargar la ficha"))
      .finally(() => setLoading(false));
  }, [id]);

  const submitRating = async () => {
    if (ratingValue < 1) return;
    try {
      await apiFetch<RatingResponse>(`/ratings/establishments/${id}`, {
        method: "POST",
        body: JSON.stringify({ rating: ratingValue, comment })
      });
      setComment("");
    } catch (e: any) {
      setError(e?.message || "No se pudo enviar la calificación");
    }
  };

  if (loading) return <div className="text-white/70">Cargando establecimiento...</div>;
  if (error) return <div className="text-red-200">{error}</div>;
  if (!profile) return null;

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">{profile.name}</h1>
        <p className="mt-1 text-sm text-white/60">{profile.city || "Ciudad"}</p>
        <p className="mt-2 text-sm text-white/70">{profile.description || "Descripción no disponible"}</p>
        <div className="mt-3 text-xs text-white/50">
          Dirección: {profile.address || "N/D"} · Teléfono: {profile.phone || "N/D"}
        </div>
        <div className="mt-2 text-xs text-white/50">Rating {profile.rating ?? "N/D"}</div>
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
        <h2 className="text-lg font-semibold">Calificar establecimiento</h2>
        <p className="mt-2 text-sm text-white/60">1 a 5 estrellas (comentario opcional).</p>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              className={ratingValue === value ? "btn-primary" : "btn-secondary"}
              onClick={() => setRatingValue(value)}
            >
              {"★".repeat(value)}
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
