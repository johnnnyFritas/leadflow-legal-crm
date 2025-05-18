
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarTrigger,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import Lucide icons
import { 
  Kanban,
  Settings,
  LogOut,
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <SidebarComponent collapsible="icon">
      <SidebarHeader className="flex items-center justify-between px-4 py-2">
        {state !== "collapsed" ? (
          <div className="flex items-center space-x-2">
            <div className="rounded-md bg-primary p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <path d="m8 12 2 2 6-6"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">CRM Quero Direito</span>
              <span className="text-xs text-muted-foreground">Versão 1.0</span>
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-primary p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="m8 12 2 2 6-6"></path>
            </svg>
          </div>
        )}
        <SidebarTrigger />
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-2">
        {state !== "collapsed" && (
          <div className="mb-4 flex items-center gap-3 px-4 py-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        )}
        
        {state === "collapsed" && (
          <div className="mb-4 flex justify-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        )}
        
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Kanban de Leads" className={isActive("/app/kanban") ? "bg-accent" : ""}>
                <Link to="/app/kanban" className="w-full">
                  <Kanban size={18} />
                  <span>Kanban de Leads</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Configurações" className={isActive("/app/settings") ? "bg-accent" : ""}>
                <Link to="/app/settings" className="w-full">
                  <Settings size={18} />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-3 mt-auto">
        <Button 
          variant="outline" 
          className={`${state === "collapsed" ? 'justify-center p-2' : 'w-full justify-start'}`}
          onClick={logout}
        >
          <LogOut size={18} className={state === "collapsed" ? '' : 'mr-2'} />
          {state !== "collapsed" && <span>Sair</span>}
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </SidebarComponent>
  );
};

export default Sidebar;
