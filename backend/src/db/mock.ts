/**
 * Database Mock Utilities for Testing
 * 
 * This module provides utilities to mock the SQL database connection
 * for testing purposes, allowing tests to run without a real database.
 */

import type { Event, EventInput } from "../types";

export interface SqlMockOptions {
  events?: Event[];
}

/**
 * Creates a mock SQL connection that stores data in memory
 * Useful for unit testing without requiring a real database
 */
export function createMockSql(options: SqlMockOptions = {}) {
  const storage = {
    events: new Map<number, Event>(options.events?.map(e => [e.id, e]) ?? []),
    nextEventId: Math.max(0, ...(options.events?.map(e => e.id) ?? [0])) + 1,
  };

  const mockSql = async (query: TemplateStringsArray, ...params: unknown[]) => {
    const queryStr = query.join("?");

    // Mock listEvents
    if (queryStr.includes("SELECT * FROM events ORDER BY date ASC")) {
      if (queryStr.includes("WHERE date >= NOW()")) {
        // Future events only
        const today = new Date();
        return Array.from(storage.events.values())
          .filter(e => new Date(e.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      // All events
      return Array.from(storage.events.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // Mock getEvent
    if (queryStr.includes("SELECT * FROM events WHERE id = ?")) {
      const id = params[0] as number;
      const event = storage.events.get(id);
      return event ? [event] : [];
    }

    // Mock createEvent
    if (queryStr.includes("INSERT INTO events")) {
      const id = storage.nextEventId++;
      const now = new Date().toISOString();
      const event: Event = {
        id,
        title: params[0] as string,
        description: (params[1] as string) || "",
        date: params[2] as string,
        end_date: (params[3] as string | null) || null,
        location: (params[4] as string) || "",
        image_url: (params[5] as string | null) || null,
        max_participants: (params[6] as number | null) || null,
        created_at: now,
        updated_at: now,
      };
      storage.events.set(id, event);
      return [event];
    }

    // Mock updateEvent
    if (queryStr.includes("UPDATE events SET")) {
      const id = params.pop() as number; // id is the last parameter
      const event = storage.events.get(id);
      if (!event) return [];

      const now = new Date().toISOString();
      const updated: Event = {
        ...event,
        title: params[0] as string,
        description: (params[1] as string) || "",
        date: params[2] as string,
        end_date: (params[3] as string | null) || null,
        location: (params[4] as string) || "",
        image_url: (params[5] as string | null) || null,
        max_participants: (params[6] as number | null) || null,
        updated_at: now,
      };
      storage.events.set(id, updated);
      return [updated];
    }

    // Mock deleteEvent
    if (queryStr.includes("DELETE FROM events WHERE id = ?")) {
      const id = params[0] as number;
      if (storage.events.has(id)) {
        storage.events.delete(id);
        return [{ id }];
      }
      return [];
    }

    return [];
  };

  return {
    mockSql,
    storage,
  };
}

/**
 * Creates sample event data for testing
 */
export function createMockEvent(overrides?: Partial<Event>): Event {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  return {
    id: 1,
    title: "Test Event",
    description: "A test event",
    date: futureDate.toISOString(),
    end_date: null,
    location: "Test Location",
    image_url: null,
    max_participants: 20,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

/**
 * Creates sample event input data for testing
 */
export function createMockEventInput(overrides?: Partial<EventInput>): EventInput {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

  return {
    title: "Test Event",
    description: "A test event",
    date: futureDate.toISOString(),
    location: "Test Location",
    max_participants: 20,
    ...overrides,
  };
}
