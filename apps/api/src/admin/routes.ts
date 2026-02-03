import { Router } from "express";
import { prisma } from "../db";
import { requireAdmin } from "../auth/middleware";
import { CreatePostSchema } from "@uzeed/shared";
import multer from "multer";
import path from "path";
import { config } from "../config";
import { LocalStorageProvider } from "../storage/local";
import { asyncHandler } from "../lib/asyncHandler";

export const adminRouter = Router();

const storageProvider = new LocalStorageProvider({
  baseDir: config.storageDir,
  publicPathPrefix: `${config.apiUrl.replace(/\/$/, "")}/uploads`
});

const mediaFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const mime = (file.mimetype || "").toLowerCase();
  if (!mime.startsWith("image/") && !mime.startsWith("video/")) {
    return cb(new Error("INVALID_FILE_TYPE"));
  }
  return cb(null, true);
};

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      await storageProvider.ensureBaseDir();
      cb(null, config.storageDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
      const name = `${Date.now()}-${safeBase}${ext}`;
      cb(null, name);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: mediaFilter
});

adminRouter.use(requireAdmin);

adminRouter.get("/stats", asyncHandler(async (_req, res) => {
  const [users, posts, payments] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.payment.count()
  ]);
  return res.json({ users, posts, payments });
}));

adminRouter.get("/posts", asyncHandler(async (_req, res) => {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" }, include: { media: true } });
  return res.json({ posts: posts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    media: p.media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))
  })) });
}));

adminRouter.post("/posts", upload.array("files", 10), asyncHandler(async (req, res) => {
  const { title, body, isPublic, price } = req.body as Record<string, string>;
  const payload = {
    title,
    body,
    isPublic: isPublic === "true",
    price: price ? Number(price) : 0
  };
  const parsed = CreatePostSchema.safeParse(payload);
  if (!parsed.success) return res.status(400).json({ error: "VALIDATION", details: parsed.error.flatten() });

  const post = await prisma.post.create({
    data: {
      authorId: req.session.userId!,
      title: parsed.data.title,
      body: parsed.data.body,
      isPublic: parsed.data.isPublic,
      price: parsed.data.price
    }
  });

  const files = (req.files as Express.Multer.File[]) ?? [];
  const media = [];
  for (const file of files) {
    const mime = (file.mimetype || "").toLowerCase();
    const type = mime.startsWith("video/") ? "VIDEO" : "IMAGE";
    const url = storageProvider.publicUrl(file.filename);
    media.push(await prisma.media.create({ data: { postId: post.id, type, url } }));
  }
  const hasVideo = media.some((m) => m.type === "VIDEO");
  if (hasVideo) {
    await prisma.post.update({ where: { id: post.id }, data: { type: "VIDEO" } });
  }

  return res.json({ post: { ...post, media } });
}));

adminRouter.put("/posts/:id", asyncHandler(async (req, res) => {
  const parsed = CreatePostSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "VALIDATION", details: parsed.error.flatten() });

  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: parsed.data
  });
  return res.json({ post });
}));

adminRouter.delete("/posts/:id", asyncHandler(async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
}));

adminRouter.post("/posts/:id/media", upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "NO_FILE" });
  const mime = (req.file.mimetype || "").toLowerCase();
  const type = mime.startsWith("video/") ? "VIDEO" : "IMAGE";
  const url = storageProvider.publicUrl(req.file.filename);

  const media = await prisma.media.create({
    data: { postId: req.params.id, type, url }
  });
  if (type === "VIDEO") {
    await prisma.post.update({ where: { id: req.params.id }, data: { type: "VIDEO" } });
  }

  return res.json({ media });
}));

async function logAdminAction(req: any, action: string, entity: string, entityId?: string | null, metadata?: any) {
  if (!req.session.userId) return;
  await prisma.auditLog.create({
    data: {
      adminId: req.session.userId,
      action,
      entity,
      entityId: entityId || null,
      metadata: metadata || undefined
    }
  });
}

