import { describe, it, expect, beforeEach } from "bun:test";
import { createSession, validateSession, deleteSession } from "./sessions";

describe("Sessions", () => {
  beforeEach(() => {
    // Clear sessions before each test by getting the internal map
    // We'll need to create fresh tokens for each test
  });

  describe("createSession", () => {
    it("should create a valid session token", () => {
      const token = createSession();
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should create unique tokens", () => {
      const token1 = createSession();
      const token2 = createSession();
      expect(token1).not.toBe(token2);
    });
  });

  describe("validateSession", () => {
    it("should validate an active session", () => {
      const token = createSession();
      expect(validateSession(token)).toBe(true);
    });

    it("should reject non-existent tokens", () => {
      const fakeToken = crypto.randomUUID();
      expect(validateSession(fakeToken)).toBe(false);
    });

    it("should handle empty string token", () => {
      expect(validateSession("")).toBe(false);
    });
  });

  describe("deleteSession", () => {
    it("should delete an existing session", () => {
      const token = createSession();
      expect(validateSession(token)).toBe(true);
      deleteSession(token);
      expect(validateSession(token)).toBe(false);
    });

    it("should not throw when deleting non-existent session", () => {
      const fakeToken = crypto.randomUUID();
      expect(() => deleteSession(fakeToken)).not.toThrow();
    });
  });
});
