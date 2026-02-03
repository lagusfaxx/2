import { Router } from "express";
import prisma from "../lib/prisma";
import { authRequired, roleRequired } from "../lib/auth";

const router = Router();

router.get("/favorites", authRequired, roleRequired(["CLIENT"]), async (req, res) => {
  const favorites = await prisma.favoriteProfessional.findMany({
    where: { clientId: req.user!.userId },
    include: { professional: { include: { user: true, category: true } } }
  });
  res.json({ favorites });
});

router.post("/favorites", authRequired, roleRequired(["CLIENT"]), async (req, res) => {
  const { professionalId } = req.body as { professionalId: string };
  const favorite = await prisma.favoriteProfessional.create({
    data: { clientId: req.user!.userId, professionalId }
  });
  res.json({ favorite });
});

router.delete("/favorites/:professionalId", authRequired, roleRequired(["CLIENT"]), async (req, res) => {
  await prisma.favoriteProfessional.delete({
    where: {
      clientId_professionalId: {
        clientId: req.user!.userId,
        professionalId: req.params.professionalId
      }
    }
  });
  res.json({ ok: true });
});

export default router;
