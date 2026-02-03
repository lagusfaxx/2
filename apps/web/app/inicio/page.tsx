"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";

type Category = {
  id: string;
  name: string;
  type: "PROFESSIONAL" | "ESTABLISHMENT";
  iconUrl?: string | null;
};

type CategoriesResponse = { categories: Category[] };

export default function InicioPage() {
  const router = useRouter();
  const [professionalCategories, setProfessionalCategories] = useState<Category[]>([]);
  const [establishmentCategories, setEstablishmentCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<CategoriesResponse>("/categories?type=PROFESSIONAL"),
      apiFetch<CategoriesResponse>("/categories?type=ESTABLISHMENT")
    ])
      .then(([pro, est]) => {
        setProfessionalCategories(pro.categories);
        setEstablishmentCategories(est.categories);
      })
      .catch((e: any) => setError(e?.message || "No se pudieron cargar las categorías"))
      .finally(() => setLoading(false));
  }, []);

  const goToCategory = (category: Category) => {
    const base = category.type === "PROFESSIONAL" ? "/buscar/profesionales" : "/buscar/establecimientos";
    router.push(`${base}?categoryId=${category.id}`);
  };

  if (loading) return <div className="text-white/70">Cargando categorías...</div>;
  if (error) return <div className="text-red-200">{error}</div>;

  return (
    <div className="grid gap-8">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">¿Qué estás buscando?</h1>
        <p className="mt-2 text-sm text-white/70">Selecciona una categoría para descubrir profesionales y establecimientos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Categorías de Profesionales</h2>
          <div className="mt-4 grid gap-3">
            {professionalCategories.map((category) => (
              <button
                key={category.id}
                className="w-full rounded-2xl border border-white/10 bg-gradient-to-r from-purple-500/30 to-pink-500/30 px-4 py-3 text-left text-sm font-semibold text-white hover:border-white/30"
                onClick={() => goToCategory(category)}
              >
                {category.name}
              </button>
            ))}
            {!professionalCategories.length ? (
              <div className="text-sm text-white/50">No hay categorías profesionales configuradas.</div>
            ) : null}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold">Categorías de Establecimientos</h2>
          <div className="mt-4 grid gap-3">
            {establishmentCategories.map((category) => (
              <button
                key={category.id}
                className="w-full rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/30 to-blue-500/30 px-4 py-3 text-left text-sm font-semibold text-white hover:border-white/30"
                onClick={() => goToCategory(category)}
              >
                {category.name}
              </button>
            ))}
            {!establishmentCategories.length ? (
              <div className="text-sm text-white/50">No hay categorías de establecimientos configuradas.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
