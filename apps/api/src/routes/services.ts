import { Router } from "express";
import prisma from "../lib/prisma";
import { authRequired, roleRequired } from "../lib/auth";
import { emitToUser } from "../lib/realtime";

const router = Router();

router.get("/service-requests", authRequired, async (req, res) => {
  const requests = await prisma.serviceRequest.findMany({
    where: {
      OR: [
        { clientId: req.user!.userId },
        { professionalProfile: { userId: req.user!.userId } }
      ]
    },
    include: { professionalProfile: true }
  });
  res.json({ requests });
});

router.post("/service-requests", authRequired, roleRequired(["CLIENT"]), async (req, res) => {
  const { professionalId, note } = req.body as { professionalId: string; note?: string };
  const request = await prisma.serviceRequest.create({
    data: {
      clientId: req.user!.userId,
      professionalId,
      note,
      status: "PENDING_APPROVAL"
    }
  });

  const professional = await prisma.professionalProfile.findUnique({ where: { id: professionalId } });
  if (professional) {
    emitToUser(professional.userId, "service:request", request);
  }

  res.json({ request });
});

router.put("/service-requests/:id/status", authRequired, roleRequired(["PROFESSIONAL"]), async (req, res) => {
  const { status } = req.body as { status: "ACTIVE" | "PENDING_REVIEW" | "FINISHED" | "REJECTED" };
  const request = await prisma.serviceRequest.update({
    where: { id: req.params.id },
    data: { status }
  });

  emitToUser(request.clientId, "service:update", request);
  res.json({ request });
});

export default router;
