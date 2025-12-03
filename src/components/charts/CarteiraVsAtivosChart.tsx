import React, { useState, useEffect } from 'react';
import { PlotlyChart } from './PlotlyChart';
import { frontendCache } from '../../lib/cache';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface CarteiraVsAtivosChartProps {
  carteira: string;
  inicio?: string;
  fim?: string;
  containerMode?: boolean;
}

interface ApiData {
  data: any[];
  columns: string[];
  index: string[];
  warnings?: string[];
}

export function CarteiraVsAtivosChart({ carteira, inicio, fim, containerMode = false }: CarteiraVsAtivosChartProps) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWarnings, setShowWarnings] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!inicio || !fim) {
        setError('Período não especificado');
        setLoading(false);
        return;
      }

      try {
        // Check cache first
        const cacheKey = frontendCache.generateKey(`/api/portfolio/visualizations/carteira-vs-ativos/${inicio}/${fim}`, { carteira });
        const cachedData = frontendCache.get<ApiData>(cacheKey);
        
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8000/api/portfolio/visualizations/carteira-vs-ativos/${inicio}/${fim}?carteira=${carteira}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        frontendCache.set(cacheKey, result);
        setData(result);
        // Resetar showWarnings quando novos dados são carregados
        setShowWarnings(true);
        
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteira, inicio, fim]);

  if (loading) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Carregando dados...' }}
        title="Performance Acumulada: Carteira vs. Ativos"
        description="Carregando dados da API..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Performance Acumulada: Carteira vs. Ativos"
        description={`Erro ao carregar dados: ${error}`}
      />
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Performance Acumulada: Carteira vs. Ativos"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  // Preparar dados para Plotly - gráfico de barras como no notebook
  const ativos = data.columns;
  const valores = data.data[data.data.length - 1]; // Última linha (performance acumulada)
  
  // Ordenar por performance
  // Valores já vêm em porcentagem da API (multiplicados por 100 no backend)
  const ativosOrdenados = ativos
    .map(ativo => ({
      ativo,
      valor: valores[ativo] || 0 // Valores já estão em porcentagem (ex: 0.40 = 0.40%)
    }))
    .sort((a, b) => a.valor - b.valor);

  const trace = {
    x: ativosOrdenados.map(item => item.ativo),
    y: ativosOrdenados.map(item => item.valor),
    type: 'bar',
    marker: {
      color: ativosOrdenados.map(item => 
        item.ativo === carteira ? 'rgb(187,13,49)' : 'gray'
      ),
      line: {
        color: 'rgb(0,0,0,0)',
        width: 0.1
      }
    },
    hoverinfo: 'y', // EXATO do notebook
    hovertemplate: '<b>%{x}</b>: %{y:.2f}%<extra></extra>', // EXATO do notebook: sem <br>Rentabilidade:
    hoverlabel: {
      bgcolor: 'white',
      font_size: 12,
      font_family: 'Georgia'
    },
    showlegend: false
  };

  const layout = {
    margin: { t: 60 }, // EXATO do notebook: margin=dict(t=60)
    title: {
      text: `Performance Acumulada: ${carteira} vs. Ativos`,
      x: 0.055,
      y: 0.97,
      font: { size: 18, color: 'black', family: 'Georgia' }
    },
    xaxis_title: '', // EXATO do notebook: xaxis_title=''
    yaxis_title: 'Rentabilidade Acumulada (%)', // EXATO do notebook
    plot_bgcolor: 'white', // EXATO do notebook: plot_bgcolor='white'
    xaxis: {
      title: '',
      showline: true,
      showgrid: false,
      linecolor: 'white',
      linewidth: 2
    },
    yaxis: {
      title: 'Rentabilidade Acumulada (%)',
      showline: true,
      showgrid: true,
      gridcolor: 'lightgray',
      linecolor: 'white',
      linewidth: 2,
      zerolinecolor: 'lightgray'
    },
    font: { // EXATO do notebook: font=dict(family='Georgia', size=15, color='black')
      family: 'Georgia',
      size: 15,
      color: 'black'
    },
    annotations: inicio && fim ? [{ // EXATO do notebook
      text: `Período: ${inicio} à ${fim}`,
      xref: 'paper',
      yref: 'paper',
      x: 0.0000005,
      y: 1.065,
      showarrow: false,
      font: {
        family: 'Georgia',
        size: 13,
        color: 'gray'
      }
    }] : []
  };

  if (containerMode) {
    return (
      <div className="w-full h-full flex flex-col" style={{ height: '100%' }}>
        <div className="flex-1 min-h-0" style={{ height: '100%' }}>
          <PlotlyChart
            data={[trace]}
            layout={layout}
            containerMode={true}
          />
        </div>
        {data.warnings && data.warnings.length > 0 && showWarnings && (
          <div className="mt-2 flex-shrink-0">
            <Alert variant="default" className="relative pr-8">
              <AlertDescription className="text-xs">
                {data.warnings.join(' ')}
              </AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWarnings(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <PlotlyChart
        data={[trace]}
        layout={layout}
        title="Performance Acumulada: Carteira vs. Ativos"
        description={`Comparação entre a carteira ${carteira} e seus ativos individuais`}
      />

      {data.warnings && data.warnings.length > 0 && showWarnings && (
        <Alert variant="default" className="relative pr-8">
          <AlertDescription className="text-xs">
            {data.warnings.join(' ')}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => setShowWarnings(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
    </div>
  );
}
