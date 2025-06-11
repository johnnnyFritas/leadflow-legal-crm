
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Eye, EyeOff, Mail, Key, Moon, Sun } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      navigate('/app');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-100 to-white dark:from-slate-900 dark:via-blue-950 dark:to-slate-800" />
      
      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-lg"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-gray-700" />
          ) : (
            <Sun className="h-5 w-5 text-yellow-500" />
          )}
        </button>
      </div>

      <Card className="w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-2xl">
        <CardHeader className="space-y-4 pb-6">
          {/* Logo */}
          <div className="flex items-center justify-center mb-2">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 p-4 shadow-lg border border-gray-200 dark:border-gray-700">
              <img 
                src={theme === 'dark' 
                  ? "https://res.cloudinary.com/dntp7nxsr/image/upload/v1749665492/Color_logo_-_no_background_1_jxqzjb.png"
                  : "https://res.cloudinary.com/dntp7nxsr/image/upload/v1749664970/44b1780d-4ab0-435b-9b07-1c767fa5b426_a4e8fd.png"
                }
                alt="CRM Quero Direito Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              CRM Quero Direito
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Faça login com suas credenciais da empresa
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-200 font-medium">
                Email da Empresa
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="empresa@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary dark:focus:border-primary"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-200 font-medium">
                Senha
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary dark:focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Não tem acesso? Entre em contato com o administrador
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
