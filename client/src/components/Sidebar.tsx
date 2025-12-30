import { Link, useLocation } from "wouter";
import { Calendar, LayoutGrid, PlusCircle, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

import { useUser } from "@/hooks/use-user";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useUser();

  const navItems = [
    { href: "/events", icon: Calendar, label: "Events" },
    { href: "/users", icon: Settings, label: "Users", adminOnly: true },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-sm z-50 flex flex-col transition-transform duration-300 -translate-x-full md:translate-x-0">
      <div className="p-6 border-b border-border/50">
        <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          SeatMaster
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Admin Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems
          .filter(item => !item.adminOnly || user?.role === "admin")
          .map((item) => (
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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
