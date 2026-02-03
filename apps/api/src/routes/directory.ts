import { Router } from "express";
import prisma from "../lib/prisma";
import { authRequired } from "../lib/auth";

const router = Router();

router.get("/categories", authRequired, async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json({ categories });
});

router.get("/professionals", authRequired, async (req, res) => {
  const { plan, gender, active } = req.query;
  const professionals = await prisma.professionalProfile.findMany({
    where: {
      isActive: active ? active === "true" : undefined,
      user: {
        plan: plan ? { name: String(plan) } : undefined,
        gender: gender ? String(gender) : undefined
      }
    },
    include: { user: true, category: true }
  });
  res.json({ professionals });
});

router.get("/establishments", authRequired, async (req, res) => {
  const { category } = req.query;
  const establishments = await prisma.establishment.findMany({
    where: {
      category: category ? { name: String(category) } : undefined
    },
    include: { category: true }
  });
  res.json({ establishments });
});

export default router;
