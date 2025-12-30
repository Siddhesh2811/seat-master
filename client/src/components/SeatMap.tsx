import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Seat, EventConfiguration } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SeatMapProps {
  configuration: EventConfiguration;
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
  isLoading?: boolean;
}

export function SeatMap({ configuration, seats, onSeatClick, isLoading }: SeatMapProps) {
  // Helper to find seat status efficiently
  const getSeat = (zone: string, section: string, row: string, seatNum: number) => {
    // ID format: EVENTID-ZONE-SECTION-ROW-SEATNUM
    // Since we don't know the EventID easily here without prop drilling or parsing,
    // we can search by the label components which is safer.
    return seats.find(
      (s) =>
        s.label.zone === zone &&
        s.label.section === section &&
        s.label.row === row &&
        s.label.seat === seatNum.toString()
    );
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "reserved":
        return "bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/90";
      case "blocked":
        return "bg-muted-foreground/30 border-transparent text-muted-foreground hover:bg-muted-foreground/40";
      default: // available
        return "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-400";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center animate-pulse bg-muted/20 rounded-xl">
        <p className="text-muted-foreground">Loading seat map...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-12">
      <div className="flex flex-col items-center gap-12 p-8">
        
        {/* Stage Area */}
        <div className="w-3/4 h-16 bg-gradient-to-b from-primary/20 to-transparent rounded-t-[50%] border-t-4 border-primary/30 flex items-center justify-center mb-8">
          <span className="text-primary font-bold tracking-[0.5em] text-sm uppercase">Stage</span>
        </div>

        {configuration.zones.map((zone) => (
          <div key={zone.name} className="w-full flex flex-col items-center gap-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 px-8">
              {zone.name}
            </h3>
            
            <div className="flex gap-12 justify-center">
              {zone.sections.map((section) => (
                <div key={section.name} className="flex flex-col gap-2">
                  <div className="text-xs text-center text-muted-foreground mb-2">{section.name}</div>
                  
                  {section.rows.map((row) => {
                    const aislePositions = row.aisles || [];
                    const rowSeats = Array.from({ length: row.seatCount }).map((_, i) => i + 1);
                    
                    // Group seats into chunks based on aisles
                    const seatGroups: number[][] = [];
                    let currentGroup: number[] = [];
                    rowSeats.forEach((seatNum, idx) => {
                      currentGroup.push(seatNum);
                      if (aislePositions.includes(idx + 1) && idx < rowSeats.length - 1) {
                        seatGroups.push(currentGroup);
                        currentGroup = [];
                      }
                    });
                    if (currentGroup.length > 0) seatGroups.push(currentGroup);

                    return (
                      <div key={row.label} className="flex items-center justify-center gap-3 w-full">
                        <span className="w-6 text-xs font-mono text-muted-foreground text-right">{row.label}</span>
                        
                        <div className="flex items-center justify-center gap-6 flex-1">
                          {seatGroups.map((group, groupIdx) => {
                            let alignmentClass = "justify-center";
                            if (seatGroups.length > 1) {
                              if (groupIdx === 0) alignmentClass = "justify-end";
                              else if (groupIdx === seatGroups.length - 1) alignmentClass = "justify-start";
                              else alignmentClass = "justify-center";
                            }

                            return (
                              <div key={groupIdx} className={cn("flex gap-1.5 flex-1", alignmentClass)}>
                                {group.map((seatNum) => {
                                  const seatData = getSeat(zone.name, section.name, row.label, seatNum);
                                  const status = seatData?.status || "available";
                                  
                                  const seatObj: Seat = seatData || {
                                    id: `temp-${zone.name}-${section.name}-${row.label}-${seatNum}`,
                                    eventId: 0,
                                    status: "available",
                                    label: { zone: zone.name, section: section.name, row: row.label, seat: seatNum.toString() }
                                  };

                                  return (
                                    <Tooltip key={seatNum}>
                                      <TooltipTrigger asChild>
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => onSeatClick(seatObj)}
                                          className={cn(
                                            "w-8 h-8 rounded-t-lg rounded-b-sm text-[10px] font-bold shadow-sm transition-colors border-b-2 flex items-center justify-center",
                                            getStatusColor(status)
                                          )}
                                        >
                                          {seatNum}
                                        </motion.button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{zone.name} • {section.name}</p>
                                        <p>Row {row.label} • Seat {seatNum}</p>
                                        <p className="capitalize font-bold mt-1 text-xs">{status}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                        
                        <span className="w-6 text-xs font-mono text-muted-foreground text-left">{row.label}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
