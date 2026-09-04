import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import type { Role } from "@prisma/client";

const { userFindUnique, userCreate } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
      create: userCreate,
    },
    $connect: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { cookieName } from "../src/config/cookies";

const app = createApp();
const password = "password12";

function publicUser(overrides: {
  id?: string;
  email?: string;
  role?: Role;
  passwordHash?: string;
} = {}) {
  return {
    id: overrides.id ?? "u_1",
    name: "Leah Okonkwo",
    email: overrides.email ?? "leah@example.com",
    role: overrides.role ?? "CUSTOMER",
    avatarUrl: null,
    passwordHash: overrides.passwordHash,
    creatorProfile: null,
  };
}

describe("auth", () => {
  beforeEach(() => {
    userFindUnique.mockReset();
    userCreate.mockReset();
  });

  it("registers a customer and sets a session cookie", async () => {
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValue(publicUser());

    const response = await request(app).post("/api/v1/auth/register").send({
      name: "Leah Okonkwo",
      email: "leah@example.com",
      password,
      confirmPassword: password,
      terms: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe("leah@example.com");
    expect(response.body.data.user.role).toBe("CUSTOMER");
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.headers["set-cookie"]?.[0]).toContain(`${cookieName()}=`);
    expect(userCreate.mock.calls[0]?.[0].data.passwordHash).not.toBe(password);
  });

  it("rejects a duplicate email", async () => {
    userFindUnique.mockResolvedValue(publicUser());

    const response = await request(app).post("/api/v1/auth/register").send({
      name: "Leah Okonkwo",
      email: "leah@example.com",
      password,
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it("logs in with valid credentials", async () => {
    const passwordHash = await bcrypt.hash(password, 4);
    userFindUnique.mockResolvedValue(publicUser({ passwordHash }));

    const response = await request(app).post("/api/v1/auth/login").send({
      email: "leah@example.com",
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe("leah@example.com");
    expect(response.headers["set-cookie"]?.[0]).toContain(`${cookieName()}=`);
  });

  it("rejects invalid login", async () => {
    const passwordHash = await bcrypt.hash(password, 4);
    userFindUnique.mockResolvedValue(publicUser({ passwordHash }));

    const response = await request(app).post("/api/v1/auth/login").send({
      email: "leah@example.com",
      password: "wrongpass1",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("returns the current user from /me", async () => {
    const passwordHash = await bcrypt.hash(password, 4);
    const stored = publicUser({ passwordHash });
    userFindUnique
      .mockResolvedValueOnce(stored)
      .mockResolvedValueOnce(stored)
      .mockResolvedValueOnce(stored);

    const login = await request(app).post("/api/v1/auth/login").send({
      email: "leah@example.com",
      password,
    });
    const cookie = login.headers["set-cookie"];

    const me = await request(app).get("/api/v1/auth/me").set("Cookie", cookie);

    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe("leah@example.com");
  });

  it("clears the session on logout", async () => {
    const passwordHash = await bcrypt.hash(password, 4);
    userFindUnique.mockResolvedValue(publicUser({ passwordHash }));

    const login = await request(app).post("/api/v1/auth/login").send({
      email: "leah@example.com",
      password,
    });

    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", login.headers["set-cookie"]);

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]?.[0]).toContain(`${cookieName()}=`);
  });

  it("rejects unauthenticated protected routes", async () => {
    const response = await request(app).get("/api/v1/users/me");
    expect(response.status).toBe(401);
  });

  it("rejects customers from creator-only routes", async () => {
    const passwordHash = await bcrypt.hash(password, 4);
    const stored = publicUser({ passwordHash, role: "CUSTOMER" });
    userFindUnique.mockResolvedValue(stored);

    const login = await request(app).post("/api/v1/auth/login").send({
      email: "leah@example.com",
      password,
    });

    userFindUnique.mockResolvedValue(stored);

    const response = await request(app)
      .get("/api/v1/users/creator-only")
      .set("Cookie", login.headers["set-cookie"]);

    expect(response.status).toBe(403);
  });

  it("allows creators on creator-only routes", async () => {
    const passwordHash = await bcrypt.hash(password, 4);
    const stored = publicUser({
      passwordHash,
      role: "CREATOR",
      email: "mira@example.com",
      id: "u_mira",
    });
    userFindUnique.mockResolvedValue(stored);

    const login = await request(app).post("/api/v1/auth/login").send({
      email: "mira@example.com",
      password,
    });

    userFindUnique.mockResolvedValue(stored);

    const response = await request(app)
      .get("/api/v1/users/creator-only")
      .set("Cookie", login.headers["set-cookie"]);

    expect(response.status).toBe(200);
    expect(response.body.data.ok).toBe(true);
  });
});

describe("health", () => {
  it("returns a healthy payload", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("healthy");
    expect(response.body.data.service).toBe("creator-marketplace-api");
  });
});
