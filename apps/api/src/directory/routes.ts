import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../auth/middleware";
import { asyncHandler } from "../lib/asyncHandler";
import { isUUID } from "../lib/validators";
import { emitRealtimeEvent } from "../realtime/server";

export const directoryRouter = Router();

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizePlan(plan?: string | string[]) {
  if (!plan) return null;
  const value = Array.isArray(plan) ? plan[0] : plan;
  const normalized = value.toUpperCase();
  if (["PREMIUM", "GOLD", "SILVER"].includes(normalized)) return normalized;
  return null;
}

function normalizeGender(gender?: string | string[]) {
  if (!gender) return null;
  const value = Array.isArray(gender) ? gender[0] : gender;
  const normalized = value.toUpperCase();
  if (["MALE", "FEMALE", "OTHER"].includes(normalized)) return normalized;
  return null;
}

function average(values: number[]) {
  if (!values.length) return null;
  const total = values.reduce((sum, v) => sum + v, 0);
  return Math.round((total / values.length) * 10) / 10;
}

directoryRouter.get("/categories", asyncHandler(async (req, res) => {
  const type = typeof req.query.type === "string" ? req.query.type.toUpperCase() : undefined;
  const categories = await prisma.category.findMany({
    where: type === "PROFESSIONAL" || type === "ESTABLISHMENT" ? { type: type as any } : undefined,
    orderBy: { name: "asc" }
  });
  return res.json({ categories });
}));

directoryRouter.get("/plans", asyncHandler(async (_req, res) => {
  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { price: "asc" } });
  return res.json({ plans });
}));

directoryRouter.get("/professionals/search", asyncHandler(async (req, res) => {
  const lat = req.query.lat ? Number(req.query.lat) : null;
  const lng = req.query.lng ? Number(req.query.lng) : null;
  const range = req.query.range ? Number(req.query.range) : null;
  const gender = normalizeGender(req.query.gender as string | undefined);
  const plan = normalizePlan(req.query.plan as string | undefined);
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : null;
  const active = req.query.active ? String(req.query.active) === "true" : null;

  const professionals = await prisma.user.findMany({
    where: {
      profileType: "PROFESSIONAL",
      ...(gender ? { gender } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(active !== null ? { isActive: active } : {})
    },
    include: {
      plan: true,
      category: true,
      professionalRatings: true,
      profileMedia: true
    }
  });

  const filteredByPlan = plan
    ? professionals.filter((p) => p.plan?.tier === plan)
    : professionals;

  const enriched = filteredByPlan.map((p) => {
    const distance =
      lat !== null && lng !== null && p.latitude !== null && p.longitude !== null
        ? haversine(lat, lng, p.latitude, p.longitude)
        : null;
    const rating = average(p.professionalRatings.map((r) => r.rating));
    return {
      id: p.id,
      displayName: p.displayName,
      username: p.username,
      avatarUrl: p.avatarUrl,
      coverUrl: p.coverUrl,
      serviceCategory: p.category?.name || p.serviceCategory,
      gender: p.gender,
      isActive: p.isActive,
      isOnline: p.isOnline,
      plan: p.plan?.tier || null,
      rating,
      distance,
      category: p.category,
      media: p.profileMedia
    };
  }).filter((p) => (range && p.distance !== null ? p.distance <= range : true));

  return res.json({ professionals: enriched });
}));

directoryRouter.get("/professionals/:id", asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!isUUID(id)) return res.status(400).json({ error: "INVALID_ID" });
  const professional = await prisma.user.findUnique({
    where: { id },
    include: {
      plan: true,
      category: true,
      professionalRatings: true,
      profileMedia: true
    }
  });
  if (!professional || professional.profileType !== "PROFESSIONAL") return res.status(404).json({ error: "NOT_FOUND" });

  const rating = average(professional.professionalRatings.map((r) => r.rating));

  if (req.session.userId && req.session.userId !== professional.id) {
    await prisma.profileView.create({
      data: {
        viewerId: req.session.userId,
        profileId: professional.id
      }
    });
  }

  return res.json({
    professional: {
      id: professional.id,
      displayName: professional.displayName,
      username: professional.username,
      avatarUrl: professional.avatarUrl,
      coverUrl: professional.coverUrl,
      bio: professional.bio,
      serviceCategory: professional.category?.name || professional.serviceCategory,
      serviceDescription: professional.serviceDescription,
      city: professional.city,
      address: professional.address,
      gender: professional.gender,
      isActive: professional.isActive,
      isOnline: professional.isOnline,
      plan: professional.plan?.tier || null,
      rating,
      media: professional.profileMedia,
      category: professional.category
    }
  });
}));

