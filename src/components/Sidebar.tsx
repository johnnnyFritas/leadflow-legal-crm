
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
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Renomeando para SidebarContentItems para evitar conflito com o componente importado
  const SidebarContentItems = () => (
    <>
      {/* Header com logo e título do sistema */}
      <SidebarHeader className="flex flex-col items-center space-y-2 p-4 border-b border-border/20 relative">
        <div className="flex items-center justify-between w-full">
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
            <div className="rounded-md bg-primary p-1 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <path d="m8 12 2 2 6-6"></path>
              </svg>
            </div>
          )}
          
          {/* Botão de abrir/fechar movido para o canto direito superior */}
          <div className="absolute right-2 top-4">
            <SidebarTrigger className="hover:bg-accent/80 hover:text-accent-foreground hover:shadow-md transition-all" />
          </div>
        </div>

        {/* Seção de perfil do usuário */}
        <div className={`flex ${state === "collapsed" ? "flex-col" : "items-center"} gap-3 w-full mt-2 py-3 border-t border-border/20`}>
          <Avatar className={`${state === "collapsed" ? "mx-auto" : ""} h-10 w-10`}>
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          {state !== "collapsed" && (
            <div className="flex-1 overflow-hidden">
              <p className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      {/* Itens do menu */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip="Kanban de Leads" 
                className={`transition-all ${isActive("/app/kanban") ? "bg-accent text-accent-foreground" : "hover:bg-accent/80 hover:text-accent-foreground"} hover:shadow-md`}
              >
                <Link to="/app/kanban" className="w-full">
                  <Kanban size={18} />
                  <span>Leads</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip="Conversas" 
                className={`transition-all ${isActive("/app/conversas") ? "bg-accent text-accent-foreground" : "hover:bg-accent/80 hover:text-accent-foreground"} hover:shadow-md`}
              >
                <Link to="/app/conversas" className="w-full">
                  <MessageSquare size={18} />
                  <span>Conversas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip="Agenda" 
                className={`transition-all ${isActive("/app/agenda") ? "bg-accent text-accent-foreground" : "hover:bg-accent/80 hover:text-accent-foreground"} hover:shadow-md`}
              >
                <Link to="/app/agenda" className="w-full">
                  <Calendar size={18} />
                  <span>Agenda</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip="Configurações" 
                className={`transition-all ${isActive("/app/settings") ? "bg-accent text-accent-foreground" : "hover:bg-accent/80 hover:text-accent-foreground"} hover:shadow-md`}
              >
                <Link to="/app/settings" className="w-full">
                  <Settings size={18} />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Botão de logout no footer */}
      <SidebarFooter className="p-3 mt-auto border-t border-border/20">
        <Button 
          variant="outline" 
          className={`${state === "collapsed" ? 'justify-center p-2' : 'w-full justify-start'} transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 hover:shadow-sm`}
          onClick={logout}
        >
          <LogOut size={18} className={state === "collapsed" ? '' : 'mr-2'} />
          {state !== "collapsed" && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </>
  );

  return (
    <SidebarComponent collapsible="icon" className="h-full overflow-hidden">
      <SidebarContentItems />
      <SidebarRail />
    </SidebarComponent>
  );
};

export default Sidebar;
