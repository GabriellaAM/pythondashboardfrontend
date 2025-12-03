import React, { useState, useEffect } from 'react';
import { PlotlyChart } from './PlotlyChart';
import { frontendCache } from '../../lib/cache';

interface DiasPositivosNegativosChartProps {
  carteira: string;
  inicio?: string;
  fim?: string;
  segmentar?: boolean;
  containerMode?: boolean;
}

interface ApiData {
  pos_percents: Record<string, number>;
  neg_percents: Record<string, number>;
  fora_da_carteira_percents: Record<string, number>;
}

export function DiasPositivosNegativosChart({ 
  carteira, 
  inicio, 
  fim, 
  segmentar = false,
  containerMode = false
}: DiasPositivosNegativosChartProps) {
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
        const cacheKey = frontendCache.generateKey(`/api/portfolio/visualizations/dias-positivos-negativos/${inicio}/${fim}`, { 
          carteira, 
          segmentar 
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
          `http://localhost:8000/api/portfolio/visualizations/dias-positivos-negativos/${inicio}/${fim}?carteira=${carteira}&segmentar=${segmentar}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        frontendCache.set(cacheKey, result);
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados de dias positivos/negativos:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteira, inicio, fim, segmentar]);

  if (loading) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Carregando dados...' }}
        title="Percentual de Dias Positivos/Negativos"
        description="Carregando dados..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Percentual de Dias Positivos/Negativos"
        description={`Erro ao carregar dados: ${error}`}
      />
    );
  }

  if (!data || !data.pos_percents) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Percentual de Dias Positivos/Negativos"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  // Preparar dados para Plotly - gráfico de barras horizontais empilhadas
  const ativos = Object.keys(data.pos_percents);
  
  const tracePositivos = {
    x: ativos.map(ativo => data.pos_percents[ativo]),
    y: ativos,
    type: 'bar',
    orientation: 'h',
    name: 'Dias Positivos (%)',
    marker: {
      color: 'green'
    },
    hovertemplate: '<b>%{y}</b><br>Dias Positivos: %{x:.2f}%<extra></extra>'
  };

  const traceNegativos = {
    x: ativos.map(ativo => data.neg_percents[ativo]),
    y: ativos,
    type: 'bar',
    orientation: 'h',
    name: 'Dias Negativos (%)',
    marker: {
      color: 'red'
    },
    hovertemplate: '<b>%{y}</b><br>Dias Negativos: %{x:.2f}%<extra></extra>'
  };

  const traceForaCarteira = {
    x: ativos.map(ativo => data.fora_da_carteira_percents[ativo]),
    y: ativos,
    type: 'bar',
    orientation: 'h',
    name: 'Fora da Carteira (%)',
    marker: {
      color: 'lightgray'
    },
    hovertemplate: '<b>%{y}</b><br>Fora da Carteira: %{x:.0f}%<extra></extra>'
  };

  const layout = {
    title: {
      text: `Percentual de Dias Positivos/Negativos: ${carteira}`,
      x: 0.055,
      y: 0.97,
      font: { size: 18, color: 'black', family: 'Georgia' }
    },
    xaxis: {
      title: '',
      showline: true,
      showgrid: true,
      linecolor: 'white',
      linewidth: 2
    },
    yaxis: {
      title: '',
      showline: true,
      showgrid: false,
      gridcolor: 'lightgray',
      linecolor: 'white',
      linewidth: 2,
      zerolinecolor: 'lightgray'
    },
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
    <PlotlyChart
      data={[tracePositivos, traceNegativos, traceForaCarteira]}
      layout={layout}
      title={containerMode ? undefined : "Percentual de Dias Positivos/Negativos"}
      description={containerMode ? undefined : `Análise de dias positivos e negativos para ${carteira}`}
      containerMode={containerMode}
    />
  );
}
