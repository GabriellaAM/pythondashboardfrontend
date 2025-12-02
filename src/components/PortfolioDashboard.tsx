import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { DateRangePicker } from './ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

// Importar novos componentes Plotly
import {
  CarteirasChart,
  AtivosChart,
  CarteiraVsAtivosChart,
  DecomposicaoChart,
  DiasPositivosNegativosChart,
  AlocacoesChart,
  CorrelationMatrixChart,
  OpenPositionsTable
} from './charts';
import { apiClient } from '../lib/api';

interface PortfolioData {
  data: any[];
  columns: string[];
  index: string[];
}

interface DashboardData {
  performance: {
    carteiras: PortfolioData;
    decomposicao: PortfolioData;
    carteira_vs_ativos?: PortfolioData;
    alocacoes?: PortfolioData;
  };
  ativos: PortfolioData;
  risco: {
    heatmap: any;
  };
  posicoes: {
    abertas: PositionData;
    fechadas: PositionData;
    dias_positivos_negativos: any;
    timeline?: PositionData;
  };
  metadata: {
    carteira: string;
    inicio: string;
    fim: string;
    brl: boolean;
    processado_em: number;
  };
}

interface PositionData {
  data: any[];
  columns: string[];
}

const PortfolioDashboard: React.FC = () => {
  const [selectedCarteira, setSelectedCarteira] = useState('EXC');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [brlMode, setBrlMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const lastLoadedRangeKeyRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'ativos' | 'posicoes' | 'alocacoes' | 'correlacao'>('performance');

  // Estados para os dados
  const [carteirasData, setCarteirasData] = useState<PortfolioData | null>(null);
  const [ativosData, setAtivosData] = useState<PortfolioData | null>(null);
  const [decomposicaoData, setDecomposicaoData] = useState<PortfolioData | null>(null);
  const [carteiraVsAtivosData, setCarteiraVsAtivosData] = useState<PortfolioData | null>(null);
  const [alocacoesData, setAlocacoesData] = useState<PortfolioData | null>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [posicoesAbertas, setPosicoesAbertas] = useState<PositionData | null>(null);
  const [posicoesFechadas, setPosicoesFechadas] = useState<PositionData | null>(null);
  const [diasPositivosNegativos, setDiasPositivosNegativos] = useState<any>(null);
  const [posicoesTimelineData, setPosicoesTimelineData] = useState<PositionData | null>(null);

  const carteiras = ['EXC', 'HB', 'LC', 'AC'];

  const getDateRangeFormatted = () => {
    if (!dateRange?.from || !dateRange?.to) {
      // Valores padrão se não houver datas selecionadas
      const hoje = new Date();
      const inicio = subDays(hoje, 30);
      return {
        inicio: format(inicio, 'yyyy-MM-dd'),
        fim: format(hoje, 'yyyy-MM-dd')
      };
    }
    
    return {
      inicio: format(dateRange.from, 'yyyy-MM-dd'),
      fim: format(dateRange.to, 'yyyy-MM-dd')
    };
  };

  const fetchData = async () => {
    // Verificar se há um período selecionado
    if (!dateRange?.from || !dateRange?.to) {
      setError('Por favor, selecione um período para visualizar os dados');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { inicio, fim } = getDateRangeFormatted();
      const currentRangeKey = `${inicio}|${fim}|${selectedCarteira}|${brlMode ? 'BRL' : 'USD'}`;
      // Evita chamadas duplicadas para o mesmo intervalo/carteira/moeda
      if (lastLoadedRangeKeyRef.current === currentRangeKey) {
        setLoading(false);
        return;
      }
      
      // 🚀 NOVO: Usar endpoint otimizado de dashboard completo
      console.log('🚀 [FRONTEND] Iniciando carregamento otimizado do dashboard...');
      const startTime = Date.now();
      
      const dashboardData: DashboardData = await apiClient.getPortfolioDashboardCompleto(inicio, fim, selectedCarteira, brlMode);
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ [FRONTEND] Dashboard carregado em ${loadTime}ms`);
      console.log(`📊 [FRONTEND] Tempo de processamento backend: ${dashboardData.metadata.processado_em.toFixed(2)}s`);

      // Mapear dados do response otimizado
      setCarteirasData(dashboardData.performance.carteiras);
      setDecomposicaoData(dashboardData.performance.decomposicao);
      setCarteiraVsAtivosData(dashboardData.performance.carteira_vs_ativos);
      setAlocacoesData(dashboardData.performance.alocacoes);
      setAtivosData(dashboardData.ativos);
      setHeatmapData(dashboardData.risco.heatmap);
      setPosicoesAbertas(dashboardData.posicoes.abertas);
      setPosicoesFechadas(dashboardData.posicoes.fechadas);
      setDiasPositivosNegativos(dashboardData.posicoes.dias_positivos_negativos);
      setPosicoesTimelineData(dashboardData.posicoes.timeline);
      
      setHasLoadedData(true);
      lastLoadedRangeKeyRef.current = currentRangeKey;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Removido carregamento automático - dados só carregam ao clicar em "Carregar Dados"

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return brlMode ? 'R$ 0,00' : '$0.00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: brlMode ? 'BRL' : 'USD'
    }).format(value);
  };

  const formatDate = (value: string | Date | undefined | null) => {
    if (!value) return 'N/A';
    try {
      const date = typeof value === 'string' ? new Date(value) : value;
      return format(date, 'dd/MM/yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00%';
    }
    return `${value.toFixed(2)}%`;
  };

  const getColorForAsset = (asset: string) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff'];
    return colors[asset.length % colors.length];
  };

  // Recharts precisa de uma propriedade no objeto de dados usada no eixo X.
  // O backend envia o eixo X separado em `index`, então unimos aqui.
  const withIndex = (dataset: PortfolioData | null) => {
    if (!dataset || !Array.isArray(dataset.data)) return [] as any[];
    const idx = Array.isArray(dataset.index) ? dataset.index : [];
    return dataset.data.map((row, i) => ({ index: idx[i], ...row }));
  };

  const withIndexNested = (obj: any) => {
    if (!obj || !obj.data) return [] as any[];
    const idx = Array.isArray(obj.index) ? obj.index : [];
    return obj.data.map((row: any, i: number) => ({ index: idx[i], ...row }));
  };

  // Comportamento: carregar tudo de uma vez após clicar em "Carregar Dados"; não refazer ao trocar de aba

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Dashboard - {selectedCarteira}</CardTitle>
          <CardDescription>
            Análise completa do portfolio baseada no EXC_Mission_Control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedCarteira} onValueChange={setSelectedCarteira}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {carteiras.map(carteira => (
                  <SelectItem key={carteira} value={carteira}>{carteira}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />

            <Button
              variant={brlMode ? "default" : "outline"}
              onClick={() => setBrlMode(!brlMode)}
              disabled={!hasLoadedData}
            >
              {brlMode ? "BRL" : "USD"}
            </Button>

            <Button onClick={fetchData} disabled={loading}>
              {loading ? 'Carregando...' : 'Carregar Dados'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!hasLoadedData && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecione um período</h3>
            <p className="text-muted-foreground">
              Escolha um intervalo de datas e clique em "Carregar Dados" para visualizar o dashboard
            </p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-lg">Carregando dados do portfolio...</div>
          </CardContent>
        </Card>
      )}

      {hasLoadedData && !loading && (
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ativos">Ativos</TabsTrigger>
          <TabsTrigger value="posicoes">Posições</TabsTrigger>
          <TabsTrigger value="alocacoes">Alocações</TabsTrigger>
          <TabsTrigger value="correlacao">Correlação</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Comparação de Carteiras */}
            <CarteirasChart 
              carteiras={["EXC"]}
              brl={brlMode}
              inicio={getDateRangeFormatted().inicio}
              fim={getDateRangeFormatted().fim}
            />

            {/* Decomposição */}
            <DecomposicaoChart 
              carteira={selectedCarteira}
              inicio={getDateRangeFormatted().inicio}
              fim={getDateRangeFormatted().fim}
              segmentar={true}
              acumular={true}
            />
          </div>

          {/* Carteira vs Ativos */}
          {carteiraVsAtivosData && (
            <CarteiraVsAtivosChart 
              data={carteiraVsAtivosData} 
              carteira={selectedCarteira}
              inicio={getDateRangeFormatted().inicio}
              fim={getDateRangeFormatted().fim}
            />
          )}
        </TabsContent>

        {/* Ativos Tab */}
        <TabsContent value="ativos" className="space-y-4">
          <AtivosChart 
            carteira={selectedCarteira}
            inicio={getDateRangeFormatted().inicio}
            fim={getDateRangeFormatted().fim}
          />
        </TabsContent>

        {/* Posições Tab */}
        <TabsContent value="posicoes" className="space-y-4">
          {/* Posições Abertas - Seguindo o padrão do CarteirasChart */}
          <OpenPositionsTable 
            carteira={selectedCarteira}
            brl={brlMode}
          />

          {/* Dias Positivos/Negativos */}
          <DiasPositivosNegativosChart 
            carteira={selectedCarteira}
            inicio={getDateRangeFormatted().inicio}
            fim={getDateRangeFormatted().fim}
            segmentar={false}
          />

        </TabsContent>

        {/* Alocações Tab */}
        <TabsContent value="alocacoes" className="space-y-4">
          <AlocacoesChart 
            carteira={selectedCarteira}
            inicio={getDateRangeFormatted().inicio}
            fim={getDateRangeFormatted().fim}
            segmentar={true}
            realAloc={false}
          />
        </TabsContent>

        {/* Correlação Tab */}
        <TabsContent value="correlacao" className="space-y-4">
          <CorrelationMatrixChart 
            carteira={selectedCarteira}
            inicio={getDateRangeFormatted().inicio}
            fim={getDateRangeFormatted().fim}
            janelaAmostral={30}
            setorizar={true}
          />
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};

export default PortfolioDashboard;
