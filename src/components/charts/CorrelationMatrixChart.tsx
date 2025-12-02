import React, { useState, useEffect } from 'react';
import { PlotlyChart } from './PlotlyChart';
import { frontendCache } from '../../lib/cache';

interface CorrelationMatrixChartProps {
  carteira: string;
  inicio?: string;
  fim?: string;
  janelaAmostral?: number;
  setorizar?: boolean;
}

interface ApiData {
  data: any[];
  columns: string[];
  index: string[];
}

export function CorrelationMatrixChart({ 
  carteira, 
  inicio, 
  fim,
  janelaAmostral = 30, 
  setorizar = true  // padrão: setorizar=true, como no exemplo principal do notebook
}: CorrelationMatrixChartProps) {
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
        // Check cache first (inclui janelaAmostral e setorizar na chave para refletir o notebook)
        const cacheKey = frontendCache.generateKey(
          `/api/portfolio/visualizations/heatmap/${inicio}/${fim}`, 
          { carteira, janelaAmostral, setorizar }
        );
        const cachedData = frontendCache.get<ApiData>(cacheKey);
        
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8000/api/portfolio/visualizations/heatmap/${inicio}/${fim}?carteira=${carteira}&janela_amostral=${janelaAmostral}&setorizar=${setorizar}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        frontendCache.set(cacheKey, result);
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados de correlação:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteira, inicio, fim, janelaAmostral, setorizar]);

  if (loading) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Carregando dados...' }}
        title="Matriz de Correlação"
        description="Carregando dados..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Matriz de Correlação"
        description={`Erro ao carregar dados: ${error}`}
      />
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Matriz de Correlação"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  // Preparar dados para Plotly - heatmap
  const z = data.data.map(row => 
    data.columns.map(col => row[col] || 0)
  );

  const trace = {
    z: z,
    x: data.columns,
    y: data.columns,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: {
      title: 'Correlação'
    },
    hovertemplate: '<b>%{y} vs %{x}</b><br>Correlação: %{z:.3f}<extra></extra>'
  };

  const layout = {
    // Margens maiores para não cortar rótulos de eixos nem barra de cores
    margin: { t: 70, r: 100, b: 110, l: 110 },
    autosize: true,
    title: {
      text: `Matriz de Correlação de ${janelaAmostral} dias - ${carteira}`,
      x: 0.5,
      y: 0.95,
      xanchor: 'center',
      yanchor: 'top',
      font: { size: 16, color: 'black', family: 'Georgia' }
    },
    xaxis: {
      title: '',
      tickangle: -45,
      showline: true,
      linecolor: 'black',
      linewidth: 1,
      tickfont: { size: 10 },
      automargin: true
    },
    yaxis: {
      title: '',
      tickangle: 45,
      showline: true,
      linecolor: 'black',
      linewidth: 1,
      tickfont: { size: 10 },
      automargin: true
    },
    hovermode: 'closest'
  };

  return (
    <PlotlyChart
      data={[trace]}
      layout={layout}
      title="Matriz de Correlação"
      description={`Correlação entre ativos da carteira ${carteira} (últimos ${janelaAmostral} dias)`}
    />
  );
}
