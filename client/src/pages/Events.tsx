import { useState } from "react";
import { useEvents, useCreateEvent, useDeleteEvent } from "@/hooks/use-events";
import { Link } from "wouter";
import { Plus, Search, MapPin, Calendar as CalendarIcon, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar } from "@/components/Sidebar";
import { EventForm } from "@/components/EventForm";
import { format } from "date-fns";

export default function Events() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredEvents = events?.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.venue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64 flex-1">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display">Events</h1>
              <p className="text-muted-foreground mt-1">Manage your upcoming shows and seating configurations.</p>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg hover:shadow-primary/25 transition-all">
                  <Plus className="mr-2 h-4 w-4" /> Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <EventForm 
                  onSubmit={(data) => {
                    createEvent.mutate(data, {
                      onSuccess: () => setIsCreateOpen(false)
                    });
                  }}
                  isSubmitting={createEvent.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search events..." 
              className="pl-10 max-w-md bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredEvents?.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground">No events found. Create your first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents?.map((event) => (
                <div 
                  key={event.id}
                  className="group relative bg-card hover:bg-card/50 border border-border hover:border-primary/50 rounded-xl p-6 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                      <CalendarIcon className="h-6 w-6" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm("Are you sure? This will delete all configuration and seat data.")) {
                              deleteEvent.mutate(event.id);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="text-xl font-bold mb-2 line-clamp-1">{event.name}</h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 opacity-70" />
                      {format(new Date(event.date), "MMMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 opacity-70" />
                      {event.venue}
                    </div>
                  </div>

                  <Link href={`/events/${event.id}`}>
                    <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      Manage Seating
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
