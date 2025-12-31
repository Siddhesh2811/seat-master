import { pgTable, text, serial, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// === TABLE DEFINITIONS (Mocking PG tables for consistency with Zod) ===
// Even though we use MemStorage, defining tables helps with Drizzle Zod generation
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  venue: text("venue").notNull(),
  // Configuration stores the hierarchy: Zones -> Sections -> Rows
  configuration: jsonb("configuration").$type<EventConfiguration>().notNull(),
});

export const seats = pgTable("seats", {
  id: text("id").primaryKey(), // Format: EVENTID-ZONE-SECTION-ROW-NUM
  eventId: serial("event_id").notNull(),
  status: text("status").notNull(), // available, reserved, blocked, pending
  userId: integer("user_id"), // User who booked/requested the seat
  label: jsonb("label").$type<Seat['label']>().notNull(),
});

// === TYPES ===
export type SeatStatus = "available" | "reserved" | "blocked" | "pending";

export interface Seat {
  id: string;
  eventId: number;
  status: SeatStatus;
  userId?: number | null;
  label: {
    zone: string;
    section: string;
    row: string;
    seat: string;
  };
}

export interface RowConfig {
  label: string;
  seatCount: number;
  aisles?: number[]; // Support multiple aisles at specific seat numbers
}

export interface SectionConfig {
  name: string; // Left, Center, Right
  rows: RowConfig[];
}

export interface ZoneConfig {
  name: string; // Front, Middle, Back
  sections: SectionConfig[];
}

export interface EventConfiguration {
  zones: ZoneConfig[];
}

// === SCHEMAS ===
// Custom Zod schema for Configuration because jsonb is generic
export const rowConfigSchema = z.object({
  label: z.string(),
  seatCount: z.number().min(1),
  aisles: z.array(z.number()).optional(),
});

export const sectionConfigSchema = z.object({
  name: z.string(),
  rows: z.array(rowConfigSchema),
});

export const zoneConfigSchema = z.object({
  name: z.string(),
  sections: z.array(sectionConfigSchema),
});

export const eventConfigurationSchema = z.object({
  zones: z.array(zoneConfigSchema),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true
}).extend({
  configuration: eventConfigurationSchema
});

export const seatSchema = z.object({
  id: z.string(),
  eventId: z.number(),
  status: z.enum(["available", "reserved", "blocked", "pending"]),
  userId: z.number().nullable().optional(),
  label: z.object({
    zone: z.string(),
    section: z.string(),
    row: z.string(),
    seat: z.string(),
  })
});

// === EXPLICIT API TYPES ===
export type Event = z.infer<typeof insertEventSchema> & { id: number };
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEventRequest = Partial<InsertEvent>;

// Request to update a single seat or bulk update
export const updateSeatStatusSchema = z.object({
  ids: z.array(z.string()),

  status: z.enum(["available", "reserved", "blocked", "pending"]),
  userId: z.number().optional(),
});

export type UpdateSeatStatusRequest = z.infer<typeof updateSeatStatusSchema>;
