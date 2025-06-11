
import { Link, useLocation } from "react-router-dom";
import { 
  Kanban,
  MessageSquare,
  Calendar,
  Settings
} from "lucide-react";

const MobileBottomNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navItems = [
    {
      path: "/app/kanban",
      icon: Kanban,
      label: "Leads"
    },
    {
      path: "/app/conversas", 
      icon: MessageSquare,
      label: "Conversas"
    },
    {
      path: "/app/agenda",
      icon: Calendar,
      label: "Agenda"  
    },
    {
      path: "/app/settings",
      icon: Settings,
      label: "Config"
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/20 px-2 py-1">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
                active 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
