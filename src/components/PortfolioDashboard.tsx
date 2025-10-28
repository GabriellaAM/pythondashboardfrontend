import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
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
import { apiClient } from '../lib/api';

interface PortfolioData {
  data: any[];
  columns: string[];
  index: string[];
}

interface VaRVoOData {
  var: Record<string, number>;
  voo: Record<string, number>;
  nivel_confianca: number;
  janela_amostral: number;
  periodo: number;
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
  const [activeTab, setActiveTab] = useState<'performance' | 'rebalanceamento' | 'ativos' | 'risco' | 'posicoes'>('performance');

  // Estados para os dados
  const [carteirasData, setCarteirasData] = useState<PortfolioData | null>(null);
  const [rebalanceamentoData, setRebalanceamentoData] = useState<any>(null);
  const [ativosData, setAtivosData] = useState<PortfolioData | null>(null);
  const [decomposicaoData, setDecomposicaoData] = useState<PortfolioData | null>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [varVooData, setVarVooData] = useState<VaRVoOData | null>(null);
  const [posicoesAbertas, setPosicoesAbertas] = useState<PositionData | null>(null);
  const [posicoesFechadas, setPosicoesFechadas] = useState<PositionData | null>(null);
  const [diasPositivosNegativos, setDiasPositivosNegativos] = useState<any>(null);
  const [betaRollingData, setBetaRollingData] = useState<PortfolioData | null>(null);

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
      
