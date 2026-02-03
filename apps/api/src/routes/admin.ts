import { Router } from "express";
import prisma from "../lib/prisma";
import { authRequired, roleRequired } from "../lib/auth";

const router = Router();

router.use(authRequired, roleRequired(["ADMIN"]));

router.get("/dashboard", async (_req, res) => {
  const [users, professionals, services] = await Promise.all([
    prisma.user.count(),
    prisma.professionalProfile.count(),
    prisma.serviceRequest.count()
  ]);
  res.json({ metrics: { users, professionals, services } });
});

router.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({ include: { profile: true } });
  res.json({ users });
});

router.put("/users/:id", async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json({ user });
});

router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany();
  res.json({ categories });
});

router.post("/categories", async (req, res) => {
  const category = await prisma.category.create({ data: req.body });
  res.json({ category });
});

router.put("/categories/:id", async (req, res) => {
  const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  res.json({ category });
});

router.delete("/categories/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get("/establishments", async (_req, res) => {
  const establishments = await prisma.establishment.findMany({ include: { category: true } });
  res.json({ establishments });
});

router.post("/establishments", async (req, res) => {
  const establishment = await prisma.establishment.create({ data: req.body });
  res.json({ establishment });
});

router.put("/establishments/:id", async (req, res) => {
  const establishment = await prisma.establishment.update({ where: { id: req.params.id }, data: req.body });
  res.json({ establishment });
});

router.delete("/establishments/:id", async (req, res) => {
  await prisma.establishment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get("/services", async (_req, res) => {
  const services = await prisma.serviceRequest.findMany({ include: { professionalProfile: true } });
  res.json({ services });
});

router.put("/services/:id", async (req, res) => {
  const service = await prisma.serviceRequest.update({ where: { id: req.params.id }, data: req.body });
  res.json({ service });
});

router.get("/ratings", async (_req, res) => {
  const [professionals, establishments] = await Promise.all([
    prisma.ratingProfessional.findMany(),
    prisma.ratingEstablishment.findMany()
  ]);
  res.json({ professionals, establishments });
});

router.get("/conversations", async (_req, res) => {
  const conversations = await prisma.conversation.findMany({ include: { messages: true } });
  res.json({ conversations });
});

router.get("/plans", async (_req, res) => {
  const plans = await prisma.plan.findMany();
  res.json({ plans });
});

router.post("/plans", async (req, res) => {
  const plan = await prisma.plan.create({ data: req.body });
  res.json({ plan });
});

router.put("/plans/:id", async (req, res) => {
  const plan = await prisma.plan.update({ where: { id: req.params.id }, data: req.body });
  res.json({ plan });
});

router.get("/audit-logs", async (_req, res) => {
  const logs = await prisma.adminActionLog.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ logs });
});

export default router;
