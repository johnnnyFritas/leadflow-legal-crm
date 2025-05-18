
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, BarChartHorizontal } from '@/components/ui/bar-chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
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

// Sample data for charts
const leadsPorFase = [
  { name: 'Notificação recebida', value: 42, percent: '22%' },
  { name: 'Em análise', value: 35, percent: '18%' },
  { name: 'Envio para reunião', value: 27, percent: '14%' },
  { name: 'Reunião marcada', value: 16, percent: '8%' },
  { name: 'Não compareceu', value: 8, percent: '4%' },
  { name: 'Reunião feita (sem contrato)', value: 12, percent: '6%' },
  { name: 'Reunião feita (com contrato)', value: 23, percent: '12%' },
  { name: 'Descartado', value: 18, percent: '9%' }
];

const leadsPorArea = [
  { name: 'Trabalhista', value: 65, percent: '32%' },
  { name: 'Previdenciário', value: 42, percent: '21%' },
  { name: 'Civil', value: 37, percent: '18%' },
  { name: 'Tributário', value: 28, percent: '14%' },
  { name: 'Penal', value: 19, percent: '9%' },
  { name: 'Empresarial', value: 12, percent: '6%' }
];

const leadsPorDia = [
  { name: '10/05', value: 23, percent: '13%' },
  { name: '11/05', value: 18, percent: '10%' },
  { name: '12/05', value: 25, percent: '14%' },
  { name: '13/05', value: 31, percent: '17%' },
  { name: '14/05', value: 27, percent: '15%' },
  { name: '15/05', value: 29, percent: '16%' },
  { name: '16/05', value: 34, percent: '19%' },
  { name: '17/05', value: 42, percent: '23%' }
];

const Dashboard = () => {
  const [period, setPeriod] = useState('30');
  const [area, setArea] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  
  // Calculate total leads
  const totalLeads = leadsPorFase.reduce((acc, curr) => acc + curr.value, 0);
  
  // Calculate conversion rate
  const leadsContratados = leadsPorFase.find(fase => fase.name === 'Reunião feita (com contrato)')?.value || 0;
  const conversionRate = ((leadsContratados / totalLeads) * 100).toFixed(1);
  
  const formattedDateFrom = dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: ptBR }) : '';
  const formattedDateTo = dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: ptBR }) : '';

  // Set today or yesterday
  const setToday = () => {
    setDateFrom(new Date());
    setDateTo(new Date());
    setPeriod('today');
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setDateFrom(yesterday);
    setDateTo(yesterday);
    setPeriod('yesterday');
  };

  useEffect(() => {
    if (period === 'today') {
      setToday();
    } else if (period === 'yesterday') {
      setYesterday();
    } else if (period === '7') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      setDateFrom(sevenDaysAgo);
      setDateTo(new Date());
    } else if (period === '14') {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      setDateFrom(fourteenDaysAgo);
      setDateTo(new Date());
    } else if (period === '21') {
      const twentyOneDaysAgo = new Date();
      twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);
      setDateFrom(twentyOneDaysAgo);
      setDateTo(new Date());
    } else if (period === '30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      setDateFrom(thirtyDaysAgo);
      setDateTo(new Date());
    }
  }, [period]);

  // Custom tooltip formatter for charts
  const tooltipFormatter = (value: number, name: string, props: any) => {
    const item = props.payload;
    return [`${value} (${item.percent})`, name];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        
        <div className="flex flex-wrap gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="21">Últimos 21 dias</SelectItem>
              <SelectItem value="30">Último mês</SelectItem>
              <SelectItem value="custom">Período personalizado</SelectItem>
            </SelectContent>
          </Select>
          
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
          
          {period === 'custom' && (
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[150px] justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formattedDateFrom || "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[150px] justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formattedDateTo || "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
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
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribuição de Leads por Fase</CardTitle>
            <CardDescription>
              Quantidade de leads em cada fase do pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <BarChartHorizontal 
              data={leadsPorFase} 
              xAxisKey="value" 
              yAxisKey="name" 
              colors={["hsl(var(--primary))"]}
              tooltipProps={{
                formatter: tooltipFormatter
              }}
              chartProps={{
                layout: "vertical",
                margin: { top: 5, right: 30, left: 120, bottom: 5 }
              }}
            />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Leads por Área do Direito</CardTitle>
            <CardDescription>
              Distribuição dos leads por especialização jurídica
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <BarChart 
              data={leadsPorArea} 
              xAxisKey="name" 
              yAxisKey="value" 
              colors={["hsl(var(--primary))"]}
              tooltipProps={{
                formatter: tooltipFormatter
              }}
              chartProps={{
                margin: { top: 20, right: 30, left: 20, bottom: 70 }
              }}
            />
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Leads por Dia</CardTitle>
            <CardDescription>
              Evolução diária de novos leads no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <BarChart 
              data={leadsPorDia} 
              xAxisKey="name" 
              yAxisKey="value" 
              colors={["hsl(var(--primary))"]}
              tooltipProps={{
                formatter: tooltipFormatter
              }}
              chartProps={{
                margin: { top: 20, right: 30, left: 30, bottom: 20 }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
