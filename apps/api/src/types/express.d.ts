import type { AuthContext } from "./auth-context";

declare global {
  namespace Express {
    interface Request {
      user?: AuthContext;
    }
  }
}

export {};
