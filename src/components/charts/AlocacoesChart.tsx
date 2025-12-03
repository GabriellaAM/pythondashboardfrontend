import React, { useState, useEffect } from 'react';
import { PlotlyChart } from './PlotlyChart';
import { frontendCache } from '../../lib/cache';
import { Alert, AlertDescription } from '../ui/alert';

interface AlocacoesChartProps {
  carteira: string;
  inicio?: string;
  fim?: string;
  segmentar?: boolean;
  realAloc?: boolean;
}

interface ApiData {
  data: any[];
  columns: string[];
  index: string[];
  warnings?: string[];
}

export function AlocacoesChart({ 
  carteira, 
  inicio, 
  fim, 
  segmentar = false, 
  realAloc = false 
}: AlocacoesChartProps) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!inicio || !fim) {
        setError('Período não especificado');
        setLoading(false);
        return;
      }

      try {
        // Check cache first
        const cacheKey = frontendCache.generateKey(`/api/portfolio/visualizations/alocacoes/${inicio}/${fim}`, { 
          carteira, 
          segmentar, 
          realAloc 
        });
        const cachedData = frontendCache.get<ApiData>(cacheKey);
        
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8000/api/portfolio/visualizations/alocacoes/${inicio}/${fim}?carteira=${carteira}&segmentar=${segmentar}&realAloc=${realAloc}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        frontendCache.set(cacheKey, result);
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados de alocações:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteira, inicio, fim, segmentar, realAloc]);

  if (loading) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Carregando dados...' }}
        title="Alocação de Ativos ao Longo do Tempo"
        description="Carregando dados..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Alocação de Ativos ao Longo do Tempo"
        description={`Erro ao carregar dados: ${error}`}
      />
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Alocação de Ativos ao Longo do Tempo"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  // Preparar dados para Plotly - gráfico de barras empilhadas
  const traces = data.columns.map((column, index) => {
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
    ];
    
    return {
      x: data.index,
      y: data.data.map(row => row[column] || 0), // Valores já vêm em porcentagem da API (multiplicados por 100 no backend)
      type: 'bar',
      name: column,
      marker: {
        color: colors[index % colors.length],
        line: { width: 0 }
      },
      hovertemplate: `<b>${column}</b><br>` +
        `Data: %{x}<br>` +
        `Alocação: %{y:.0f}%<extra></extra>`,
      hoverlabel: {
        bgcolor: 'white',
        font_size: 12,
        font_family: 'Georgia'
      },
      showlegend: true
    };
  });

  const layout = {
    title: {
      text: `Alocação de Ativos ao Longo do Tempo: ${carteira}`,
      x: 0.055,
      y: 0.97,
      font: { size: 18, color: 'black', family: 'Georgia' }
    },
    xaxis: {
      title: '',
      showline: true,
      showgrid: false,
      linecolor: 'white',
      linewidth: 0,
      tickangle: -45,
      nticks: 20
    },
    yaxis: {
      title: 'Alocação (%)',
      showline: false,
      showgrid: false,
      gridcolor: 'lightgray',
      linecolor: 'white',
      linewidth: 2,
      zerolinecolor: 'lightgray'
    },
    bargap: 0,
    barmode: 'stack',
    annotations: inicio && fim ? [{
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

  return (
    <div className="space-y-2">
      <PlotlyChart
        data={traces}
        layout={layout}
        title="Alocação de Ativos ao Longo do Tempo"
        description={`Evolução das alocações da carteira ${carteira} ao longo do tempo`}
      />

      {data.warnings && data.warnings.length > 0 && (
        <Alert variant="default">
          <AlertDescription className="text-xs">
            {data.warnings.join(' ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
