
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useIsMobile } from "@/hooks/use-mobile";

const AppLayout = () => {
  const { user, isLoading } = useAuthGuard();
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Verificar se estamos na página de conversas e se há uma conversa selecionada
  const isConversationsPage = location.pathname === '/app/conversas';
  const hasSelectedConversation = isMobile && isConversationsPage && 
    new URLSearchParams(location.search).has('conversation');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null; // useAuthGuard irá redirecionar para login
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Ocultar sidebar em mobile apenas quando há conversa selecionada */}
        {!(isMobile && hasSelectedConversation) && <Sidebar />}
        
        <main className={`flex-1 overflow-auto ${
          isMobile && hasSelectedConversation 
            ? 'p-0' 
            : 'p-3 md:p-6 pb-20 md:pb-6'
        }`}>
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </SidebarProvider>
  );
};

export default AppLayout;
