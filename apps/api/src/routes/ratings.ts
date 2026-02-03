import { Router } from "express";
import prisma from "../lib/prisma";
import { authRequired, roleRequired } from "../lib/auth";

const router = Router();

router.post("/ratings/professionals", authRequired, roleRequired(["CLIENT"]), async (req, res) => {
  const { professionalId, score, comment } = req.body as {
    professionalId: string;
    score: number;
    comment?: string;
  };

  const rating = await prisma.ratingProfessional.create({
    data: {
      clientId: req.user!.userId,
      professionalId,
      score,
      comment
    }
  });

  res.json({ rating });
});

router.post("/ratings/establishments", authRequired, roleRequired(["CLIENT"]), async (req, res) => {
  const { establishmentId, score, comment } = req.body as {
    establishmentId: string;
    score: number;
    comment?: string;
  };

  const rating = await prisma.ratingEstablishment.create({
    data: {
      clientId: req.user!.userId,
      establishmentId,
      score,
      comment
    }
  });

  res.json({ rating });
});

export default router;
