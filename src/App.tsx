
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { EvolutionProvider } from '@/contexts/EvolutionContext';
import AppLayout from '@/layouts/AppLayout';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Conversations from '@/pages/Conversations';
import Kanban from '@/pages/Kanban';
import Agenda from '@/pages/Agenda';
import Settings from '@/pages/Settings';
import Preferences from '@/pages/Preferences';
import Team from '@/pages/Team';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EvolutionProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="conversas" element={<Conversations />} />
                <Route path="kanban" element={<Kanban />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="configuracoes" element={<Settings />} />
                <Route path="preferencias" element={<Preferences />} />
                <Route path="equipe" element={<Team />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </EvolutionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