adminRouter.get("/categories", asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return res.json({ categories });
}));

adminRouter.post("/categories", asyncHandler(async (req, res) => {
  const { name, type, iconUrl } = req.body as Record<string, string>;
  if (!name || !type) return res.status(400).json({ error: "VALIDATION" });
  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      type: type.toUpperCase() as any,
      iconUrl: iconUrl || null
    }
  });
  await logAdminAction(req, "CREATE", "Category", category.id, { name: category.name });
  return res.json({ category });
}));

adminRouter.patch("/categories/:id", asyncHandler(async (req, res) => {
  const { name, type, iconUrl } = req.body as Record<string, string>;
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      name: name ? name.trim() : undefined,
      type: type ? (type.toUpperCase() as any) : undefined,
      iconUrl: iconUrl ?? undefined
    }
  });
  await logAdminAction(req, "UPDATE", "Category", category.id, { name: category.name });
  return res.json({ category });
}));

adminRouter.delete("/categories/:id", asyncHandler(async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  await logAdminAction(req, "DELETE", "Category", req.params.id);
  return res.json({ ok: true });
}));

adminRouter.get("/plans", asyncHandler(async (_req, res) => {
  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });
  return res.json({ plans });
}));

adminRouter.post("/plans", asyncHandler(async (req, res) => {
  const { name, tier, price, badgeColor, description, active } = req.body as Record<string, string>;
  if (!name || !tier || !price) return res.status(400).json({ error: "VALIDATION" });
  const plan = await prisma.plan.create({
    data: {
      name: name.trim(),
      tier: tier.toUpperCase() as any,
      price: Number(price),
      badgeColor: badgeColor || null,
      description: description || null,
      active: active ? active === "true" : true
    }
  });
  await logAdminAction(req, "CREATE", "Plan", plan.id, { name: plan.name });
  return res.json({ plan });
}));

adminRouter.patch("/plans/:id", asyncHandler(async (req, res) => {
  const { name, tier, price, badgeColor, description, active } = req.body as Record<string, string>;
  const plan = await prisma.plan.update({
    where: { id: req.params.id },
    data: {
      name: name ? name.trim() : undefined,
      tier: tier ? (tier.toUpperCase() as any) : undefined,
      price: price ? Number(price) : undefined,
      badgeColor: badgeColor ?? undefined,
      description: description ?? undefined,
      active: active ? active === "true" : undefined
    }
  });
  await logAdminAction(req, "UPDATE", "Plan", plan.id, { name: plan.name });
  return res.json({ plan });
}));

adminRouter.delete("/plans/:id", asyncHandler(async (req, res) => {
  await prisma.plan.delete({ where: { id: req.params.id } });
  await logAdminAction(req, "DELETE", "Plan", req.params.id);
  return res.json({ ok: true });
}));

adminRouter.get("/users", asyncHandler(async (req, res) => {
  const role = typeof req.query.role === "string" ? req.query.role.toUpperCase() : null;
  const profileType = typeof req.query.profileType === "string" ? req.query.profileType.toUpperCase() : null;
  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role: role as any } : {}),
      ...(profileType ? { profileType: profileType as any } : {})
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ users });
}));

adminRouter.patch("/users/:id", asyncHandler(async (req, res) => {
  const { role, profileType, isActive, categoryId, planId, anonymousMode } = req.body as Record<string, string>;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      role: role ? (role.toUpperCase() as any) : undefined,
      profileType: profileType ? (profileType.toUpperCase() as any) : undefined,
      isActive: typeof isActive === "string" ? isActive === "true" : undefined,
      categoryId: categoryId || undefined,
      planId: planId || undefined,
      anonymousMode: typeof anonymousMode === "string" ? anonymousMode === "true" : undefined
    }
  });
  await logAdminAction(req, "UPDATE", "User", user.id, { role: user.role, profileType: user.profileType });
  return res.json({ user });
}));

