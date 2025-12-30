import { useState } from "react";
import { useRoute } from "wouter";
import { useEvent, useUpdateEvent } from "@/hooks/use-events";
import { useSeats, useUpdateSeats, useResetSeats } from "@/hooks/use-seats";
import { Sidebar } from "@/components/Sidebar";
import { SeatMap } from "@/components/SeatMap";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RotateCcw, Monitor, Settings2 } from "lucide-react";
import type { Seat, EventConfiguration, SeatStatus } from "@shared/schema";

export default function EventDetails() {
  const [, params] = useRoute("/events/:id");
  const id = parseInt(params?.id || "0");
  const { toast } = useToast();
  
  const { data: event, isLoading: isEventLoading } = useEvent(id);
  const { data: seats, isLoading: isSeatsLoading } = useSeats(id);
  
  const updateEvent = useUpdateEvent();
  const updateSeats = useUpdateSeats();
  const resetSeats = useResetSeats();

  const [configJson, setConfigJson] = useState("");
  const [activeTab, setActiveTab] = useState("visualizer");

  // Sync config json state when event loads
  if (event && !configJson && activeTab === "settings") {
    setConfigJson(JSON.stringify(event.configuration, null, 2));
  }

  const handleSeatClick = (seat: Seat) => {
    // Cycle: available -> reserved -> blocked -> available
    const nextStatus: Record<SeatStatus, SeatStatus> = {
      available: "reserved",
      reserved: "blocked",
      blocked: "available"
    };
    
    const newStatus = nextStatus[seat.status as SeatStatus] || "available";
    
    updateSeats.mutate({
      eventId: id,
      ids: [seat.id],
      status: newStatus
    });
  };

  const handleConfigSave = () => {
    try {
      const newConfig = JSON.parse(configJson);
      // Basic validation by structure could go here
      updateEvent.mutate({
        id,
        configuration: newConfig
      });
    } catch (e) {
      toast({
        title: "Invalid JSON",
        description: "Please check your configuration syntax.",
        variant: "destructive"
      });
    }
  };

  if (isEventLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!event) return <div>Event not found</div>;

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      <main className="md:pl-64 flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 md:px-8 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold font-display">{event.name}</h1>
            <p className="text-xs md:text-sm text-muted-foreground">{event.venue} • {event.date}</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Button 
                variant="outline" 
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => {
                   if(confirm("Reset all seat statuses to Available?")) resetSeats.mutate(id);
                }}
                disabled={resetSeats.isPending}
              >
               <RotateCcw className="mr-1 h-3 w-3" />
               Reset
             </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-muted/10 p-4 md:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="visualizer">
                <Monitor className="mr-2 h-4 w-4" /> Visualizer
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings2 className="mr-2 h-4 w-4" /> Configuration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visualizer" className="mt-0">
               <div className="bg-card rounded-xl border border-border shadow-sm min-h-[600px] flex flex-col">
                 <div className="p-4 border-b border-border flex gap-4 text-xs font-medium justify-center bg-muted/30 rounded-t-xl">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Available</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive" /> Reserved</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-muted-foreground/30" /> Blocked</div>
                 </div>
                 
                 <div className="flex-1 flex items-center justify-center p-8 bg-dot-pattern">
                   <SeatMap 
                     configuration={event.configuration} 
                     seats={seats || []} 
                     onSeatClick={handleSeatClick}
                     isLoading={isSeatsLoading}
                   />
                 </div>
               </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold">Layout Configuration</h3>
                        <p className="text-xs text-muted-foreground mt-1">Directly edit the JSON structure to define zones, sections, rows, and multiple aisles.</p>
                      </div>
                      <Button onClick={handleConfigSave} disabled={updateEvent.isPending}>
                        {updateEvent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Configuration
                      </Button>
                    </div>
                    <Textarea 
                      className="font-mono text-sm min-h-[500px] bg-muted/30"
                      value={configJson}
                      onChange={(e) => setConfigJson(e.target.value)}
                      placeholder="Paste your layout configuration JSON here..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                     <h4 className="font-bold text-primary mb-2">Configuration Guide</h4>
                     <p className="text-sm text-muted-foreground mb-4">
                       Define your layout using the JSON format. You can now add multiple aisles per row.
                     </p>
                     <div className="space-y-4">
                       <div>
                         <span className="text-xs font-bold uppercase text-primary/70">Aisles Example</span>
                         <pre className="text-[10px] bg-card p-3 rounded border border-border mt-1">
{`"rows": [
  { 
    "label": "A", 
    "seatCount": 20,
    "aisles": [5, 15] 
  }
]`}
                         </pre>
                         <p className="text-[10px] text-muted-foreground mt-1 italic">* This places aisles after seat 5 and seat 15.</p>
                       </div>
                       
                       <div className="pt-2 border-t border-primary/10">
                         <h5 className="text-xs font-bold mb-1">Visual UI Alternative</h5>
                         <p className="text-[10px] text-muted-foreground">
                           While a full drag-and-drop builder is coming soon, you can quickly build layouts using this JSON editor which allows for precision control over every seat and aisle position.
                         </p>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