directoryRouter.get("/establishments/search", asyncHandler(async (req, res) => {
  const lat = req.query.lat ? Number(req.query.lat) : null;
  const lng = req.query.lng ? Number(req.query.lng) : null;
  const range = req.query.range ? Number(req.query.range) : null;
  const minRating = req.query.rating ? Number(req.query.rating) : null;
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : null;

  const establishments = await prisma.establishment.findMany({
    where: {
      ...(categoryId ? { categoryId } : {})
    },
    include: {
      category: true,
      media: true,
      ratings: true
    }
  });

  const enriched = establishments.map((e) => {
    const distance =
      lat !== null && lng !== null && e.latitude !== null && e.longitude !== null
        ? haversine(lat, lng, e.latitude, e.longitude)
        : null;
    const rating = average(e.ratings.map((r) => r.rating));
    return {
      id: e.id,
      name: e.name,
      city: e.city,
      address: e.address,
      phone: e.phone,
      description: e.description,
      category: e.category,
      rating,
      distance,
      media: e.media,
      isActive: e.isActive
    };
  }).filter((e) => (range && e.distance !== null ? e.distance <= range : true))
    .filter((e) => (minRating ? (e.rating || 0) >= minRating : true));

  return res.json({ establishments: enriched });
}));

directoryRouter.get("/establishments/:id", asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!isUUID(id)) return res.status(400).json({ error: "INVALID_ID" });
  const establishment = await prisma.establishment.findUnique({
    where: { id },
    include: {
      category: true,
      media: true,
      ratings: true
    }
  });
  if (!establishment) return res.status(404).json({ error: "NOT_FOUND" });
  const rating = average(establishment.ratings.map((r) => r.rating));
  return res.json({
    establishment: {
      ...establishment,
      rating
    }
  });
}));

