
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
  BarChart, 
  Kanban,
  Settings,
  LogOut,
  Users,
  Palette
} from "lucide-react";

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <SidebarComponent collapsible="icon">
      <SidebarHeader className="flex items-center justify-between px-4 py-2">
        <div className={`flex items-center space-x-2 ${state.collapsed ? 'hidden' : ''}`}>
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
        <SidebarTrigger className={state.collapsed ? '' : 'ml-auto'} />
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-2">
        {!state.collapsed && (
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
        
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard" className={isActive("/app") && !isActive("/app/kanban") ? "bg-accent" : ""}>
                <Link to="/app">
                  <BarChart size={18} />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Kanban de Leads" className={isActive("/app/kanban") ? "bg-accent" : ""}>
                <Link to="/app/kanban">
                  <Kanban size={18} />
                  <span>Kanban de Leads</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Configurações" className={isActive("/app/settings") ? "bg-accent" : ""}>
                <Link to="/app/settings">
                  <Settings size={18} />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Equipe" className={isActive("/app/team") ? "bg-accent" : ""}>
                <Link to="/app/team">
                  <Users size={18} />
                  <span>Equipe</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        {isAdmin && !state.collapsed && (
          <SidebarGroup className="mt-6">
            <span className="text-xs font-medium text-muted-foreground px-4 mb-2">Administração</span>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Usuários">
                  <Link to="/app/users">
                    <Users size={18} />
                    <span>Usuários</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      
      <SidebarFooter className="p-3">
        <Button 
          variant="outline" 
          className={`${state.collapsed ? 'justify-center p-2' : 'w-full justify-start'}`}
          onClick={logout}
        >
          <LogOut size={18} className={state.collapsed ? '' : 'mr-2'} />
          {!state.collapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </SidebarComponent>
  );
};

export default Sidebar;
