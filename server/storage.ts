import { type Event, type InsertEvent, type Seat, type UpdateSeatStatusRequest } from "@shared/schema";

export interface IStorage {
  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Seats
  getSeats(eventId: number): Promise<Seat[]>;
  updateSeats(eventId: number, updates: UpdateSeatStatusRequest): Promise<Seat[]>;
  resetSeats(eventId: number): Promise<Seat[]>;
}

export class MemStorage implements IStorage {
  private events: Map<number, Event>;
  private seats: Map<string, Seat>; // Key is ID
  private currentId: number;

  constructor() {
    this.events = new Map();
    this.seats = new Map();
    this.currentId = 1;
  }

  // === Events ===
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentId++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    
    // Initial seat generation based on configuration
    this.generateSeatsForEvent(event);
    
    return event;
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event> {
    const existing = this.events.get(id);
    if (!existing) throw new Error("Event not found");
    
    const updated = { ...existing, ...updates };
    this.events.set(id, updated);
    
    // Regenerate seats if configuration changed (naive approach: resets status of removed seats, keeps existing IDs if possible)
    if (updates.configuration) {
      // In a real app we might want to preserve statuses more carefully, 
      // but for this MVP we'll re-generate and try to merge statuses where IDs match.
      this.regenerateSeatsPreservingStatus(updated);
    }
    
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    this.events.delete(id);
    // Cleanup seats
    for (const [seatId, seat] of this.seats.entries()) {
      if (seat.eventId === id) {
        this.seats.delete(seatId);
      }
    }
  }

  // === Seats ===
  async getSeats(eventId: number): Promise<Seat[]> {
    return Array.from(this.seats.values()).filter(s => s.eventId === eventId);
  }

  async updateSeats(eventId: number, updates: UpdateSeatStatusRequest): Promise<Seat[]> {
    const updatedSeats: Seat[] = [];
    
    for (const id of updates.ids) {
      const seat = this.seats.get(id);
      if (seat && seat.eventId === eventId) {
        const updatedSeat = { 
          ...seat, 
          status: updates.status,
          requestedBy: updates.requestedBy 
        };
        this.seats.set(id, updatedSeat);
        updatedSeats.push(updatedSeat);
      }
    }
    
    return updatedSeats;
  }

  async resetSeats(eventId: number): Promise<Seat[]> {
    const eventSeats = await this.getSeats(eventId);
    const resetSeats: Seat[] = [];
    
    for (const seat of eventSeats) {
      const updated = { ...seat, status: "available" as const };
      this.seats.set(seat.id, updated);
      resetSeats.push(updated);
    }
    
    return resetSeats;
  }

  // === Helpers ===
  private generateSeatsForEvent(event: Event) {
    const { zones } = event.configuration;
    
    zones.forEach(zone => {
      zone.sections.forEach(section => {
        section.rows.forEach(row => {
          for (let i = 1; i <= row.seatCount; i++) {
            const seatId = `${event.id}-${zone.name}-${section.name}-${row.label}-${i}`;
            const seat: Seat = {
              id: seatId,
              eventId: event.id,
              status: "available",
              label: {
                zone: zone.name,
                section: section.name,
                row: row.label,
                seat: i.toString()
              }
            };
            this.seats.set(seatId, seat);
          }
        });
      });
    });
  }

  private regenerateSeatsPreservingStatus(event: Event) {
    const oldSeats = new Map(
      Array.from(this.seats.values())
           .filter(s => s.eventId === event.id)
           .map(s => [s.id, s])
    );
    
    // Clear current seats for this event
    for (const [id, seat] of this.seats.entries()) {
      if (seat.eventId === event.id) this.seats.delete(id);
    }

    // Generate new seats
    const { zones } = event.configuration;
    zones.forEach(zone => {
      zone.sections.forEach(section => {
        section.rows.forEach(row => {
          for (let i = 1; i <= row.seatCount; i++) {
            const seatId = `${event.id}-${zone.name}-${section.name}-${row.label}-${i}`;
            const oldSeat = oldSeats.get(seatId);
            
            const seat: Seat = {
              id: seatId,
              eventId: event.id,
              status: oldSeat ? oldSeat.status : "available",
              label: {
                zone: zone.name,
                section: section.name,
                row: row.label,
                seat: i.toString()
              }
            };
            this.seats.set(seatId, seat);
          }
        });
      });
    });
  }
}

export const storage = new MemStorage();
