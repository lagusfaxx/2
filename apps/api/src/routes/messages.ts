import { Router } from "express";
import prisma from "../lib/prisma";
import { authRequired } from "../lib/auth";
import { emitToUser } from "../lib/realtime";

const router = Router();

router.get("/conversations", authRequired, async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: req.user!.userId } }
    },
    include: { participants: true, messages: { orderBy: { createdAt: "desc" }, take: 20 } }
  });
  res.json({ conversations });
});

router.post("/conversations", authRequired, async (req, res) => {
  const { participantId } = req.body as { participantId: string };
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: req.user!.userId }, { userId: participantId }]
      }
    }
  });
  res.json({ conversation });
});

router.get("/conversations/:id/messages", authRequired, async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id },
    orderBy: { createdAt: "asc" }
  });
  res.json({ messages });
});

router.post("/conversations/:id/messages", authRequired, async (req, res) => {
  const { content } = req.body as { content: string };
  const message = await prisma.message.create({
    data: {
      conversationId: req.params.id,
      senderId: req.user!.userId,
      content
    }
  });

  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId: req.params.id }
  });

  participants.forEach((participant) => {
    emitToUser(participant.userId, "message:new", message);
  });

  res.json({ message });
});

export default router;
