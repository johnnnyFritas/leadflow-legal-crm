
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "@/components/Sidebar";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const AppLayout = () => {
  const { user, isLoading } = useAuthGuard();

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
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
