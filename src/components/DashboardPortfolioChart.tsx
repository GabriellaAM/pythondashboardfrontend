import { useState, useEffect, useRef } from 'react';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
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
import { DateRangePicker } from './ui/date-range-picker';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';

interface PortfolioChartData {
  chartType: string;
  carteira?: string;
  carteiras?: string[];
  inicio?: string;
  fim?: string;
  brl?: boolean;
  segmentar?: boolean;
  acumular?: boolean;
  realAloc?: boolean;
  janelaAmostral?: number;
  setorizar?: boolean;
}

interface DashboardPortfolioChartProps {
  data?: PortfolioChartData;
  loading?: boolean;
  onDataChange?: (newData: PortfolioChartData) => void;
  componentId?: string;
}

export function DashboardPortfolioChart({ 
  data, 
  loading = false, 
  onDataChange,
  componentId 
}: DashboardPortfolioChartProps) {
  const [localDateRange, setLocalDateRange] = useState<DateRange | undefined>(undefined);
  const [localBrl, setLocalBrl] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeInicio, setActiveInicio] = useState<string | undefined>(undefined);
  const [activeFim, setActiveFim] = useState<string | undefined>(undefined);
  const [localCarteiras, setLocalCarteiras] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableCarteiras = ['EXC', 'HB', 'LC', 'AC'];

  // Inicializar datas locais a partir dos dados
  useEffect(() => {
    if (data?.inicio && data?.fim) {
      const fromDate = new Date(data.inicio);
      const toDate = new Date(data.fim);
      setLocalDateRange({
        from: fromDate,
        to: toDate
      });
      setActiveInicio(data.inicio);
      setActiveFim(data.fim);
      setIsDataLoaded(true);
    } else {
      // Valores padrão se não houver datas
      const hoje = new Date();
      const inicio = subDays(hoje, 30);
      setLocalDateRange({
        from: inicio,
        to: hoje
      });
      setIsDataLoaded(false);
    }
    if (data?.brl !== undefined) {
      setLocalBrl(data.brl);
    }
    // Inicializar carteiras selecionadas
    if (data?.chartType === 'carteiras') {
      if (data?.carteiras && data.carteiras.length > 0) {
        setLocalCarteiras(data.carteiras);
      } else {
        // Padrão: apenas EXC
        setLocalCarteiras(['EXC']);
      }
    }
  }, [data?.inicio, data?.fim, data?.brl, data?.chartType, data?.carteiras]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setLocalDateRange(range);
    setIsDataLoaded(false);
  };

  const handleLoadData = async () => {
    if (!localDateRange?.from || !localDateRange?.to || !data) return;
    
    // Validar carteiras se for gráfico de carteiras
    if (data.chartType === 'carteiras' && (!localCarteiras || localCarteiras.length === 0)) {
      return;
    }
    
    setIsLoadingData(true);
    
    const newInicio = format(localDateRange.from, 'yyyy-MM-dd');
    const newFim = format(localDateRange.to, 'yyyy-MM-dd');
    
    // Atualizar dados ativos
    setActiveInicio(newInicio);
    setActiveFim(newFim);
    setIsDataLoaded(true);
    
    // Salvar no backend se houver callback
    if (onDataChange) {
      const newData = {
        ...data,
        inicio: newInicio,
        fim: newFim,
        carteiras: data.chartType === 'carteiras' ? localCarteiras : data.carteiras
      };
      onDataChange(newData);
    }
    
    // Simular um pequeno delay para melhor UX
    setTimeout(() => {
      setIsLoadingData(false);
    }, 300);
  };

  const handleCarteiraToggle = (carteira: string) => {
    if (localCarteiras.includes(carteira)) {
      // Não permitir remover a última carteira
      if (localCarteiras.length > 1) {
        setLocalCarteiras(localCarteiras.filter(c => c !== carteira));
      }
    } else {
      setLocalCarteiras([...localCarteiras, carteira]);
    }
  };

  const handleBrlToggle = () => {
    if (!data || !onDataChange) return;
    
    const newBrl = !localBrl;
    setLocalBrl(newBrl);
    
    const newData = {
      ...data,
      brl: newBrl
    };
    onDataChange(newData);
  };

  if (loading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Carregando gráfico...</span>
        </div>
      </div>
    );
  }

  const { chartType, carteira, carteiras, segmentar, acumular, realAloc, janelaAmostral, setorizar } = data;
  
  // Usar datas ativas (após clicar em carregar) ou as do data
  const inicio = activeInicio || data.inicio;
  const fim = activeFim || data.fim;
  const brl = localBrl !== undefined ? localBrl : data.brl;

  // Renderizar controles de data e botão de carregar
  const renderControls = () => {
    return (
      <div 
        className="space-y-3 mb-3 p-3 bg-muted/30 rounded-md"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <DateRangePicker
              dateRange={localDateRange}
              onDateRangeChange={handleDateRangeChange}
              className="flex-shrink-0"
            />
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleLoadData();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!localDateRange?.from || !localDateRange?.to || isLoadingData || (chartType === 'carteiras' && (!localCarteiras || localCarteiras.length === 0))}
            size="sm"
            className="flex-shrink-0"
          >
            {isLoadingData ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              'Carregar Dados'
            )}
          </Button>
          {(chartType === 'carteiras' || chartType === 'carteira_vs_ativos') && (
            <Button
              variant={brl ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleBrlToggle();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex-shrink-0"
              disabled={!isDataLoaded}
            >
              {brl ? "BRL" : "USD"}
            </Button>
          )}
        </div>
        
        {/* Seletor de carteiras para gráfico de comparação */}
        {chartType === 'carteiras' && (
          <div 
            className="flex items-center gap-4 flex-wrap"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Label className="text-sm font-medium">Carteiras:</Label>
            <div className="flex items-center gap-3 flex-wrap">
              {availableCarteiras.map(carteira => (
                <div 
                  key={carteira} 
                  className="flex items-center space-x-2"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    id={`carteira-${carteira}`}
                    checked={localCarteiras.includes(carteira)}
                    onCheckedChange={() => handleCarteiraToggle(carteira)}
                    disabled={localCarteiras.length === 1 && localCarteiras.includes(carteira)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label
                    htmlFor={`carteira-${carteira}`}
                    className="text-sm font-normal cursor-pointer"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCarteiraToggle(carteira);
                    }}
                  >
                    {carteira}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar o chart apropriado baseado no tipo
  const renderChartContent = () => {
    if (!isDataLoaded || !inicio || !fim) {
      return (
        <div className="w-full h-full flex items-center justify-center min-h-[200px] text-muted-foreground">
          <p>Selecione um período e clique em "Carregar Dados"</p>
        </div>
      );
    }

    switch (chartType) {
      case 'carteiras':
        // Usar carteiras locais se disponíveis, senão usar as do data
        const activeCarteiras = localCarteiras.length > 0 ? localCarteiras : (carteiras || []);
        if (!activeCarteiras || activeCarteiras.length === 0) {
          return (
            <div className="w-full h-full flex items-center justify-center min-h-[200px] text-muted-foreground">
              <p>Selecione pelo menos uma carteira</p>
            </div>
          );
        }
        return (
          <div className="w-full h-full" style={{ height: '100%' }}>
            <CarteirasChart
              carteiras={activeCarteiras}
              brl={brl}
              inicio={inicio}
              fim={fim}
              containerMode={true}
            />
          </div>
        );

      case 'ativos':
        if (!carteira) {
          return (
            <div className="w-full h-full flex items-center justify-center min-h-[200px] text-muted-foreground">
              <p>Carteira não especificada</p>
            </div>
          );
        }
        return (
          <div className="w-full h-full" style={{ height: '100%' }}>
            <AtivosChart
              carteira={carteira}
              inicio={inicio}
              fim={fim}
              containerMode={true}
            />
          </div>
        );

      case 'decomposicao':
        if (!carteira) {
          return (
            <div className="w-full h-full flex items-center justify-center min-h-[200px] text-muted-foreground">
              <p>Carteira não especificada</p>
            </div>
          );
        }
        return (
          <div className="w-full h-full" style={{ height: '100%' }}>
            <DecomposicaoChart
              carteira={carteira}
              inicio={inicio}
              fim={fim}
              segmentar={segmentar}
              acumular={acumular}
              containerMode={true}
            />
          </div>
        );

      case 'carteira_vs_ativos':
        if (!carteira) {
          return (
            <div className="w-full h-full flex items-center justify-center min-h-[200px] text-muted-foreground">
              <p>Carteira não especificada</p>
            </div>
          );
        }
        return (
          <div className="w-full h-full" style={{ height: '100%' }}>
            <CarteiraVsAtivosChart
              carteira={carteira}
              inicio={inicio}
              fim={fim}
              containerMode={true}
            />
          </div>
        );

      case 'alocacoes':
        if (!carteira) {
          return (
            <div className="w-full h-full flex items-center justify-center min-h-[200px] text-muted-foreground">
              <p>Carteira não especificada</p>
            </div>
          );
        }
        return (
          <div className="w-full h-full" style={{ height: '100%' }}>
            <AlocacoesChart
              carteira={carteira}
              inicio={inicio}
              fim={fim}
              segmentar={segmentar}
              realAloc={realAloc}
              containerMode={true}
            />
          </div>
        );

      case 'correlacao':
        if (!carteira) {
          return (
            <div className="w-full h-full flex items-center justify-center min-h-[200px] text-muted-foreground">
              <p>Carteira não especificada</p>
            </div>
          );
        }
        return (
          <div className="w-full h-full" style={{ height: '100%' }}>
            <CorrelationMatrixChart
              carteira={carteira}
              inicio={inicio}
              fim={fim}
              janelaAmostral={janelaAmostral || 30}
              setorizar={setorizar}
              containerMode={true}
            />
          </div>
        );

      case 'dias_positivos_negativos':
        if (!carteira) {
          return (
            <div className="w-full h-full flex items-center justify-center min-h-[200px] text-muted-foreground">
              <p>Carteira não especificada</p>
            </div>
          );
        }
        return (
          <div className="w-full h-full" style={{ height: '100%' }}>
            <DiasPositivosNegativosChart
              carteira={carteira}
              inicio={inicio}
              fim={fim}
              segmentar={segmentar}
              containerMode={true}
            />
          </div>
        );

      case 'posicoes_abertas':
        if (!carteira) {
          return (
            <div className="w-full h-full flex items-center justify-center min-h-[200px] text-muted-foreground">
              <p>Carteira não especificada</p>
            </div>
          );
        }
        return (
          <div className="w-full h-full" style={{ height: '100%' }}>
            <OpenPositionsTable
              carteira={carteira}
              brl={brl}
              containerMode={true}
            />
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center min-h-[200px] text-muted-foreground">
            <p>Tipo de gráfico não suportado: {chartType}</p>
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>
      {renderControls()}
      <div className="flex-1 min-h-0 overflow-hidden" style={{ height: '100%' }}>
        {renderChartContent()}
      </div>
    </div>
  );
}