adminRouter.get("/establishments", asyncHandler(async (_req, res) => {
  const establishments = await prisma.establishment.findMany({
    include: { category: true, media: true },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ establishments });
}));

adminRouter.post("/establishments", asyncHandler(async (req, res) => {
  const { name, city, address, phone, description, latitude, longitude, categoryId, isActive } = req.body as Record<string, string>;
  if (!name) return res.status(400).json({ error: "VALIDATION" });
  const establishment = await prisma.establishment.create({
    data: {
      name: name.trim(),
      city: city || null,
      address: address || null,
      phone: phone || null,
      description: description || null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      categoryId: categoryId || null,
      isActive: isActive ? isActive === "true" : true
    }
  });
  await logAdminAction(req, "CREATE", "Establishment", establishment.id, { name: establishment.name });
  return res.json({ establishment });
}));

adminRouter.patch("/establishments/:id", asyncHandler(async (req, res) => {
  const { name, city, address, phone, description, latitude, longitude, categoryId, isActive } = req.body as Record<string, string>;
  const establishment = await prisma.establishment.update({
    where: { id: req.params.id },
    data: {
      name: name ? name.trim() : undefined,
      city: city ?? undefined,
      address: address ?? undefined,
      phone: phone ?? undefined,
      description: description ?? undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      categoryId: categoryId || undefined,
      isActive: isActive ? isActive === "true" : undefined
    }
  });
  await logAdminAction(req, "UPDATE", "Establishment", establishment.id, { name: establishment.name });
  return res.json({ establishment });
}));

adminRouter.delete("/establishments/:id", asyncHandler(async (req, res) => {
  await prisma.establishment.delete({ where: { id: req.params.id } });
  await logAdminAction(req, "DELETE", "Establishment", req.params.id);
  return res.json({ ok: true });
}));

adminRouter.post("/establishments/:id/media", upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "NO_FILE" });
  const mime = (req.file.mimetype || "").toLowerCase();
  const type = mime.startsWith("video/") ? "VIDEO" : "IMAGE";
  const url = storageProvider.publicUrl(req.file.filename);
  const media = await prisma.establishmentMedia.create({
    data: { establishmentId: req.params.id, type, url }
  });
  await logAdminAction(req, "CREATE", "EstablishmentMedia", media.id, { establishmentId: req.params.id });
  return res.json({ media });
}));