directoryRouter.get("/favorites", requireAuth, asyncHandler(async (req, res) => {
  const favorites = await prisma.favoriteProfessional.findMany({
    where: { userId: req.session.userId! },
    include: {
      professional: {
        include: { professionalRatings: true, category: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json({
    favorites: favorites.map((fav) => ({
      id: fav.id,
      createdAt: fav.createdAt.toISOString(),
      professional: {
        id: fav.professional.id,
        displayName: fav.professional.displayName,
        username: fav.professional.username,
        avatarUrl: fav.professional.avatarUrl,
        category: fav.professional.category?.name || fav.professional.serviceCategory,
        rating: average(fav.professional.professionalRatings.map((r) => r.rating))
      }
    }))
  });
}));

directoryRouter.get("/profile/views", requireAuth, asyncHandler(async (req, res) => {
  const views = await prisma.profileView.findMany({
    where: { viewerId: req.session.userId! },
    include: {
      profile: {
        select: { id: true, displayName: true, username: true, avatarUrl: true, profileType: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return res.json({
    views: views.map((v) => ({
      id: v.id,
      createdAt: v.createdAt.toISOString(),
      profile: v.profile
    }))
  });
}));

directoryRouter.post("/favorites/:professionalId", requireAuth, asyncHandler(async (req, res) => {
  const professionalId = req.params.professionalId;
  if (!isUUID(professionalId)) return res.status(400).json({ error: "INVALID_ID" });
  const professional = await prisma.user.findUnique({ where: { id: professionalId } });
  if (!professional || professional.profileType !== "PROFESSIONAL") return res.status(404).json({ error: "NOT_FOUND" });
  const favorite = await prisma.favoriteProfessional.upsert({
    where: { userId_professionalId: { userId: req.session.userId!, professionalId } },
    update: {},
    create: { userId: req.session.userId!, professionalId }
  });
  return res.json({ favorite });
}));

directoryRouter.delete("/favorites/:professionalId", requireAuth, asyncHandler(async (req, res) => {
  const professionalId = req.params.professionalId;
  if (!isUUID(professionalId)) return res.status(400).json({ error: "INVALID_ID" });
  await prisma.favoriteProfessional.deleteMany({
    where: { userId: req.session.userId!, professionalId }
  });
  return res.json({ ok: true });
}));

directoryRouter.post("/ratings/professionals/:professionalId", requireAuth, asyncHandler(async (req, res) => {
  const professionalId = req.params.professionalId;
  if (!isUUID(professionalId)) return res.status(400).json({ error: "INVALID_ID" });
  const rating = Number(req.body?.rating || 0);
  const comment = typeof req.body?.comment === "string" ? req.body.comment.trim() : null;
  if (rating < 1 || rating > 5) return res.status(400).json({ error: "INVALID_RATING" });
  const professional = await prisma.user.findUnique({ where: { id: professionalId } });
  if (!professional || professional.profileType !== "PROFESSIONAL") return res.status(404).json({ error: "NOT_FOUND" });
  const record = await prisma.ratingProfessional.upsert({
    where: { professionalId_clientId: { professionalId, clientId: req.session.userId! } },
    update: { rating, comment },
    create: { professionalId, clientId: req.session.userId!, rating, comment }
  });
  emitRealtimeEvent({
    type: "rating:professional",
    payload: { professionalId, rating: record.rating },
    targets: [professionalId]
  });
  return res.json({ rating: record });
}));

directoryRouter.post("/ratings/establishments/:establishmentId", requireAuth, asyncHandler(async (req, res) => {
  const establishmentId = req.params.establishmentId;
  if (!isUUID(establishmentId)) return res.status(400).json({ error: "INVALID_ID" });
  const rating = Number(req.body?.rating || 0);
  const comment = typeof req.body?.comment === "string" ? req.body.comment.trim() : null;
  if (rating < 1 || rating > 5) return res.status(400).json({ error: "INVALID_RATING" });
  const establishment = await prisma.establishment.findUnique({ where: { id: establishmentId } });
  if (!establishment) return res.status(404).json({ error: "NOT_FOUND" });
  const record = await prisma.ratingEstablishment.upsert({
    where: { establishmentId_clientId: { establishmentId, clientId: req.session.userId! } },
    update: { rating, comment },
    create: { establishmentId, clientId: req.session.userId!, rating, comment }
  });
  emitRealtimeEvent({
    type: "rating:establishment",
    payload: { establishmentId, rating: record.rating }
  });
  return res.json({ rating: record });
}));

directoryRouter.post("/services/requests", requireAuth, asyncHandler(async (req, res) => {
  const professionalId = String(req.body?.professionalId || "");
  if (!isUUID(professionalId)) return res.status(400).json({ error: "INVALID_ID" });
  if (professionalId === req.session.userId) return res.status(400).json({ error: "INVALID_TARGET" });
  const professional = await prisma.user.findUnique({ where: { id: professionalId } });
  if (!professional || professional.profileType !== "PROFESSIONAL") return res.status(404).json({ error: "NOT_FOUND" });
  const request = await prisma.serviceRequest.create({
    data: {
      clientId: req.session.userId!,
      professionalId
    }
  });
  emitRealtimeEvent({
    type: "service:request",
    payload: { requestId: request.id, professionalId, clientId: req.session.userId },
    targets: [professionalId, req.session.userId!]
  });
  return res.json({ request });
}));

directoryRouter.get("/services/requests", requireAuth, asyncHandler(async (req, res) => {
  const asRole = typeof req.query.as === "string" ? req.query.as : "client";
  const status = typeof req.query.status === "string" ? req.query.status : null;

  const where = asRole === "professional"
    ? { professionalId: req.session.userId! }
    : { clientId: req.session.userId! };

  const requests = await prisma.serviceRequest.findMany({
    where: {
      ...where,
      ...(status ? { status: status as any } : {})
    },
    include: {
      professional: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      client: { select: { id: true, displayName: true, username: true, avatarUrl: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json({
    requests: requests.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString() || null,
      finishedAt: r.finishedAt?.toISOString() || null
    }))
  });
}));

directoryRouter.patch("/services/requests/:id", requireAuth, asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!isUUID(id)) return res.status(400).json({ error: "INVALID_ID" });
  const status = String(req.body?.status || "");
  if (!["PENDING_APPROVAL", "ACTIVE", "PENDING_EVALUATION", "FINISHED"].includes(status)) {
    return res.status(400).json({ error: "INVALID_STATUS" });
  }
  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) return res.status(404).json({ error: "NOT_FOUND" });
  if (request.professionalId !== req.session.userId && request.clientId !== req.session.userId) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const updateData: Record<string, any> = { status };
  if (status === "ACTIVE") updateData.approvedAt = new Date();
  if (status === "FINISHED") updateData.finishedAt = new Date();

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: updateData,
    include: {
      professional: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      client: { select: { id: true, displayName: true, username: true, avatarUrl: true } }
    }
  });
  emitRealtimeEvent({
    type: "service:update",
    payload: { requestId: updated.id, status: updated.status, professionalId: updated.professionalId, clientId: updated.clientId },
    targets: [updated.professionalId, updated.clientId]
  });
  return res.json({ request: updated });
}));
