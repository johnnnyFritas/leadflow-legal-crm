
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    document.title = "Página não encontrada | CRM Jurídico";
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl mb-6">Página não encontrada</p>
        <p className="text-muted-foreground max-w-md mb-8">
          A página que você está procurando não existe ou foi removida.
        </p>
        <Link to="/">
          <Button>Voltar para a página inicial</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
