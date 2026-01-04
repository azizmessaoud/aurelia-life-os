import { 
  LayoutDashboard, 
  FolderKanban, 
  Timer, 
  TrendingUp, 
  Search, 
  MessageSquare,
  Sparkles,
  Network,
  Users,
  Compass,
  Target
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Compass, label: "Life GPS", path: "/gps" },
  { icon: Target, label: "Goals", path: "/goals" },
  { icon: FolderKanban, label: "Projects", path: "/projects" },
  { icon: Timer, label: "Deep Work", path: "/deep-work" },
  { icon: TrendingUp, label: "Capacity", path: "/capacity" },
  { icon: Search, label: "Opportunities", path: "/opportunities" },
  { icon: Network, label: "Knowledge Graph", path: "/knowledge" },
  { icon: Users, label: "Agent Council", path: "/council" },
  { icon: MessageSquare, label: "Chat with AURELIA", path: "/chat" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold gradient-text">AURELIA</h1>
            <p className="text-[10px] text-muted-foreground tracking-wide uppercase">Personal AI OS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "animate-pulse-soft")} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">v1.0</span>
              <span className="mx-1">•</span>
              <span>Single User</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
