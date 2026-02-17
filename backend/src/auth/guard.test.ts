import { describe, it, expect } from "bun:test";
import { extractBearerToken } from "./routes";
import { requireAuth } from "./guard";
import { createSession } from "./sessions";

describe("Auth Guard", () => {
  describe("requireAuth", () => {
    it("should allow requests with valid auth token", () => {
      const token = createSession();
      const req = new Request("http://localhost:3000/api/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = requireAuth(req);
      expect(result).toBeNull();
    });

    it("should reject requests without token", () => {
      const req = new Request("http://localhost:3000/api/events");
      const result = requireAuth(req);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(401);
    });

    it("should reject requests with invalid token format", () => {
      const req = new Request("http://localhost:3000/api/events", {
        headers: {
          Authorization: "Invalid format",
        },
      });
      const result = requireAuth(req);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(401);
    });

    it("should reject requests with fake token", () => {
      const fakeToken = crypto.randomUUID();
      const req = new Request("http://localhost:3000/api/events", {
        headers: {
          Authorization: `Bearer ${fakeToken}`,
        },
      });
      const result = requireAuth(req);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(401);
    });

    it("should reject requests with Bearer prefix but no token", () => {
      const req = new Request("http://localhost:3000/api/events", {
        headers: {
          Authorization: "Bearer ",
        },
      });
      const result = requireAuth(req);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(401);
    });
  });

  describe("extractBearerToken", () => {
    it("should extract token from Bearer auth header", () => {
      const token = "test-token-123";
      const req = new Request("http://localhost:3000/api/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      expect(extractBearerToken(req)).toBe(token);
    });

    it("should return null when no auth header", () => {
      const req = new Request("http://localhost:3000/api/events");
      expect(extractBearerToken(req)).toBeNull();
    });

    it("should return null for non-Bearer auth headers", () => {
      const req = new Request("http://localhost:3000/api/events", {
        headers: {
          Authorization: "Basic dXNlcjpwYXNz",
        },
      });
      expect(extractBearerToken(req)).toBeNull();
    });
  });
});
