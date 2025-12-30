import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type UpdateSeatStatusRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSeats(eventId: number) {
  return useQuery({
    queryKey: [api.seats.list.path, eventId],
    queryFn: async () => {
      const url = buildUrl(api.seats.list.path, { id: eventId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch seats");
      return api.seats.list.responses[200].parse(await res.json());
    },
    enabled: !isNaN(eventId),
  });
}

export function useUpdateSeats() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, ...data }: { eventId: number } & UpdateSeatStatusRequest) => {
      const url = buildUrl(api.seats.update.path, { id: eventId });
      const validated = api.seats.update.input.parse(data);
      const res = await fetch(url, {
        method: api.seats.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update seats");
      return api.seats.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.seats.list.path, variables.eventId] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useResetSeats() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: number) => {
      const url = buildUrl(api.seats.reset.path, { id: eventId });
      const res = await fetch(url, { method: api.seats.reset.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to reset seats");
      return api.seats.reset.responses[200].parse(await res.json());
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: [api.seats.list.path, eventId] });
      toast({ title: "Reset", description: "All seats have been reset to available" });
    },
  });
}

export function useBookSeat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, ids }: { eventId: number; ids: string[] }) => {
      const res = await fetch(`/api/events/${eventId}/seats/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to book seats");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.seats.list.path, variables.eventId] });
      toast({ title: "Request Sent", description: "Your booking request is pending approval." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useApproveSeat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, ids }: { eventId: number; ids: string[] }) => {
      const res = await fetch(`/api/events/${eventId}/seats/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to approve seats");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.seats.list.path, variables.eventId] });
      toast({ title: "Approved", description: "Seats have been reserved." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useRejectSeat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, ids }: { eventId: number; ids: string[] }) => {
      const res = await fetch(`/api/events/${eventId}/seats/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to reject seats");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.seats.list.path, variables.eventId] });
      toast({ title: "Rejected", description: "Seats request has been rejected." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
