import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string().url(),
  WEB_URL: z.string().url(),
  API_URL: z.string().url(),
  SESSION_SECRET: z.string().min(16),
  COOKIE_DOMAIN: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  KHIPU_API_KEY: z.string().optional(),
  KHIPU_RECEIVER_ID: z.string().optional(),
  KHIPU_SECRET: z.string().optional(),
  KHIPU_NOTIFY_URL: z.string().optional(),
  KHIPU_RETURN_URL: z.string().optional(),
  KHIPU_CANCEL_URL: z.string().optional()
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  WEB_URL: process.env.WEB_URL,
  API_URL: process.env.API_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  KHIPU_API_KEY: process.env.KHIPU_API_KEY,
  KHIPU_RECEIVER_ID: process.env.KHIPU_RECEIVER_ID,
  KHIPU_SECRET: process.env.KHIPU_SECRET,
  KHIPU_NOTIFY_URL: process.env.KHIPU_NOTIFY_URL,
  KHIPU_RETURN_URL: process.env.KHIPU_RETURN_URL,
  KHIPU_CANCEL_URL: process.env.KHIPU_CANCEL_URL
});