adminRouter.get("/service-requests", asyncHandler(async (_req, res) => {
  const requests = await prisma.serviceRequest.findMany({
    include: {
      professional: { select: { id: true, displayName: true, username: true } },
      client: { select: { id: true, displayName: true, username: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ requests });
}));

adminRouter.patch("/service-requests/:id", asyncHandler(async (req, res) => {
  const { status } = req.body as Record<string, string>;
  const request = await prisma.serviceRequest.update({
    where: { id: req.params.id },
    data: {
      status: status ? (status as any) : undefined
    }
  });
  await logAdminAction(req, "UPDATE", "ServiceRequest", request.id, { status: request.status });
  return res.json({ request });
}));

adminRouter.get("/ratings/professionals", asyncHandler(async (_req, res) => {
  const ratings = await prisma.ratingProfessional.findMany({
    include: {
      professional: { select: { id: true, displayName: true, username: true } },
      client: { select: { id: true, displayName: true, username: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ ratings });
}));

adminRouter.get("/ratings/establishments", asyncHandler(async (_req, res) => {
  const ratings = await prisma.ratingEstablishment.findMany({
    include: {
      establishment: { select: { id: true, name: true } },
      client: { select: { id: true, displayName: true, username: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ ratings });
}));

adminRouter.delete("/ratings/professionals/:id", asyncHandler(async (req, res) => {
  await prisma.ratingProfessional.delete({ where: { id: req.params.id } });
  await logAdminAction(req, "DELETE", "RatingProfessional", req.params.id);
  return res.json({ ok: true });
}));

adminRouter.delete("/ratings/establishments/:id", asyncHandler(async (req, res) => {
  await prisma.ratingEstablishment.delete({ where: { id: req.params.id } });
  await logAdminAction(req, "DELETE", "RatingEstablishment", req.params.id);
  return res.json({ ok: true });
}));

adminRouter.get("/banners", asyncHandler(async (_req, res) => {
  const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
  return res.json({ banners });
}));

adminRouter.post("/banners", asyncHandler(async (req, res) => {
  const { title, imageUrl, linkUrl, active } = req.body as Record<string, string>;
  if (!title || !imageUrl) return res.status(400).json({ error: "VALIDATION" });
  const banner = await prisma.banner.create({
    data: {
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl || null,
      active: active ? active === "true" : true
    }
  });
  await logAdminAction(req, "CREATE", "Banner", banner.id, { title: banner.title });
  return res.json({ banner });
}));

adminRouter.patch("/banners/:id", asyncHandler(async (req, res) => {
  const { title, imageUrl, linkUrl, active } = req.body as Record<string, string>;
  const banner = await prisma.banner.update({
    where: { id: req.params.id },
    data: {
      title: title ? title.trim() : undefined,
      imageUrl: imageUrl ? imageUrl.trim() : undefined,
      linkUrl: linkUrl ?? undefined,
      active: active ? active === "true" : undefined
    }
  });
  await logAdminAction(req, "UPDATE", "Banner", banner.id, { title: banner.title });
  return res.json({ banner });
}));

adminRouter.delete("/banners/:id", asyncHandler(async (req, res) => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  await logAdminAction(req, "DELETE", "Banner", req.params.id);
  return res.json({ ok: true });
}));

adminRouter.get("/featured", asyncHandler(async (_req, res) => {
  const featured = await prisma.featuredProfile.findMany({
    include: { profile: { select: { id: true, displayName: true, username: true } } },
    orderBy: { rank: "asc" }
  });
  return res.json({ featured });
}));

adminRouter.post("/featured", asyncHandler(async (req, res) => {
  const { profileId, rank } = req.body as Record<string, string>;
  if (!profileId) return res.status(400).json({ error: "VALIDATION" });
  const featured = await prisma.featuredProfile.create({
    data: {
      profileId,
      rank: rank ? Number(rank) : 0
    }
  });
  await logAdminAction(req, "CREATE", "FeaturedProfile", featured.id, { profileId });
  return res.json({ featured });
}));

adminRouter.patch("/featured/:id", asyncHandler(async (req, res) => {
  const { rank } = req.body as Record<string, string>;
  const featured = await prisma.featuredProfile.update({
    where: { id: req.params.id },
    data: {
      rank: rank ? Number(rank) : undefined
    }
  });
  await logAdminAction(req, "UPDATE", "FeaturedProfile", featured.id, { rank: featured.rank });
  return res.json({ featured });
}));

adminRouter.delete("/featured/:id", asyncHandler(async (req, res) => {
  await prisma.featuredProfile.delete({ where: { id: req.params.id } });
  await logAdminAction(req, "DELETE", "FeaturedProfile", req.params.id);
  return res.json({ ok: true });
}));

adminRouter.get("/chats", asyncHandler(async (_req, res) => {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      from: { select: { id: true, username: true, displayName: true } },
      to: { select: { id: true, username: true, displayName: true } }
    }
  });
  return res.json({ messages });
}));

adminRouter.get("/payments", asyncHandler(async (_req, res) => {
  const payments = await prisma.payment.findMany({ orderBy: { createdAt: "desc" } });
  const subscriptions = await prisma.khipuSubscription.findMany({ orderBy: { createdAt: "desc" } });
  const intents = await prisma.paymentIntent.findMany({ orderBy: { createdAt: "desc" } });
  return res.json({ payments, subscriptions, intents });
}));

adminRouter.get("/audit/logs", asyncHandler(async (_req, res) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { admin: { select: { id: true, username: true, displayName: true } } }
  });
  return res.json({ logs });
}));
