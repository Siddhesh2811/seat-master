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
    const found = seats.find(
      (s) =>
        s.label.zone === zone &&
        s.label.section === section &&
        s.label.row === row &&
        s.label.seat === seatNum.toString()
    );
    // Debug specific failure
    if (!found && seats.length > 0 && seatNum === 1 && row === "A") {
      console.log(`Failed to find seat: ${zone}-${section}-${row}-${seatNum}`);
    }
    return found;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "reserved":
        return "bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/90";
      case "blocked":
        return "bg-muted-foreground/30 border-transparent text-muted-foreground hover:bg-muted-foreground/40";
      case "pending":
        return "bg-amber-400 border-amber-500 text-black hover:bg-amber-300";
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

  console.log(`SeatMap rendering: ${seats.length} seats loaded.`);
  if (seats.length > 0) {
    console.log("Sample seat from DB:", seats[0]);
    console.log("Sample seat label:", seats[0].label);
  }
  if (configuration.zones.length > 0) {
    console.log("Configuration Sample:", configuration.zones[0].sections[0]);
  }

  return (
    <div className="w-full h-full overflow-auto pb-12 scrollbar-hide">
      <div className="inline-flex min-w-full flex-col items-center gap-6 md:gap-12 p-4 md:p-8 origin-top scale-[0.6] sm:scale-[0.7] md:scale-90 lg:scale-100">

        {/* Stage Area */}
        <div className="w-full max-w-[600px] h-12 md:h-16 bg-gradient-to-b from-primary/20 to-transparent rounded-t-[50%] border-t-4 border-primary/30 flex items-center justify-center mb-4 md:mb-8">
          <span className="text-primary font-bold tracking-[0.3em] md:tracking-[0.5em] text-xs md:text-sm uppercase">Stage</span>
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
                                          onClick={() => !seatObj.id.startsWith("temp") && onSeatClick(seatObj)}
                                          disabled={seatObj.id.startsWith("temp")}
                                          className={cn(
                                            "w-8 h-8 rounded-t-lg rounded-b-sm text-[10px] font-bold shadow-sm transition-colors border-b-2 flex items-center justify-center",
                                            getStatusColor(status),
                                            seatObj.id.startsWith("temp") && "opacity-50 cursor-not-allowed bg-gray-300 border-gray-400 text-gray-500"
                                          )}
                                        >
                                          {seatNum}
                                        </motion.button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{zone.name} • {section.name}</p>
                                        <p>Row {row.label} • Seat {seatNum}</p>
                                        <p className="capitalize font-bold mt-1 text-xs">{status}</p>
                                        {seatObj.id.startsWith("temp") && <p className="text-xs text-destructive mt-1">Not synced to DB</p>}
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
