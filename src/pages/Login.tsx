
import { useState, FormEvent, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth();

  useEffect(() => {
    document.title = "CRM Jurídico - Entrar";
  }, []);

  // If already logged in, redirect to app
  if (user) {
    return <Navigate to="/app" />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(email, password);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 bg-card p-6 rounded-lg shadow-lg animate-scale-in">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-md bg-primary p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="m8 12 2 2 6-6"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Entrar no CRM Jurídico</h1>
          <p className="text-sm text-muted-foreground">
            Entre com seu e-mail e senha para acessar o sistema
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="seuemail@exemplo.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link to="#" className="text-xs text-primary hover:underline">
                Esqueceu sua senha?
              </Link>
            </div>
            <Input
              id="password"
              placeholder="Sua senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 border-2 border-t-transparent border-white border-solid rounded-full animate-spin mr-2"></span>
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>

          {/* Demo credentials */}
          <div className="text-center text-xs text-muted-foreground mt-4">
            <p>Credenciais para demonstração:</p>
            <p>Email: admin@exemplo.com</p>
            <p>Senha: senha123</p>
          </div>
        </form>
        <div className="text-center text-sm">
          Não tem uma conta?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Registre-se
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
