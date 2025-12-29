import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertEventSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

  app.post(api.events.create.path, async (req, res) => {
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

  app.put(api.events.update.path, async (req, res) => {
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

  app.delete(api.events.delete.path, async (req, res) => {
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

  app.post(api.seats.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const input = api.seats.update.input.parse(req.body);
    const seats = await storage.updateSeats(id, input);
    res.json(seats);
  });

  app.post(api.seats.reset.path, async (req, res) => {
    const id = Number(req.params.id);
    const seats = await storage.resetSeats(id);
    res.json(seats);
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
                  { label: "AA", seatCount: 20, aisleAfter: 10 },
                  { label: "BB", seatCount: 20, aisleAfter: 10 },
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
