
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, BarChartHorizontal } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

const areasDireito = [
  { value: 'all', label: 'Todas as áreas' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'civil', label: 'Civil' },
  { value: 'tributario', label: 'Tributário' },
  { value: 'penal', label: 'Penal' },
  { value: 'empresarial', label: 'Empresarial' }
];

const fases = [
  'Em análise',
  'Notificação recebida',
  'Envio para reunião',
  'Reunião marcada',
  'Não compareceu',
  'Reunião feita (sem contrato)',
  'Reunião feita (com contrato)',
  'Descartado'
];

// Sample data for charts
const leadsPorFase = [
  { name: 'Em análise', value: 42 },
  { name: 'Notificação recebida', value: 35 },
  { name: 'Envio para reunião', value: 27 },
  { name: 'Reunião marcada', value: 16 },
  { name: 'Não compareceu', value: 8 },
  { name: 'Reunião feita (sem contrato)', value: 12 },
  { name: 'Reunião feita (com contrato)', value: 23 },
  { name: 'Descartado', value: 18 }
];

const leadsPorArea = [
  { name: 'Trabalhista', value: 65 },
  { name: 'Previdenciário', value: 42 },
  { name: 'Civil', value: 37 },
  { name: 'Tributário', value: 28 },
  { name: 'Penal', value: 19 },
  { name: 'Empresarial', value: 12 }
];

const leadsPorDia = [
  { name: '10/05', value: 23 },
  { name: '11/05', value: 18 },
  { name: '12/05', value: 25 },
  { name: '13/05', value: 31 },
  { name: '14/05', value: 27 },
  { name: '15/05', value: 29 },
  { name: '16/05', value: 34 },
  { name: '17/05', value: 42 }
];

const Dashboard = () => {
  const [period, setPeriod] = useState('30');
  const [area, setArea] = useState('all');
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Calculate total leads
  const totalLeads = leadsPorFase.reduce((acc, curr) => acc + curr.value, 0);
  
  // Calculate conversion rate
  const leadsContratados = leadsPorFase.find(fase => fase.name === 'Reunião feita (com contrato)')?.value || 0;
  const conversionRate = ((leadsContratados / totalLeads) * 100).toFixed(1);
  
  const formattedDate = date ? format(date, 'dd/MM/yyyy', { locale: pt }) : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="custom">Período personalizado</SelectItem>
            </SelectContent>
          </Select>
          
          {period === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formattedDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
          
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione a área" />
            </SelectTrigger>
            <SelectContent>
              {areasDireito.map((area) => (
                <SelectItem key={area.value} value={area.value}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="m16 6 6 6-6 6"></path>
              <path d="M8 6 2 12l6 6"></path>
              <path d="M12 2v20"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +5.2% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads em Reunião</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leadsPorFase.find(fase => fase.name === 'Reunião marcada')?.value || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contratos Fechados</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsContratados}</div>
            <p className="text-xs text-muted-foreground">
              +18% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="leads-por-fase" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads-por-fase">Leads por Fase</TabsTrigger>
          <TabsTrigger value="leads-por-area">Leads por Área</TabsTrigger>
          <TabsTrigger value="leads-por-dia">Leads por Dia</TabsTrigger>
        </TabsList>
        <TabsContent value="leads-por-fase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Leads por Fase</CardTitle>
              <CardDescription>
                Quantidade de leads em cada fase do pipeline no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <BarChartHorizontal 
                data={leadsPorFase} 
                xAxisKey="value" 
                yAxisKey="name" 
                colors={["hsl(var(--primary))"]} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="leads-por-area" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leads por Área do Direito</CardTitle>
              <CardDescription>
                Distribuição dos leads por área de especialização jurídica
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <BarChart 
                data={leadsPorArea} 
                xAxisKey="name" 
                yAxisKey="value" 
                colors={["hsl(var(--primary))"]} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="leads-por-dia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leads por Dia</CardTitle>
              <CardDescription>
                Evolução diária de novos leads no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <BarChart 
                data={leadsPorDia} 
                xAxisKey="name" 
                yAxisKey="value" 
                colors={["hsl(var(--primary))"]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
