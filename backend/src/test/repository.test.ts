import { describe, expect, it } from "bun:test";
import type { EventInput } from "../types";

// Example mock event
const mockEventInput: EventInput = {
  title: "Mock Event",
  date: "2026-03-20T10:00:00Z",
  description: "A mocked event for testing",
  location: "Mock Location",
  image_url: "https://example.com/mock.jpg",
  max_participants: 10,
};

describe("Event Input Validation (Mock-Only)", () => {
  it("should validate required fields", () => {
    const input: EventInput = { title: "Test Event", date: "2026-03-20T10:00:00Z" };
    expect(input.title).toBe("Test Event");
    expect(input.date).toBe("2026-03-20T10:00:00Z");
  });

  it("should handle optional fields", () => {
    const input: EventInput = { ...mockEventInput };
    expect(input.description).toBe("A mocked event for testing");
    expect(input.location).toBe("Mock Location");
    expect(input.max_participants).toBe(10);
  });

  it("should allow updating fields in mock object", () => {
    const updated: EventInput = { ...mockEventInput, title: "Updated Title", max_participants: 20 };
    expect(updated.title).toBe("Updated Title");
    expect(updated.max_participants).toBe(20);
  });

  it("should allow removing optional fields", () => {
    const minimal: EventInput = { title: "Minimal Event", date: "2026-03-25T10:00:00Z" };
    expect(minimal.description).toBeUndefined();
    expect(minimal.location).toBeUndefined();
    expect(minimal.max_participants).toBeUndefined();
  });
});
