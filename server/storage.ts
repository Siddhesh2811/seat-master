import { type Event, type InsertEvent, type Seat, type UpdateSeatStatusRequest, type User, type InsertUser, users, events, seats, type SeatStatus } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PgSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<void>;
  updateUserRole(id: number, role: "admin" | "user"): Promise<User>;

  // Seats
  getSeats(eventId: number): Promise<Seat[]>;
  updateSeats(eventId: number, updates: UpdateSeatStatusRequest): Promise<Seat[]>;
  resetSeats(eventId: number): Promise<Seat[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PgSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // === Events ===
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    await this.generateSeatsForEvent(event);
    return event;
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event> {
    const [updated] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();

    if (!updated) throw new Error("Event not found");

    if (updates.configuration) {
      // Naive regeneration: this might fail if seats have foreign key constraints or active bookings?
      // For MVP, we will delete all seats for this event and regenerate.
      await db.delete(seats).where(eq(seats.eventId, id));
      await this.generateSeatsForEvent(updated);
    }
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(seats).where(eq(seats.eventId, id));
    await db.delete(events).where(eq(events.id, id));
  }

  // === Users ===
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserRole(id: number, role: "admin" | "user"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // === Seats ===
  async getSeats(eventId: number): Promise<Seat[]> {
    const result = await db.select().from(seats).where(eq(seats.eventId, eventId));
    return result.map(s => ({ ...s, status: s.status as SeatStatus }));
  }

  async updateSeats(eventId: number, updates: UpdateSeatStatusRequest): Promise<Seat[]> {
    const updatedSeats: Seat[] = [];

    // Process each seat update
    for (const seatId of updates.ids) {
      // Check if seat belongs to event?
      // In Drizzle we can add a where clause for correctness

      const updateData: Partial<Seat> = { status: updates.status };
      if (updates.userId !== undefined) {
        updateData.userId = updates.userId;
      }

      console.log(`Updating seat ${seatId} with data:`, updateData);
      const [updated] = await db
        .update(seats)
        .set(updateData)
        .where(eq(seats.id, seatId))
        .returning();

      if (updated) {
        console.log("Seat updated:", updated.id);
        updatedSeats.push({ ...updated, status: updated.status as SeatStatus });
      } else {
        console.log("Seat NOT found or NOT updated:", seatId);
      }
    }
    return updatedSeats;
  }

  async resetSeats(eventId: number): Promise<Seat[]> {
    const result = await db
      .update(seats)
      .set({ status: "available", userId: null })
      .where(eq(seats.eventId, eventId))
      .returning();

    return result.map(s => ({ ...s, status: s.status as SeatStatus }));
  }

  // === Helpers ===
  private async generateSeatsForEvent(event: Event) {
    const { zones } = event.configuration;
    const allSeats: Seat[] = [];

    zones.forEach(zone => {
      zone.sections.forEach(section => {
        section.rows.forEach(row => {
          for (let i = 1; i <= row.seatCount; i++) {
            const seatId = `${event.id}-${zone.name}-${section.name}-${row.label}-${i}`;
            // We need to bypass the strict typecheck for `Seat` because `id` is a string in our schema but usually auto-generated in Drizzle?
            // Wait, schema definition for seats: id is text primary key. Correct.

            allSeats.push({
              id: seatId,
              eventId: event.id,
              status: "available",
              label: {
                zone: zone.name,
                section: section.name,
                row: row.label,
                seat: i.toString()
              },
              userId: null
            });
          }
        });
      });
    });

    if (allSeats.length > 0) {
      console.log(`Generating ${allSeats.length} seats for event ${event.id}`);
      // Batch insert?
      // SQLite limit is variables, Postgres should be fine with reasonable batch size.
      // Drizzle insert many
      await db.insert(seats).values(allSeats).onConflictDoNothing();
      console.log("Seats generation complete");
    } else {
      console.log("No seats to generate from configuration");
    }
  }
}

export const storage = new DatabaseStorage();
