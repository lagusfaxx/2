"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, resolveMediaUrl } from "../../../lib/api";

type Establishment = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
  rating: number | null;
  distance: number | null;
  media: { id: string; type: "IMAGE" | "VIDEO"; url: string }[];
  isActive: boolean;
};

type SearchResponse = { establishments: Establishment[] };

export default function BuscarEstablecimientosPage() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";
  const [range, setRange] = useState(10);
  const [minRating, setMinRating] = useState(0);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("range", String(range));
    if (minRating > 0) params.set("rating", String(minRating));
    if (categoryId) params.set("categoryId", categoryId);
    if (userLocation) {
      params.set("lat", String(userLocation[0]));
      params.set("lng", String(userLocation[1]));
    }
    return params.toString();
  }, [range, minRating, categoryId, userLocation]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => null
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    apiFetch<SearchResponse>(`/establishments/search?${queryString}`)
      .then((res) => {
        setEstablishments(res.establishments);
        setError(null);
      })
      .catch((e: any) => setError(e?.message || "No se pudo cargar la búsqueda"))
      .finally(() => setLoading(false));
  }, [queryString]);

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Búsqueda de Establecimientos</h1>
        <p className="mt-2 text-sm text-white/70">Filtra por rango, calificación y categoría seleccionada.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-white/70">
            Rango máximo (km)
            <input
              type="range"
              min={1}
              max={50}
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-white/60">{range} km</span>
          </label>
          <label className="text-sm text-white/70">
            Calificación mínima
            <input
              type="range"
              min={0}
              max={5}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-white/60">{minRating} estrellas</span>
          </label>
        </div>
      </div>

      {loading ? <div className="text-white/70">Cargando establecimientos...</div> : null}
      {error ? <div className="text-red-200">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {establishments.map((e) => (
          <div key={e.id} className={`card p-5 border-2 ${e.isActive ? "border-sky-500/40" : "border-amber-500/40"}`}>
            {e.media?.[0]?.url ? (
              <img
                src={resolveMediaUrl(e.media[0].url) || ""}
                alt={e.name}
                className="h-40 w-full rounded-xl object-cover"
              />
            ) : null}
            <div className="mt-3 font-semibold">{e.name}</div>
            <div className="text-xs text-white/60">{e.city || "Ciudad N/D"}</div>
            <div className="mt-2 text-xs text-white/50">
              Rating {e.rating ?? "N/D"} · {e.distance ? `${e.distance.toFixed(1)} km` : "Distancia N/D"}
            </div>
            <div className="mt-3 flex gap-2">
              <Link className="btn-secondary" href={`/establecimientos/${e.id}`}>
                Ver ficha
              </Link>
            </div>
          </div>
        ))}
        {!loading && !establishments.length ? (
          <div className="card p-6 text-center text-white/70">
            No hay establecimientos con estos filtros.
          </div>
        ) : null}
      </div>
    </div>
  );
}
