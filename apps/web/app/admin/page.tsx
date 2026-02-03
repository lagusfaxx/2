"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_URL } from "../../lib/api";

type MeResponse = {
  user: { id: string; role: "USER" | "ADMIN" | "STAFF" | "SUPPORT"; displayName: string | null } | null;
};

type Post = {
  id: string;
  title: string;
  body: string;
  isPublic: boolean;
  price: number;
  createdAt: string;
  media: { id: string; type: "IMAGE" | "VIDEO"; url: string }[];
};

type ListResp = { posts: Post[] };
type StatsResp = { users: number; posts: number; payments: number };

type Category = { id: string; name: string; type: "PROFESSIONAL" | "ESTABLISHMENT"; iconUrl?: string | null };
type Plan = { id: string; name: string; tier: "PREMIUM" | "GOLD" | "SILVER"; price: number; active: boolean };
type Establishment = { id: string; name: string; city: string | null; address: string | null; phone: string | null; isActive: boolean };
type ServiceRequest = { id: string; status: string; client: { username: string }; professional: { username: string } };
type Rating = { id: string; rating: number; comment?: string | null };
type Banner = { id: string; title: string; imageUrl: string; active: boolean };
type FeaturedProfile = { id: string; profile: { username: string }; rank: number };
type AdminUser = { id: string; username: string; role: string; profileType: string; isActive: boolean };
type ChatMessage = { id: string; body: string; from: { username: string }; to: { username: string }; createdAt: string };
type Payment = { id: string; amount: number; status: string; createdAt: string };
type AuditLog = { id: string; action: string; entity: string; createdAt: string; admin: { username: string } };

