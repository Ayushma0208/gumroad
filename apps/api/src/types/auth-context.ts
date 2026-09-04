import type { Role } from "@prisma/client";

export type AuthContext = {
  id: string;
  email: string;
  role: Role;
};
