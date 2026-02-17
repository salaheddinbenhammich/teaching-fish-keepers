import { describe, it, expect, beforeEach } from "bun:test";
import { handleAuthRoutes, extractBearerToken } from "./routes";
import { createSession } from "./sessions";

describe("Auth Routes", () => {
  describe("POST /api/auth/login", () => {
    it("should return token with correct password", async () => {
      const adminPassword = process.env.ADMIN_PASSWORD ?? "admin";
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: adminPassword }),
      });
      const url = new URL(req.url);

      const response = await handleAuthRoutes(req, url);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(200);

      const body = await response?.json();
      expect(body).toHaveProperty("token");
      expect(typeof body.token).toBe("string");
      expect(body.token.length).toBeGreaterThan(0);
    });

    it("should reject wrong password", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password: "wrong-password" }),
      });
      const url = new URL(req.url);

      const response = await handleAuthRoutes(req, url);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);

      const body = await response?.json();
      expect(body).toHaveProperty("error");
      expect(body.error).toBe("Invalid password");
    });

    it("should reject missing password", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const url = new URL(req.url);

      const response = await handleAuthRoutes(req, url);
      expect(response?.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return authenticated true with valid token", async () => {
      const token = createSession();
      const req = new Request("http://localhost:3000/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const url = new URL(req.url);

      const response = await handleAuthRoutes(req, url);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(200);

      const body = await response?.json();
      expect(body.authenticated).toBe(true);
    });

    it("should return authenticated false without token", async () => {
      const req = new Request("http://localhost:3000/api/auth/me", {
        method: "GET",
      });
      const url = new URL(req.url);

      const response = await handleAuthRoutes(req, url);
      expect(response?.status).toBe(200);

      const body = await response?.json();
      expect(body.authenticated).toBe(false);
    });

    it("should return authenticated false with invalid token", async () => {
      const fakeToken = crypto.randomUUID();
      const req = new Request("http://localhost:3000/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${fakeToken}`,
        },
      });
      const url = new URL(req.url);

      const response = await handleAuthRoutes(req, url);
      const body = await response?.json();
      expect(body.authenticated).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should return ok true on logout", async () => {
      const token = createSession();
      const req = new Request("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const url = new URL(req.url);

      const response = await handleAuthRoutes(req, url);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(200);

      const body = await response?.json();
      expect(body.ok).toBe(true);
    });

    it("should return ok true even without token", async () => {
      const req = new Request("http://localhost:3000/api/auth/logout", {
        method: "POST",
      });
      const url = new URL(req.url);

      const response = await handleAuthRoutes(req, url);
      expect(response?.status).toBe(200);

      const body = await response?.json();
      expect(body.ok).toBe(true);
    });
  });

  describe("Not Found Routes", () => {
    it("should return null for unknown routes", async () => {
      const req = new Request("http://localhost:3000/api/unknown", {
        method: "GET",
      });
      const url = new URL(req.url);

      const response = await handleAuthRoutes(req, url);
      expect(response).toBeNull();
    });
  });
});
