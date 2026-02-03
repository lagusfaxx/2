import { SessionPayload } from "./lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}
