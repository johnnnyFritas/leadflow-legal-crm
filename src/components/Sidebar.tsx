
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
  LogOut
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const SidebarContentItems = () => (
    <>
      {/* Header com logo e título do sistema */}
      <SidebarHeader className="flex flex-col items-center space-y-3 p-4 border-b border-border/20 relative">
        <div className="flex items-center justify-between w-full">
          {state !== "collapsed" ? (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img 
                  src="https://res.cloudinary.com/dntp7nxsr/image/upload/v1749662979/Black_logo_-_no_background_xmyamn.png" 
                  alt="Logo" 
                  className="h-8 w-auto dark:hidden"
                />
                <img 
                  src="https://res.cloudinary.com/dntp7nxsr/image/upload/v1749663013/Color_logo_-_no_background_1_awsld6.png" 
                  alt="Logo" 
                  className="h-8 w-auto hidden dark:block"
                />
              </div>
            </div>
          ) : (
            <div className="mx-auto flex-shrink-0">
              <img 
                src="https://res.cloudinary.com/dntp7nxsr/image/upload/v1749662979/Black_logo_-_no_background_xmyamn.png" 
                alt="Logo" 
                className="h-6 w-auto dark:hidden"
              />
              <img 
                src="https://res.cloudinary.com/dntp7nxsr/image/upload/v1749663013/Color_logo_-_no_background_1_awsld6.png" 
                alt="Logo" 
                className="h-6 w-auto hidden dark:block"
              />
            </div>
          )}
          
          {/* Botão de abrir/fechar */}
          <div className={`${state === "collapsed" ? "absolute right-2 top-2" : ""}`}>
            <SidebarTrigger className="hover:bg-accent/80 hover:text-accent-foreground hover:shadow-md transition-all" />
          </div>
        </div>

        {/* Seção de perfil do usuário */}
        <div className={`flex ${state === "collapsed" ? "flex-col" : "items-center"} gap-3 w-full pt-3 border-t border-border/20`}>
          <Avatar className={`${state === "collapsed" ? "mx-auto" : ""} h-10 w-10 flex-shrink-0`}>
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          {state !== "collapsed" && (
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      {/* Itens do menu */}
      <SidebarContent className="px-3 py-4">
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
                  {state !== "collapsed" && <span>Leads</span>}
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
                  {state !== "collapsed" && <span>Conversas</span>}
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
                  {state !== "collapsed" && <span>Agenda</span>}
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
                  {state !== "collapsed" && <span>Configurações</span>}
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
    <SidebarComponent collapsible="icon" className="h-full overflow-hidden w-16 data-[state=expanded]:w-64">
      <SidebarContentItems />
      <SidebarRail />
    </SidebarComponent>
  );
};

export default Sidebar;
