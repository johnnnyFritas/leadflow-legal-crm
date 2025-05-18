
import { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const AppLayout = () => {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Update title
    document.title = "CRM Jurídico";
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Menu para desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Versão mobile com Sheet menu */}
        <div className="md:hidden fixed top-0 left-0 z-50 w-full bg-background border-b p-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m8 12 2 2 6-6"></path>
                </svg>
              </div>
              <span className="text-sm font-medium">Quero Direito</span>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[75vw] max-w-[280px]">
                <div className="h-full">
                  <Sidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto md:overflow-y-auto md:pt-8 pt-16">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
