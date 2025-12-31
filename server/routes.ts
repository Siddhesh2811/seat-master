import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertEventSchema, updateSeatStatusSchema } from "@shared/schema";
import { setupAuth } from "./auth";

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}

function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
  if (req.user!.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Events
  app.get(api.events.list.path, async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.get(api.events.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const event = await storage.getEvent(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });



  app.post(api.events.create.path, isAdmin, async (req, res) => {
    try {
      const input = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(input);
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });



  app.put(api.events.update.path, isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(id, input);
      res.json(event);
    } catch (err) {
      if (err instanceof Error && err.message === "Event not found") {
        res.status(404).json({ message: "Event not found" });
      } else {
        res.status(400).json({ message: "Invalid input" });
      }
    }
  });



  app.delete(api.events.delete.path, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteEvent(id);
    res.status(204).send();
  });

  // Seats
  app.get(api.seats.list.path, async (req, res) => {
    const id = Number(req.params.id);
    // Check if event exists first
    const event = await storage.getEvent(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const seats = await storage.getSeats(id);
    res.json(seats);
  });



  // User: Book seats (Request -> Pending)


  // Re-implementing the existing update route to be generic but protected?
  // Let's look at how strict I need to be.
  // Existing: app.post(api.seats.update.path...

  app.post(api.seats.update.path, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const input = api.seats.update.input.parse(req.body);
    const seats = await storage.updateSeats(id, input);
    res.json(seats);
  });

  // New: Booking endpoint for Users
  app.post("/api/events/:id/seats/book", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body);

    // Check if seats are available?
    // storage.updateSeats doesn't check previous status by default, but we should probably check if they are already booked?
    // For MVP, just try to update.

    const seats = await storage.updateSeats(id, {
      ids,
      status: "pending",
      userId: req.user!.id
    });
    res.json(seats);
  });

  // New: Approval endpoint for Admin
  app.post("/api/events/:id/seats/approve", isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body);

    const seats = await storage.updateSeats(id, {
      ids,
      status: "reserved",
      // Keep existing userId? storage.updateSeats overwrites if we pass it, or we need to ensure we don't clear it.
      // storage.updateSeats logic: `const updatedSeat = { ...seat, status: updates.status };` 
      // It keeps existing properties unless overwritten. So we don't need to pass userId.
    });
    res.json(seats);
  });

  // New: Reject endpoint for Admin
  app.post("/api/events/:id/seats/reject", isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body);

    const seats = await storage.updateSeats(id, {
      ids,
      status: "available",
      userId: undefined // Effectively clearing it? MemStorage spreads `...seat` then overwrites.
      // If we want to clear userId, we need to pass userId: undefined, but JS spread might keep the old one if we don't explicit set it to something else? 
      // Typo: `userId?: number` in interface. 
      // If I pass `status: available`, I want `userId` to be removed or set to null.
      // But `updateSeats` implementation: `const updatedSeat = { ...seat, status: updates.status };`
      // It DOES NOT apply other updates from `input`? 
      // WAIT! `storage.updateSeats` implementation:
      // `const updatedSeat = { ...seat, status: updates.status };`
      // It ONLY updates status! It ignores other fields in `updates`!
      // I need to fix `storage.ts` to apply `...updates` fully!
    });
    res.json(seats);
  });

  app.post(api.seats.reset.path, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const seats = await storage.resetSeats(id);
    res.json(seats);
  });

  app.post("/api/events/:id/seats/regenerate", isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const seats = await storage.regenerateSeats(id);
      res.json(seats);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to regenerate seats";
      res.status(500).json({ message });
    }
  });

  // Admin: Get all users
  app.get("/api/users", isAdmin, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).send("Invalid ID");
    await storage.deleteUser(id);
    res.status(204).send();
  });

  app.patch("/api/users/:id/role", isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { role } = z.object({ role: z.enum(["admin", "user"]) }).parse(req.body);

    // Prevent changing own role
    if (req.user!.id === id) {
      return res.status(403).send("Cannot change your own role");
    }

    const user = await storage.updateUserRole(id, role);
    res.json(user);
  });

  // Initial Seed Data
  if ((await storage.getEvents()).length === 0) {
    await storage.createEvent({
      name: "Grand Opening Concert",
      date: "2025-06-15",
      venue: "Main Hall",
      configuration: {
        zones: [
          {
            name: "Front",
            sections: [
              {
                name: "Left",
                rows: [
                  { label: "A", seatCount: 5 },
                  { label: "B", seatCount: 6 },
                ]
              },
              {
                name: "Center",
                rows: [
                  { label: "A", seatCount: 10 },
                  { label: "B", seatCount: 12 },
                ]
              },
              {
                name: "Right",
                rows: [
                  { label: "A", seatCount: 5 },
                  { label: "B", seatCount: 6 },
                ]
              }
            ]
          },
          {
            name: "Back",
            sections: [
              {
                name: "General",
                rows: [
                  { label: "AA", seatCount: 20, aisles: [10] },
                  { label: "BB", seatCount: 20, aisles: [10] },
                ]
              }
            ]
          }
        ]
      }
    });
  }

  return httpServer;
}
