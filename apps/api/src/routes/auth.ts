import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { createSessionToken, verifySessionToken } from "../lib/auth";
import { env } from "../lib/env";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, password, role, name } = req.body as {
    email: string;
    password: string;
    role: "CLIENT" | "PROFESSIONAL" | "ADMIN";
    name: string;
  };

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role,
      name
    }
  });

  if (role === "PROFESSIONAL") {
    await prisma.professionalProfile.create({
      data: {
        userId: user.id,
        displayName: name,
        bio: "",
        isActive: true
      }
    });
  }

  const token = createSessionToken({ userId: user.id, role: user.role });
  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: env.COOKIE_DOMAIN || undefined
  });
  return res.json({ user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = createSessionToken({ userId: user.id, role: user.role });
  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: env.COOKIE_DOMAIN || undefined
  });
  return res.json({ user });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("session");
  return res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  const session = req.cookies?.session;
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = verifySessionToken(session);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    return res.json({ user });
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
