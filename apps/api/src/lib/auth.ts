import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { env } from "./env";

export type SessionPayload = {
  userId: string;
  role: "CLIENT" | "PROFESSIONAL" | "ADMIN";
};

export const createSessionToken = (payload: SessionPayload) =>
  jwt.sign(payload, env.SESSION_SECRET, { expiresIn: "7d" });

export const verifySessionToken = (token: string) =>
  jwt.verify(token, env.SESSION_SECRET) as SessionPayload;

export const authRequired = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.session;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = verifySessionToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid session" });
  }
};

export const roleRequired = (roles: SessionPayload["role"][]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
