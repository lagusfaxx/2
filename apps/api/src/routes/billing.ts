import { Router } from "express";
import prisma from "../lib/prisma";
import { authRequired } from "../lib/auth";
import { createSubscription, getSubscriptionStatus, createChargeIntent } from "../billing/khipu";
import { env } from "../lib/env";

const router = Router();

router.post("/subscriptions", authRequired, async (req, res) => {
  const { planId } = req.body as { planId: string };
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

  if (!plan || !user) {
    return res.status(404).json({ error: "Plan or user not found" });
  }

  const subscription = await createSubscription({
    name: user.name ?? "UZEED",
    email: user.email,
    max_amount: plan.price,
    currency: "CLP",
    notify_url: env.KHIPU_NOTIFY_URL ?? "",
    return_url: env.KHIPU_RETURN_URL ?? "",
    cancel_url: env.KHIPU_CANCEL_URL ?? ""
  });

  const record = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      subscriptionId: subscription.subscription_id ?? subscription.id,
      status: subscription.status ?? "PENDING"
    }
  });

  res.json({ subscription: record, provider: subscription });
});

router.get("/subscriptions/:id/status", authRequired, async (req, res) => {
  const status = await getSubscriptionStatus(req.params.id);
  res.json({ status });
});

router.post("/charge-intent", authRequired, async (req, res) => {
  const intent = await createChargeIntent(req.body);
  res.json({ intent });
});

export default router;
