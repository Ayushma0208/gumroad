import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, UserRole } from "@/types/auth";

type StoredAccount = AuthUser & { password: string };

type SignupInput = {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "ADMIN">;
};

type AuthResult = { ok: true } | { ok: false; error: string };

type AuthState = {
  accounts: StoredAccount[];
  user: AuthUser | null;
  signup: (input: SignupInput) => AuthResult;
  login: (email: string, password: string) => AuthResult;
  logout: () => void;
  becomeCreator: () => void;
};

function toPublicUser(account: StoredAccount): AuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      user: null,
      signup: (input) => {
        const email = input.email.trim().toLowerCase();
        const exists = get().accounts.some((account) => account.email === email);
        if (exists) {
          return {
            ok: false,
            error: "An account with this email already exists. Sign in instead.",
          };
        }

        const account: StoredAccount = {
          id: crypto.randomUUID(),
          name: input.name.trim(),
          email,
          password: input.password,
          role: input.role,
        };

        set({
          accounts: [...get().accounts, account],
          user: toPublicUser(account),
        });
        return { ok: true };
      },
      login: (email, password) => {
        const normalized = email.trim().toLowerCase();
        const account = get().accounts.find((row) => row.email === normalized);
        if (!account || account.password !== password) {
          return { ok: false, error: "Email or password is incorrect." };
        }
        set({ user: toPublicUser(account) });
        return { ok: true };
      },
      logout: () => set({ user: null }),
      becomeCreator: () => {
        const current = get().user;
        if (!current) return;
        set({
          user: { ...current, role: "CREATOR" },
          accounts: get().accounts.map((account) =>
            account.id === current.id
              ? { ...account, role: "CREATOR" }
              : account,
          ),
        });
      },
    }),
    {
      name: "lumen-auth",
      skipHydration: true,
      partialize: (state) => ({
        accounts: state.accounts,
        user: state.user,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          accounts?: AuthState["accounts"];
          user?: AuthState["user"];
        } | undefined;

        if (currentState.user) {
          return currentState;
        }

        return {
          ...currentState,
          accounts: persisted?.accounts ?? currentState.accounts,
          user: persisted?.user ?? currentState.user,
        };
      },
    },
  ),
);
