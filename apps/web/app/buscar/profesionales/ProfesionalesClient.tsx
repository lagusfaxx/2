"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, resolveMediaUrl } from "../../../lib/api";

type Professional = {
  id: string;
  displayName: string | null;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  serviceCategory: string | null;
  gender: string | null;
  isActive: boolean;
  isOnline: boolean;
  plan: "PREMIUM" | "GOLD" | "SILVER" | null;
  rating: number | null;
  distance: number | null;
};

type SearchResponse = { professionals: Professional[] };

const planOptions = [
  { label: "Premium", value: "PREMIUM" },
  { label: "Gold", value: "GOLD" },
  { label: "Silver", value: "SILVER" }
];

export default function BuscarProfesionalesPage() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";
  const [range, setRange] = useState(10);
  const [gender, setGender] = useState("ALL");
  const [plan, setPlan] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("range", String(range));
    if (gender !== "ALL") params.set("gender", gender);
    if (plan) params.set("plan", plan);
    if (categoryId) params.set("categoryId", categoryId);
    if (activeOnly) params.set("active", "true");
    if (userLocation) {
      params.set("lat", String(userLocation[0]));
      params.set("lng", String(userLocation[1]));
    }
    return params.toString();
  }, [range, gender, plan, categoryId, activeOnly, userLocation]);

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
    apiFetch<SearchResponse>(`/professionals/search?${queryString}`)
      .then((res) => {
        setProfessionals(res.professionals);
        setError(null);
      })
      .catch((e: any) => setError(e?.message || "No se pudo cargar la búsqueda"))
      .finally(() => setLoading(false));
  }, [queryString]);

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Búsqueda de Profesionales</h1>
        <p className="mt-2 text-sm text-white/70">Ajusta tu rango, género y plan para encontrar profesionales activas.</p>
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
          <div>
            <div className="text-sm text-white/70">Género</div>
            <div className="mt-2 flex gap-2">
              {[
                { label: "Todos", value: "ALL" },
                { label: "M", value: "MALE" },
                { label: "F", value: "FEMALE" },
                { label: "Otro", value: "OTHER" }
              ].map((g) => (
                <button
                  key={g.value}
                  className={gender === g.value ? "btn-primary" : "btn-secondary"}
                  onClick={() => setGender(g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm text-white/70">Plan</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {planOptions.map((p) => (
                <button
                  key={p.value}
                  className={plan === p.value ? "btn-primary" : "btn-secondary"}
                  onClick={() => setPlan(plan === p.value ? null : p.value)}
                >
                  {plan === p.value ? `Solo ${p.label}` : `Solo ${p.label}`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="activeOnly"
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            <label htmlFor="activeOnly" className="text-sm text-white/70">
              Mostrar solo activas
            </label>
          </div>
        </div>
      </div>

      {loading ? <div className="text-white/70">Cargando profesionales...</div> : null}
      {error ? <div className="text-red-200">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {professionals.map((p) => (
          <div
            key={p.id}
            className={`card p-5 border-2 ${p.isActive ? "border-emerald-500/40" : "border-amber-500/40"}`}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                {p.avatarUrl ? (
                  <img src={resolveMediaUrl(p.avatarUrl) || ""} alt={p.username} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div>
                <div className="font-semibold">{p.displayName || p.username}</div>
                <div className="text-xs text-white/50">{p.serviceCategory || "Profesional"}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-white/60">
              {p.plan ? `Plan ${p.plan}` : "Plan estándar"} · Rating {p.rating ?? "N/D"}
            </div>
            <div className="mt-1 text-xs text-white/50">
              {p.isActive ? "Activa" : "Inactiva"} · {p.isOnline ? "Online" : "Offline"} · {p.distance ? `${p.distance.toFixed(1)} km` : "Distancia N/D"}
            </div>
            <div className="mt-4 flex gap-2">
              <Link className="btn-secondary" href={`/profesionales/${p.id}`}>
                Ver ficha
              </Link>
              <Link className="btn-primary" href={`/chats/${p.id}`}>
                Enviar mensaje
              </Link>
            </div>
          </div>
        ))}
        {!loading && !professionals.length ? (
          <div className="card p-6 text-center text-white/70">
            No hay profesionales con estos filtros.
          </div>
        ) : null}
      </div>
    </div>
  );
}
