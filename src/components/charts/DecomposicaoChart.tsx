import React, { useState, useEffect } from 'react';
import { PlotlyChart } from './PlotlyChart';

interface DecomposicaoChartProps {
  carteira: string;
  inicio?: string;
  fim?: string;
  segmentar?: boolean;
  acumular?: boolean;
}

interface ApiData {
  data: any[];
  columns: string[];
  index: string[];
}

export function DecomposicaoChart({ 
  carteira, 
  inicio, 
  fim, 
  segmentar = true, 
  acumular = false 
}: DecomposicaoChartProps) {
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
        setLoading(true);
        setError(null);
        
        // Usar a nova API limpa de decomposição
        const response = await fetch(
          `http://localhost:8000/api/clean/decomposicao/${inicio}/${fim}?carteira=${carteira}&segmentar=${segmentar}&acumular=${acumular}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados de decomposição:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteira, inicio, fim, segmentar, acumular]);

  if (loading) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Carregando dados...' }}
        title="Decomposição de Retorno"
        description="Carregando dados da API..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Decomposição de Retorno"
        description="Erro ao carregar dados"
      />
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Decomposição de Retorno"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  // Preparar dados para Plotly - EXATO do notebook
  const traces = data.columns.map((column, index) => {
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];
    
    return {
      x: data.index, // Datas no eixo X
      y: data.data.map(row => row[column] || 0), // Valores já em porcentagem da API
      type: 'bar',
      name: column,
      hoverinfo: 'y',
      hovertemplate: `<b>${column}</b>: %{y:.4f}%<extra></extra>`,
      hoverlabel: {
        bgcolor: 'white',
        font_size: 12,
        font_family: 'Georgia'
      },
      showlegend: true,
      marker: {
        line: { width: 0 }
      }
    };
  });

  // Títulos baseados no tipo - EXATO do notebook
  const yTitle = acumular 
    ? 'Retornos Ponderados e Acumulados (%)' 
    : 'Retornos Diários Ponderados (%)';

  const titulo = `Decomposição de Retorno (USD): ${carteira}`;

  const layout = {
    margin: { t: 60 },
    title: {
      text: titulo,
      x: 0.055,
      y: 0.97,
      font: { size: 18, color: 'black', family: 'Georgia' }
    },
    xaxis: {
      title: '',
      showline: true,
      showgrid: false,
      linecolor: 'white',
      linewidth: 2
    },
    yaxis: {
      title: yTitle,
      showline: true,
      showgrid: true,
      gridcolor: 'lightgray',
      linecolor: 'white',
      linewidth: 2,
      zerolinecolor: 'lightgray'
    },
    plot_bgcolor: 'white',
    font: {
      family: 'Georgia',
      size: 15,
      color: 'black'
    },
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
    }] : [],
    barmode: 'relative' // EXATO do notebook
  };

  return (
    <PlotlyChart
      data={traces}
      layout={layout}
      title="Decomposição de Retorno"
      description={`Contribuição de cada ativo para o retorno da carteira ${carteira}`}
    />
  );
}