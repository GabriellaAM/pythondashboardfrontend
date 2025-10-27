import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
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
import { api } from '../lib/api';

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
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [brlMode, setBrlMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const periods = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: '1y', label: '1 ano' },
    { value: 'all', label: 'Todo período' }
  ];

  const getDateRange = (period: string) => {
    const today = new Date();
    const start = new Date();
    
    switch (period) {
      case '7d':
        start.setDate(today.getDate() - 7);
        break;
      case '30d':
        start.setDate(today.getDate() - 30);
        break;
      case '90d':
        start.setDate(today.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(today.getFullYear() - 1);
        break;
      default:
        start.setFullYear(2020); // Todo período
    }
    
    return {
      inicio: start.toISOString().split('T')[0],
      fim: today.toISOString().split('T')[0]
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { inicio, fim } = getDateRange(selectedPeriod);
      
      // Fetch all data in parallel
      const [
        carteirasRes,
        rebalanceamentoRes,
        ativosRes,
        decomposicaoRes,
        heatmapRes,
        varVooRes,
        posicoesAbertasRes,
        posicoesFechadasRes,
        diasPositivosNegativosRes,
        betaRollingRes
      ] = await Promise.all([
        api.request<PortfolioData>(`/portfolio/visualizations/carteiras/${inicio}/${fim}?brl=${brlMode}`),
        api.request<any>(`/portfolio/visualizations/rebalanceamento/${inicio}/${fim}?carteira=${selectedCarteira}`),
        api.request<PortfolioData>(`/portfolio/visualizations/ativos/${inicio}/${fim}?carteira=${selectedCarteira}&brl=${brlMode}`),
        api.request<PortfolioData>(`/portfolio/visualizations/decomposicao/${inicio}/${fim}?carteira=${selectedCarteira}&brl=${brlMode}`),
        api.request<any>(`/portfolio/visualizations/heatmap/${inicio}/${fim}?carteira=${selectedCarteira}`),
        api.request<VaRVoOData>(`/portfolio/visualizations/var-voo/${inicio}/${fim}?carteira=${selectedCarteira}`),
        api.request<PositionData>(`/portfolio/visualizations/posicoes-abertas?carteira=${selectedCarteira}`),
        api.request<PositionData>(`/portfolio/visualizations/posicoes-fechadas?carteira=${selectedCarteira}`),
        api.request<any>(`/portfolio/visualizations/dias-positivos-negativos/${inicio}/${fim}?carteira=${selectedCarteira}`),
        api.request<PortfolioData>(`/portfolio/visualizations/beta-rolling/${inicio}/${fim}?carteira=${selectedCarteira}`)
      ]);

      setCarteirasData(carteirasRes);
      setRebalanceamentoData(rebalanceamentoRes);
      setAtivosData(ativosRes);
      setDecomposicaoData(decomposicaoRes);
      setHeatmapData(heatmapRes);
      setVarVooData(varVooRes);
      setPosicoesAbertas(posicoesAbertasRes);
      setPosicoesFechadas(posicoesFechadasRes);
      setDiasPositivosNegativos(diasPositivosNegativosRes);
      setBetaRollingData(betaRollingRes);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCarteira, selectedPeriod, brlMode]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: brlMode ? 'BRL' : 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getColorForAsset = (asset: string) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff'];
    return colors[asset.length % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados do portfolio...</div>
      </div>
    );
  }

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

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => (
                  <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={brlMode ? "default" : "outline"}
              onClick={() => setBrlMode(!brlMode)}
            >
              {brlMode ? "BRL" : "USD"}
            </Button>

            <Button onClick={fetchData} disabled={loading}>
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="performance" className="space-y-4">
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
                    <LineChart data={carteirasData.data}>
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
                    <LineChart data={decomposicaoData.data}>
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
                      <LineChart data={rebalanceamentoData.diario.data}>
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
                      <LineChart data={rebalanceamentoData.alertas.data}>
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
                  <LineChart data={ativosData.data}>
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
                        {Object.entries(varVooData.var).map(([ativo, var]) => (
                          <div key={ativo} className="flex justify-between items-center">
                            <span className="font-medium">{ativo}</span>
                            <Badge variant="destructive">{formatPercentage(var)}</Badge>
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
                  <LineChart data={betaRollingData.data}>
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
                          <span className="font-medium">{posicao.ativo}</span>
                          <div className="text-sm text-gray-500">
                            {posicao.dias_em_carteira} dias
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatPercentage(posicao.retorno_acumulado)}
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
                          <span className="font-medium">{posicao.ativo}</span>
                          <div className="text-sm text-gray-500">
                            {posicao.dias_em_carteira} dias
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${posicao.retorno_acumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(posicao.retorno_acumulado)}
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
    </div>
  );
};

export default PortfolioDashboard;
