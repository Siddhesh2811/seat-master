import { Link, useLocation } from "wouter";
import { Calendar, LayoutGrid, PlusCircle, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/events", icon: Calendar, label: "Events" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-sm z-50 flex flex-col">
      <div className="p-6 border-b border-border/50">
        <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          SeatMaster
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Admin Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                location.startsWith(item.href)
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              A
            </div>
            <div>
              <p className="text-sm font-medium">Administrator</p>
              <p className="text-xs text-muted-foreground">admin@seatmaster.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
