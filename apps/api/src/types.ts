export type SessionUser = {
  userId: string;
  role: "USER" | "ADMIN" | "STAFF" | "SUPPORT";
};

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}