      const dashboardData = await apiClient.getPortfolioDashboardCompleto(inicio, fim, selectedCarteira, brlMode);
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ [FRONTEND] Dashboard carregado em ${loadTime}ms`);
      console.log(`📊 [FRONTEND] Tempo de processamento backend: ${dashboardData.metadata.processado_em.toFixed(2)}s`);

      // Mapear dados do response otimizado
      setCarteirasData(dashboardData.performance.carteiras);
      setDecomposicaoData(dashboardData.performance.decomposicao);
      setRebalanceamentoData(dashboardData.rebalanceamento);
      setAtivosData(dashboardData.ativos);
      setHeatmapData(dashboardData.risco.heatmap);
      setVarVooData(dashboardData.risco.var_voo);
      setBetaRollingData(dashboardData.risco.beta_rolling);
      setPosicoesAbertas(dashboardData.posicoes.abertas);
      setPosicoesFechadas(dashboardData.posicoes.fechadas);
      setDiasPositivosNegativos(dashboardData.posicoes.dias_positivos_negativos);
      
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
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="rebalanceamento">Rebalanceamento</TabsTrigger>
          <TabsTrigger value="ativos">Ativos</TabsTrigger>
          <TabsTrigger value="risco">Risco</TabsTrigger>
          <TabsTrigger value="posicoes">Posições</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Comparação de Carteiras */}
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Carteiras</CardTitle>
              </CardHeader>
              <CardContent>
                {carteirasData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={withIndex(carteirasData)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      {carteirasData.columns.map((column, index) => (
                        <Line
                          key={column}
                          type="monotone"
                          dataKey={column}
                          stroke={getColorForAsset(column)}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Decomposição */}
            <Card>
              <CardHeader>
                <CardTitle>Decomposição por Ativo</CardTitle>
              </CardHeader>
              <CardContent>
                {decomposicaoData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={withIndex(decomposicaoData)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      {decomposicaoData.columns.map((column, index) => (
                        <Line
                          key={column}
                          type="monotone"
                          dataKey={column}
                          stroke={getColorForAsset(column)}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rebalanceamento Tab */}
        <TabsContent value="rebalanceamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rebalanceamento Diário vs Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              {rebalanceamentoData && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Rebalanceamento Diário</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={withIndexNested(rebalanceamentoData.diario)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        {rebalanceamentoData.diario.columns.map((column, index) => (
                          <Line
                            key={column}
                            type="monotone"
                            dataKey={column}
                            stroke="#8884d8"
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Rebalanceamento por Alertas</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={withIndexNested(rebalanceamentoData.alertas)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="index" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        {rebalanceamentoData.alertas.columns.map((column, index) => (
                          <Line
                            key={column}
                            type="monotone"
                            dataKey={column}
                            stroke="#82ca9d"
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ativos Tab */}
        <TabsContent value="ativos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Individual dos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {ativosData && (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={withIndex(ativosData)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    {ativosData.columns.map((column, index) => (
                      <Line
                        key={column}
                        type="monotone"
                        dataKey={column}
                        stroke={getColorForAsset(column)}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risco Tab */}
        <TabsContent value="risco" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* VaR e VoO */}
            <Card>
              <CardHeader>
                <CardTitle>VaR e VoO por Ativo</CardTitle>
              </CardHeader>
              <CardContent>
                {varVooData && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Value at Risk (VaR) - {varVooData.nivel_confianca}%</h4>
                      <div className="space-y-2">
                        {Object.entries(varVooData.var).map(([ativo, varValue]) => (
                          <div key={ativo} className="flex justify-between items-center">
                            <span className="font-medium">{ativo}</span>
                            <Badge variant="destructive">{formatPercentage(varValue)}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Value of Opportunity (VoO) - {varVooData.nivel_confianca}%</h4>
                      <div className="space-y-2">
                        {Object.entries(varVooData.voo).map(([ativo, voo]) => (
                          <div key={ativo} className="flex justify-between items-center">
                            <span className="font-medium">{ativo}</span>
                            <Badge variant="default">{formatPercentage(voo)}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Heatmap de Correlação */}
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Correlação</CardTitle>
              </CardHeader>
              <CardContent>
                {heatmapData && (
                  <div className="text-sm">
                    <p>Matriz de correlação entre ativos (últimos 30 dias)</p>
                    {/* Aqui você pode implementar um heatmap visual mais elaborado */}
                    <div className="mt-4 p-4 bg-gray-50 rounded">
                      <pre>{JSON.stringify(heatmapData, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Beta Rolling */}
          <Card>
            <CardHeader>
              <CardTitle>Beta Rolling vs BTC</CardTitle>
            </CardHeader>
            <CardContent>
              {betaRollingData && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={withIndex(betaRollingData)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip formatter={(value) => Number(value).toFixed(4)} />
                    <Legend />
                    {betaRollingData.columns.map((column, index) => (
                      <Line
                        key={column}
                        type="monotone"
                        dataKey={column}
                        stroke={getColorForAsset(column)}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posições Tab */}
        <TabsContent value="posicoes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Posições Abertas */}
            <Card>
              <CardHeader>
                <CardTitle>Posições Abertas</CardTitle>
              </CardHeader>
              <CardContent>
                {posicoesAbertas && (
                  <div className="space-y-2">
                    {posicoesAbertas.data.map((posicao, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{posicao.ativo || 'N/A'}</span>
                          <div className="text-sm text-gray-500">
                            {posicao.dias_em_carteira || 0} dias
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatPercentage(posicao['retorno_acumulado(%)'])}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(posicao.preco_entrada)} → {formatCurrency(posicao.preco_atual)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Posições Fechadas */}
            <Card>
              <CardHeader>
                <CardTitle>Posições Fechadas</CardTitle>
              </CardHeader>
              <CardContent>
                {posicoesFechadas && (
                  <div className="space-y-2">
                    {posicoesFechadas.data.map((posicao, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{posicao.ativo || 'N/A'}</span>
                          <div className="text-sm text-gray-500">
                            {posicao.dias_em_carteira || 0} dias
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${(posicao['retorno_acumulado(%)'] || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(posicao['retorno_acumulado(%)'])}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(posicao.preco_entrada)} → {formatCurrency(posicao.preco_saida)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};

export default PortfolioDashboard;
