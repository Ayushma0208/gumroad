/**
 * In-memory auth store for the Next.js mock of Express /auth/*.
 * Swap `lib/api/auth.ts` to the real API and delete this module.
 *
 * Kept on globalThis so sessions survive Turbopack HMR in development.
 */

import type { AuthUser, CreatorStoreProfile, UserRole } from "@/types/auth";

export type StoredAccount = AuthUser & {
  password: string;
};

type SessionRecord = {
  userId: string;
  createdAt: number;
};

type AuthMemory = {
  accounts: Map<string, StoredAccount>;
  sessions: Map<string, SessionRecord>;
};

const globalForAuth = globalThis as typeof globalThis & {
  __lumenAuthMemory?: AuthMemory;
};

function demoAccounts(): StoredAccount[] {
  return [
    {
      id: "u_leah",
      name: "Leah Okonkwo",
      email: "leah@example.com",
      role: "CUSTOMER",
      avatarUrl: null,
      creatorProfile: null,
      password: "password12",
    },
    {
      id: "u_mira",
      name: "Mira Chen",
      email: "mira@example.com",
      role: "CREATOR",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      creatorProfile: {
        displayName: "Mira Chen",
        storeName: "Northline Studio",
        slug: "mira",
        bio: "Typography and interface systems for studios that still print.",
        category: "design",
        avatarUrl:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      },
      password: "password12",
    },
    {
      id: "u_admin",
      name: "Lumen Ops",
      email: "admin@example.com",
      role: "ADMIN",
      avatarUrl: null,
      creatorProfile: null,
      password: "password12",
    },
  ];
}

function createMemory(): AuthMemory {
  const accounts = new Map<string, StoredAccount>();
  const sessions = new Map<string, SessionRecord>();
  for (const account of demoAccounts()) {
    accounts.set(account.email, account);
  }
  return { accounts, sessions };
}

function ensureDemoAccounts(store: AuthMemory) {
  for (const account of demoAccounts()) {
    if (!store.accounts.has(account.email)) {
      store.accounts.set(account.email, account);
    }
  }
}

const memory = (globalForAuth.__lumenAuthMemory ??= createMemory());
ensureDemoAccounts(memory);

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "discover",
  "lumen",
  "login",
  "signup",
  "www",
]);

export function toPublicUser(account: StoredAccount): AuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    avatarUrl: account.avatarUrl ?? account.creatorProfile?.avatarUrl ?? null,
    creatorProfile: account.creatorProfile ?? null,
  };
}

export function findAccountByEmail(email: string): StoredAccount | undefined {
  return memory.accounts.get(email.trim().toLowerCase());
}

export function findAccountById(id: string): StoredAccount | undefined {
  for (const account of memory.accounts.values()) {
    if (account.id === id) return account;
  }
  return undefined;
}

export function createAccount(input: {
  name: string;
  email: string;
  password: string;
}): StoredAccount | { error: string } {
  const email = input.email.trim().toLowerCase();
  if (memory.accounts.has(email)) {
    return { error: "An account with this email already exists. Sign in instead." };
  }

  const account: StoredAccount = {
    id: `u_${crypto.randomUUID()}`,
    name: input.name.trim(),
    email,
    password: input.password,
    role: "CUSTOMER",
    avatarUrl: null,
    creatorProfile: null,
  };
  memory.accounts.set(email, account);
  return account;
}

export function createSession(userId: string): string {
  const sessionId = crypto.randomUUID();
  memory.sessions.set(sessionId, { userId, createdAt: Date.now() });
  return sessionId;
}

export function getSessionUser(sessionId: string | undefined): AuthUser | null {
  if (!sessionId) return null;
  const session = memory.sessions.get(sessionId);
  if (!session) return null;
  const account = findAccountById(session.userId);
  return account ? toPublicUser(account) : null;
}

export function destroySession(sessionId: string | undefined): void {
  if (!sessionId) return;
  memory.sessions.delete(sessionId);
}

export function slugIsAvailable(slug: string, ignoreUserId?: string): boolean {
  const normalized = slug.trim().toLowerCase();
  if (normalized.length < 3 || RESERVED_SLUGS.has(normalized)) return false;
  for (const account of memory.accounts.values()) {
    if (account.creatorProfile?.slug === normalized && account.id !== ignoreUserId) {
      return false;
    }
  }
  return true;
}

export function becomeCreator(
  userId: string,
  profile: CreatorStoreProfile,
): AuthUser | { error: string } {
  const account = findAccountById(userId);
  if (!account) return { error: "You need to sign in again." };
  if (account.role === "ADMIN") {
    return { error: "Admin accounts do not need a creator store." };
  }
  if (!slugIsAvailable(profile.slug, account.id)) {
    return { error: "That store URL is taken. Try another." };
  }

  const next: StoredAccount = {
    ...account,
    role: "CREATOR",
    avatarUrl: profile.avatarUrl || account.avatarUrl,
    creatorProfile: profile,
  };
  memory.accounts.set(account.email, next);
  return toPublicUser(next);
}

export function updateAccount(
  userId: string,
  patch: Partial<Pick<AuthUser, "name" | "avatarUrl">>,
): AuthUser | { error: string } {
  const account = findAccountById(userId);
  if (!account) return { error: "You need to sign in again." };
  const next: StoredAccount = { ...account, ...patch };
  memory.accounts.set(account.email, next);
  return toPublicUser(next);
}

export type { UserRole };
