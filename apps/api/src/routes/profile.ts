import { Router } from "express";
import prisma from "../lib/prisma";
import { authRequired, roleRequired } from "../lib/auth";

const router = Router();

router.get("/professionals/:id", authRequired, async (req, res) => {
  const profile = await prisma.professionalProfile.findUnique({
    where: { id: req.params.id },
    include: { user: true, category: true, gallery: true, ratings: true }
  });
  res.json({ profile });
});

router.get("/establishments/:id", authRequired, async (req, res) => {
  const establishment = await prisma.establishment.findUnique({
    where: { id: req.params.id },
    include: { category: true, ratings: true, gallery: true }
  });
  res.json({ establishment });
});

router.put("/professionals/me", authRequired, roleRequired(["PROFESSIONAL"]), async (req, res) => {
  const { displayName, bio, isActive, categoryId } = req.body as {
    displayName?: string;
    bio?: string;
    isActive?: boolean;
    categoryId?: string;
  };

  const profile = await prisma.professionalProfile.update({
    where: { userId: req.user!.userId },
    data: { displayName, bio, isActive, categoryId }
  });

  res.json({ profile });
});

export default router;
