import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { DateRangePicker } from './ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

// Importar componentes Plotly
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

interface PortfolioDashboardByCarteiraProps {
  carteira: string;
}

const PortfolioDashboardByCarteira: React.FC<PortfolioDashboardByCarteiraProps> = ({ carteira }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [brlMode, setBrlMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [activeTab, setActiveTab] = useState<'performance' | 'ativos' | 'posicoes' | 'alocacoes' | 'correlacao'>('performance');

  // Validar carteira
  const validCarteiras = ['EXC', 'HB', 'LC', 'AC'];
  const isValidCarteira = validCarteiras.includes(carteira.toUpperCase());
  const selectedCarteira = isValidCarteira ? carteira.toUpperCase() : 'EXC';

  const getDateRangeFormatted = () => {
    if (!dateRange?.from || !dateRange?.to) {
      return null;
    }
    
    return {
      inicio: format(dateRange.from, 'yyyy-MM-dd'),
      fim: format(dateRange.to, 'yyyy-MM-dd')
    };
  };

  const handleLoadData = () => {
    const dateRangeFormatted = getDateRangeFormatted();
    if (!dateRangeFormatted) {
      setError('Por favor, selecione um período para visualizar os dados');
      return;
    }

    // Apenas marca que os dados devem ser carregados
    // Os gráficos individuais farão o fetch quando renderizados
    setHasLoadedData(true);
    setError(null);
  };

  if (!isValidCarteira) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <Alert variant="destructive">
            <AlertDescription>
              Carteira inválida: {carteira}. Carteiras válidas: EXC, AC, LC, HB
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Dashboard - {selectedCarteira}</CardTitle>
          <CardDescription>
            Análise completa do portfolio {selectedCarteira}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[300px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Moeda:</label>
              <Button
                variant={brlMode ? "default" : "outline"}
                onClick={() => setBrlMode(!brlMode)}
                size="sm"
              >
                {brlMode ? "BRL" : "USD"}
              </Button>
            </div>

            <Button 
              onClick={handleLoadData} 
              disabled={!dateRange?.from || !dateRange?.to}
              className="gap-2"
            >
              Carregar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!hasLoadedData && (
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

      {hasLoadedData && (
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
            {(() => {
              const dateRangeFormatted = getDateRangeFormatted();
              if (!dateRangeFormatted) return null;
              const { inicio, fim } = dateRangeFormatted;
              
              return (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Comparação de Carteiras */}
                    <CarteirasChart 
                      carteiras={[selectedCarteira]}
                      brl={brlMode}
                      inicio={inicio}
                      fim={fim}
                    />

                    {/* Decomposição */}
                    <DecomposicaoChart 
                      carteira={selectedCarteira}
                      inicio={inicio}
                      fim={fim}
                      segmentar={true}
                      acumular={true}
                    />
                  </div>

                  {/* Carteira vs Ativos */}
                  <CarteiraVsAtivosChart 
                    carteira={selectedCarteira}
                    inicio={inicio}
                    fim={fim}
                  />
                </>
              );
            })()}
          </TabsContent>

          {/* Ativos Tab */}
          <TabsContent value="ativos" className="space-y-4">
            {(() => {
              const dateRangeFormatted = getDateRangeFormatted();
              if (!dateRangeFormatted) return null;
              const { inicio, fim } = dateRangeFormatted;
              
              return (
                <AtivosChart 
                  carteira={selectedCarteira}
                  inicio={inicio}
                  fim={fim}
                />
              );
            })()}
          </TabsContent>

          {/* Posições Tab */}
          <TabsContent value="posicoes" className="space-y-4">
            {/* Posições Abertas */}
            <OpenPositionsTable 
              carteira={selectedCarteira}
              brl={brlMode}
            />

            {(() => {
              const dateRangeFormatted = getDateRangeFormatted();
              if (!dateRangeFormatted) return null;
              const { inicio, fim } = dateRangeFormatted;
              
              return (
                <DiasPositivosNegativosChart 
                  carteira={selectedCarteira}
                  inicio={inicio}
                  fim={fim}
                  segmentar={false}
                />
              );
            })()}
          </TabsContent>

          {/* Alocações Tab */}
          <TabsContent value="alocacoes" className="space-y-4">
            {(() => {
              const dateRangeFormatted = getDateRangeFormatted();
              if (!dateRangeFormatted) return null;
              const { inicio, fim } = dateRangeFormatted;
              
              return (
                <AlocacoesChart 
                  carteira={selectedCarteira}
                  inicio={inicio}
                  fim={fim}
                  segmentar={true}
                  realAloc={false}
                />
              );
            })()}
          </TabsContent>

          {/* Correlação Tab */}
          <TabsContent value="correlacao" className="space-y-4">
            {(() => {
              const dateRangeFormatted = getDateRangeFormatted();
              if (!dateRangeFormatted) return null;
              const { inicio, fim } = dateRangeFormatted;
              
              return (
                <CorrelationMatrixChart 
                  carteira={selectedCarteira}
                  inicio={inicio}
                  fim={fim}
                  janelaAmostral={30}
                  setorizar={true}
                />
              );
            })()}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PortfolioDashboardByCarteira;