export default function AdminPage() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<StatsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState(0);
  const [isPublic, setIsPublic] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [creating, setCreating] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [ratingsPro, setRatingsPro] = useState<Rating[]>([]);
  const [ratingsEst, setRatingsEst] = useState<Rating[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [featured, setFeatured] = useState<FeaturedProfile[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [newCategory, setNewCategory] = useState({ name: "", type: "PROFESSIONAL", iconUrl: "" });
  const [newPlan, setNewPlan] = useState({ name: "", tier: "PREMIUM", price: 0 });
  const [newEstablishment, setNewEstablishment] = useState({ name: "", city: "", address: "", phone: "" });
  const [newBanner, setNewBanner] = useState({ title: "", imageUrl: "" });
  const [newFeatured, setNewFeatured] = useState({ profileId: "", rank: 0 });

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList) {
      setFiles(null);
      return;
    }
    const valid = Array.from(fileList).every((file) => {
      const okType = file.type.startsWith("image/") || file.type.startsWith("video/");
      const okSize = file.size <= 100 * 1024 * 1024;
      return okType && okSize;
    });
    if (!valid) {
      setFileError("Solo se permiten imágenes o videos (máximo 100MB).");
      return;
    }
    setFileError(null);
    setFiles(fileList);
  };

  async function load() {
    const m = await apiFetch<MeResponse>("/auth/me");
    if (!m.user) {
      window.location.href = "/login";
      return;
    }
    if (!["ADMIN", "STAFF", "SUPPORT"].includes(m.user.role)) {
      window.location.href = "/dashboard";
      return;
    }
    setMe(m.user);
    const [
      r,
      s,
      categoriesResp,
      plansResp,
      establishmentsResp,
      serviceResp,
      ratingsProResp,
      ratingsEstResp,
      bannersResp,
      featuredResp,
      usersResp,
      chatsResp,
      paymentsResp,
      auditResp
    ] = await Promise.all([
      apiFetch<ListResp>("/admin/posts"),
      apiFetch<StatsResp>("/admin/stats"),
      apiFetch<{ categories: Category[] }>("/admin/categories"),
      apiFetch<{ plans: Plan[] }>("/admin/plans"),
      apiFetch<{ establishments: Establishment[] }>("/admin/establishments"),
      apiFetch<{ requests: ServiceRequest[] }>("/admin/service-requests"),
      apiFetch<{ ratings: Rating[] }>("/admin/ratings/professionals"),
      apiFetch<{ ratings: Rating[] }>("/admin/ratings/establishments"),
      apiFetch<{ banners: Banner[] }>("/admin/banners"),
      apiFetch<{ featured: FeaturedProfile[] }>("/admin/featured"),
      apiFetch<{ users: AdminUser[] }>("/admin/users"),
      apiFetch<{ messages: ChatMessage[] }>("/admin/chats"),
      apiFetch<{ payments: Payment[] }>("/admin/payments"),
      apiFetch<{ logs: AuditLog[] }>("/admin/audit/logs")
    ]);
    setPosts(r.posts);
    setStats(s);
    setCategories(categoriesResp.categories);
    setPlans(plansResp.plans);
    setEstablishments(establishmentsResp.establishments);
    setServiceRequests(serviceResp.requests);
    setRatingsPro(ratingsProResp.ratings);
    setRatingsEst(ratingsEstResp.ratings);
    setBanners(bannersResp.banners);
    setFeatured(featuredResp.featured);
    setUsers(usersResp.users);
    setMessages(chatsResp.messages);
    setPayments(paymentsResp.payments);
    setAuditLogs(auditResp.logs);
  }

  useEffect(() => {
    load()
      .catch((e: any) => setErr(e?.message || "Error"))
      .finally(() => setLoading(false));
  }, []);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setErr(null);

    try {
      const form = new FormData();
      form.append("title", title);
      form.append("body", body);
      form.append("isPublic", String(isPublic));
      form.append("price", String(price));
      if (files) {
        Array.from(files).forEach((f) => form.append("files", f));
      }
      const res = await fetch(`${API_URL}/admin/posts`, {
        method: "POST",
        credentials: "include",
        body: form
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`ADMIN_CREATE_FAILED ${res.status}: ${t}`);
      }
      setTitle("");
      setBody("");
      setPrice(0);
      setFiles(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "No se pudo crear el post");
    } finally {
      setCreating(false);
    }
  }

  const createCategory = async () => {
    await apiFetch("/admin/categories", {
      method: "POST",
      body: JSON.stringify(newCategory)
    });
    setNewCategory({ name: "", type: "PROFESSIONAL", iconUrl: "" });
    load();
  };

  const editCategory = async (category: Category) => {
    const name = window.prompt("Nombre de categoría", category.name) || category.name;
    const type = (window.prompt("Tipo (PROFESSIONAL/ESTABLISHMENT)", category.type) || category.type).toUpperCase();
    await apiFetch(`/admin/categories/${category.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, type })
    });
    load();
  };

  const deleteCategory = async (id: string) => {
    await apiFetch(`/admin/categories/${id}`, { method: "DELETE" });
    load();
  };

  const createPlan = async () => {
    await apiFetch("/admin/plans", {
      method: "POST",
      body: JSON.stringify(newPlan)
    });
    setNewPlan({ name: "", tier: "PREMIUM", price: 0 });
    load();
  };

  const editPlan = async (plan: Plan) => {
    const name = window.prompt("Nombre del plan", plan.name) || plan.name;
    const tier = (window.prompt("Tier (PREMIUM/GOLD/SILVER)", plan.tier) || plan.tier).toUpperCase();
    const price = Number(window.prompt("Precio", String(plan.price)) || plan.price);
    await apiFetch(`/admin/plans/${plan.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, tier, price })
    });
    load();
  };

  const deletePlan = async (id: string) => {
    await apiFetch(`/admin/plans/${id}`, { method: "DELETE" });
    load();
  };

  const createEstablishment = async () => {
    await apiFetch("/admin/establishments", {
      method: "POST",
      body: JSON.stringify(newEstablishment)
    });
    setNewEstablishment({ name: "", city: "", address: "", phone: "" });
    load();
  };

  const editEstablishment = async (est: Establishment) => {
    const name = window.prompt("Nombre", est.name) || est.name;
    const city = window.prompt("Ciudad", est.city || "") ?? est.city;
    const address = window.prompt("Dirección", est.address || "") ?? est.address;
    const phone = window.prompt("Teléfono", est.phone || "") ?? est.phone;
    await apiFetch(`/admin/establishments/${est.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, city, address, phone })
    });
    load();
  };

  const deleteEstablishment = async (id: string) => {
    await apiFetch(`/admin/establishments/${id}`, { method: "DELETE" });
    load();
  };

  const createBanner = async () => {
    await apiFetch("/admin/banners", {
      method: "POST",
      body: JSON.stringify(newBanner)
    });
    setNewBanner({ title: "", imageUrl: "" });
    load();
  };

  const deleteBanner = async (id: string) => {
    await apiFetch(`/admin/banners/${id}`, { method: "DELETE" });
    load();
  };

  const createFeatured = async () => {
    await apiFetch("/admin/featured", {
      method: "POST",
      body: JSON.stringify(newFeatured)
    });
    setNewFeatured({ profileId: "", rank: 0 });
    load();
  };

  const deleteFeatured = async (id: string) => {
    await apiFetch(`/admin/featured/${id}`, { method: "DELETE" });
    load();
  };

  const updateUser = async (user: AdminUser, field: string, value: string) => {
    await apiFetch(`/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ [field]: value })
    });
    load();
  };

  const updateServiceRequest = async (request: ServiceRequest, status: string) => {
    await apiFetch(`/admin/service-requests/${request.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    load();
  };

  const deleteRatingProfessional = async (id: string) => {
    await apiFetch(`/admin/ratings/professionals/${id}`, { method: "DELETE" });
    load();
  };

  const deleteRatingEstablishment = async (id: string) => {
    await apiFetch(`/admin/ratings/establishments/${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="text-white/70">Cargando admin...</div>;
  if (err) return <div className="text-red-200">{err}</div>;
  if (!me) return null;

  return (
    <div className="grid gap-6">
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "overview", label: "Resumen" },
            { id: "posts", label: "Posts" },
            { id: "categories", label: "Categorías" },
            { id: "plans", label: "Planes" },
            { id: "establishments", label: "Establecimientos" },
            { id: "requests", label: "Servicios" },
            { id: "ratings", label: "Ratings" },
            { id: "banners", label: "Banners/Featured" },
            { id: "users", label: "Usuarios" },
            { id: "chats", label: "Chats" },
            { id: "payments", label: "Pagos" },
            { id: "audit", label: "Auditoría" }
          ].map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "btn-primary" : "btn-secondary"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {activeTab === "overview" ? (
        <div className="card p-6">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="mt-1 text-sm text-white/70">Hola, {me.displayName || "Admin"}. Control total de UZEED.</p>
          {stats ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Usuarios</div>
                <div className="text-xl font-semibold">{stats.users}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Posts</div>
                <div className="text-xl font-semibold">{stats.posts}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Pagos</div>
                <div className="text-xl font-semibold">{stats.payments}</div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "posts" ? (
        <>
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Crear post</h2>
            <form onSubmit={createPost} className="mt-4 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm text-white/70">Título</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-white/70">Texto</label>
                <textarea
                  className="input min-h-[140px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-white/70">Precio (máx $5.000 CLP)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={5000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="isPublic"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="isPublic" className="text-sm text-white/70">
                  Público (sin paywall)
                </label>
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-white/70">Media (imágenes/videos)</label>
                <input type="file" multiple accept="image/*,video/*" onChange={(e) => handleFileSelect(e.target.files)} />
                <p className="text-xs text-white/50">Máx 10 archivos por post (50MB c/u).</p>
                {fileError ? <p className="text-xs text-red-200">{fileError}</p> : null}
              </div>

              <button disabled={creating} className="btn-primary">
                {creating ? "Creando..." : "Publicar"}
              </button>
            </form>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold">Posts recientes</h2>
            <div className="mt-4 grid gap-4">
              {posts.map((p) => (
                <div key={p.id} className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-xs text-white/50">{new Date(p.createdAt).toLocaleString("es-CL")}</div>
                    </div>
                    <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-white/70">
                      {p.isPublic ? "Público" : `Premium $${p.price.toLocaleString("es-CL")}`}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-white/70">{p.body}</p>
                  {p.media?.length ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {p.media.slice(0, 6).map((m) =>
                        m.type === "IMAGE" ? (
                          <img
                            key={m.id}
                            className="w-full rounded-lg border border-white/10"
                            src={m.url.startsWith("http") ? m.url : `${API_URL}${m.url}`}
                            alt="media"
                          />
                        ) : (
                          <video
                            key={m.id}
                            className="w-full rounded-lg border border-white/10"
                            controls
                            src={m.url.startsWith("http") ? m.url : `${API_URL}${m.url}`}
                          />
                        )
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
              {!posts.length ? <div className="text-white/60">Aún no hay posts.</div> : null}
            </div>
          </div>
        </>
      ) : null}

      {activeTab === "categories" ? (
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Categorías</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              className="input"
              placeholder="Nombre"
              value={newCategory.name}
              onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
            />
            <select
              className="input select-dark"
              value={newCategory.type}
              onChange={(e) => setNewCategory((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="PROFESSIONAL">Profesional</option>
              <option value="ESTABLISHMENT">Establecimiento</option>
            </select>
            <button className="btn-primary" onClick={createCategory}>
              Crear categoría
            </button>
          </div>
          <div className="mt-6 grid gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <div className="font-semibold">{cat.name}</div>
                  <div className="text-xs text-white/50">{cat.type}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => editCategory(cat)}>
                    Editar
                  </button>
                  <button className="btn-secondary" onClick={() => deleteCategory(cat.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {!categories.length ? <div className="text-sm text-white/50">Sin categorías.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === "plans" ? (
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Planes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input
              className="input"
              placeholder="Nombre"
              value={newPlan.name}
              onChange={(e) => setNewPlan((prev) => ({ ...prev, name: e.target.value }))}
            />
            <select
              className="input select-dark"
              value={newPlan.tier}
              onChange={(e) => setNewPlan((prev) => ({ ...prev, tier: e.target.value }))}
            >
              <option value="PREMIUM">Premium</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
            </select>
            <input
              className="input"
              type="number"
              placeholder="Precio"
              value={newPlan.price}
              onChange={(e) => setNewPlan((prev) => ({ ...prev, price: Number(e.target.value) }))}
            />
            <button className="btn-primary" onClick={createPlan}>
              Crear plan
            </button>
          </div>
          <div className="mt-6 grid gap-2">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <div className="font-semibold">{plan.name}</div>
                  <div className="text-xs text-white/50">{plan.tier} · ${plan.price.toLocaleString("es-CL")}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => editPlan(plan)}>
                    Editar
                  </button>
                  <button className="btn-secondary" onClick={() => deletePlan(plan.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {!plans.length ? <div className="text-sm text-white/50">Sin planes.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === "establishments" ? (
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Establecimientos</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input
              className="input"
              placeholder="Nombre"
              value={newEstablishment.name}
              onChange={(e) => setNewEstablishment((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Ciudad"
              value={newEstablishment.city}
              onChange={(e) => setNewEstablishment((prev) => ({ ...prev, city: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Dirección"
              value={newEstablishment.address}
              onChange={(e) => setNewEstablishment((prev) => ({ ...prev, address: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Teléfono"
              value={newEstablishment.phone}
              onChange={(e) => setNewEstablishment((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <button className="btn-primary md:col-span-4" onClick={createEstablishment}>
              Crear establecimiento
            </button>
          </div>
          <div className="mt-6 grid gap-2">
            {establishments.map((est) => (
              <div key={est.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <div className="font-semibold">{est.name}</div>
                  <div className="text-xs text-white/50">{est.city}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => editEstablishment(est)}>
                    Editar
                  </button>
                  <button className="btn-secondary" onClick={() => deleteEstablishment(est.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {!establishments.length ? <div className="text-sm text-white/50">Sin establecimientos.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === "requests" ? (
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Solicitudes de servicio</h2>
          <div className="mt-4 grid gap-2">
            {serviceRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <div className="font-semibold">
                    {request.client.username} → {request.professional.username}
                  </div>
                  <div className="text-xs text-white/50">{request.status}</div>
                </div>
                <select
                  className="input select-dark"
                  value={request.status}
                  onChange={(e) => updateServiceRequest(request, e.target.value)}
                >
                  <option value="PENDING_APPROVAL">Pendiente</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="PENDING_EVALUATION">Pendiente evaluación</option>
                  <option value="FINISHED">Finalizado</option>
                </select>
              </div>
            ))}
            {!serviceRequests.length ? <div className="text-sm text-white/50">Sin solicitudes.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === "ratings" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Ratings profesionales</h2>
            <div className="mt-4 grid gap-2">
              {ratingsPro.map((rating) => (
                <div key={rating.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm">⭐ {rating.rating}</div>
                  <button className="btn-secondary" onClick={() => deleteRatingProfessional(rating.id)}>
                    Eliminar
                  </button>
                </div>
              ))}
              {!ratingsPro.length ? <div className="text-sm text-white/50">Sin ratings.</div> : null}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Ratings establecimientos</h2>
            <div className="mt-4 grid gap-2">
              {ratingsEst.map((rating) => (
                <div key={rating.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm">⭐ {rating.rating}</div>
                  <button className="btn-secondary" onClick={() => deleteRatingEstablishment(rating.id)}>
                    Eliminar
                  </button>
                </div>
              ))}
              {!ratingsEst.length ? <div className="text-sm text-white/50">Sin ratings.</div> : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "banners" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Banners</h2>
            <div className="mt-4 grid gap-3">
              <input
                className="input"
                placeholder="Título"
                value={newBanner.title}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, title: e.target.value }))}
              />
              <input
                className="input"
                placeholder="URL imagen"
                value={newBanner.imageUrl}
                onChange={(e) => setNewBanner((prev) => ({ ...prev, imageUrl: e.target.value }))}
              />
              <button className="btn-primary" onClick={createBanner}>
                Crear banner
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {banners.map((banner) => (
                <div key={banner.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="font-semibold">{banner.title}</div>
                  <button className="btn-secondary" onClick={() => deleteBanner(banner.id)}>
                    Eliminar
                  </button>
                </div>
              ))}
              {!banners.length ? <div className="text-sm text-white/50">Sin banners.</div> : null}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Perfiles destacados</h2>
            <div className="mt-4 grid gap-3">
              <input
                className="input"
                placeholder="ID de perfil"
                value={newFeatured.profileId}
                onChange={(e) => setNewFeatured((prev) => ({ ...prev, profileId: e.target.value }))}
              />
              <input
                className="input"
                type="number"
                placeholder="Rank"
                value={newFeatured.rank}
                onChange={(e) => setNewFeatured((prev) => ({ ...prev, rank: Number(e.target.value) }))}
              />
              <button className="btn-primary" onClick={createFeatured}>
                Agregar destacado
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {featured.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="font-semibold">@{item.profile.username}</div>
                  <button className="btn-secondary" onClick={() => deleteFeatured(item.id)}>
                    Eliminar
                  </button>
                </div>
              ))}
              {!featured.length ? <div className="text-sm text-white/50">Sin destacados.</div> : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "users" ? (
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Usuarios</h2>
          <div className="mt-4 grid gap-2">
            {users.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 gap-2">
                <div className="font-semibold">@{user.username}</div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="input select-dark"
                    value={user.role}
                    onChange={(e) => updateUser(user, "role", e.target.value)}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="STAFF">STAFF</option>
                    <option value="SUPPORT">SUPPORT</option>
                  </select>
                  <select
                    className="input select-dark"
                    value={user.profileType}
                    onChange={(e) => updateUser(user, "profileType", e.target.value)}
                  >
                    <option value="VIEWER">VIEWER</option>
                    <option value="CREATOR">CREATOR</option>
                    <option value="PROFESSIONAL">PROFESSIONAL</option>
                    <option value="SHOP">SHOP</option>
                  </select>
                  <select
                    className="input select-dark"
                    value={user.isActive ? "true" : "false"}
                    onChange={(e) => updateUser(user, "isActive", e.target.value)}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>
            ))}
            {!users.length ? <div className="text-sm text-white/50">Sin usuarios.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === "chats" ? (
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Chats recientes</h2>
          <div className="mt-4 grid gap-2">
            {messages.map((message) => (
              <div key={message.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="font-semibold">
                  @{message.from.username} → @{message.to.username}
                </div>
                <div className="text-xs text-white/60">{new Date(message.createdAt).toLocaleString("es-CL")}</div>
                <div className="mt-1 text-white/80">{message.body}</div>
              </div>
            ))}
            {!messages.length ? <div className="text-sm text-white/50">Sin mensajes.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === "payments" ? (
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Pagos</h2>
          <div className="mt-4 grid gap-2">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="font-semibold">${payment.amount.toLocaleString("es-CL")}</div>
                <div className="text-xs text-white/60">{payment.status}</div>
                <div className="text-xs text-white/50">{new Date(payment.createdAt).toLocaleString("es-CL")}</div>
              </div>
            ))}
            {!payments.length ? <div className="text-sm text-white/50">Sin pagos.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === "audit" ? (
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Logs de auditoría</h2>
          <div className="mt-4 grid gap-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="font-semibold">{log.action} · {log.entity}</div>
                <div className="text-xs text-white/60">por @{log.admin.username}</div>
                <div className="text-xs text-white/50">{new Date(log.createdAt).toLocaleString("es-CL")}</div>
              </div>
            ))}
            {!auditLogs.length ? <div className="text-sm text-white/50">Sin logs.</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
