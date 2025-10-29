import React, { useState, useEffect, useMemo } from 'react';
import { PlotlyChart } from './PlotlyChart';

interface CarteirasChartProps {
  carteiras?: string[];
  brl?: boolean;
  inicio?: string;
  fim?: string;
}

interface ApiData {
  data: any[];
  columns: string[];
  index: string[];
}

export function CarteirasChart({ 
  carteiras = ['EXC'], 
  brl = false, 
  inicio, 
  fim 
}: CarteirasChartProps) {
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
        
        // Usar a nova API limpa de carteiras
        const carteirasParam = carteiras.join(',');
        const response = await fetch(
          `http://localhost:8000/api/clean/carteiras/${inicio}/${fim}?carteiras=${carteirasParam}&brl=${brl}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados de carteiras:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteiras, inicio, fim, brl]);

  // Preparar dados para Plotly - EXATO do notebook
  const traces = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) {
      return [];
    }

    return data.columns.map((column) => {
      const color = getColorForAsset(column);
      return {
        x: data.index,
        y: data.data.map(row => {
          const value = row?.[column];
          if (value === null || value === undefined) return null;
          const num = typeof value === 'number' ? value : Number(value);
          if (!isFinite(num)) return null;
          // Valores já vêm em porcentagem da API (exato do notebook)
          return num;
        }),
        type: 'scatter',
        mode: 'lines',
        name: column,
        hovertemplate: '%{y:.2f}%<extra></extra>',
        line: {
          color: color,
          width: 2,
          shape: 'spline' // Linhas suaves como no notebook
        }
      };
    });
  }, [data]);

  const layout = useMemo(() => {
    const titulo = brl ? 'Rentabilidade das Carteiras (BRL)' : 'Rentabilidade Carteiras (USD)';
    
    return {
      margin: { t: 60 },
      title: {
        text: titulo,
        x: 0.055,
        y: 0.97,
        font: { 
          size: 18, 
          color: 'black', 
          family: 'Georgia' 
        }
      },
      xaxis: {
        title: '',
        showline: true,
        showgrid: true,
        gridcolor: 'lightgray',
        linecolor: 'white',
        linewidth: 2,
        zerolinecolor: 'lightgray'
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
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'right',
        x: 1
      },
      hovermode: 'x unified',
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
        x: 0.00001,
        y: 1.065,
        showarrow: false,
        font: {
          family: 'Georgia',
          size: 13,
          color: 'gray'
        }
      }] : []
    };
  }, [brl, inicio, fim]);

  if (loading) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Carregando dados...' }}
        title="Comparação de Carteiras"
        description="Carregando dados da API..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Comparação de Carteiras"
        description="Erro ao carregar dados"
      />
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Comparação de Carteiras"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  return (
    <PlotlyChart
      data={traces}
      layout={layout}
      title="Comparação de Carteiras"
      description={brl ? 'Rentabilidade acumulada em Reais' : 'Rentabilidade acumulada em Dólares'}
    />
  );
}

function getColorForAsset(asset: string): string {
  const colors = [
    '#1f77b4', // Azul
    '#ff7f0e', // Laranja
    '#2ca02c', // Verde
    '#d62728', // Vermelho
    '#9467bd', // Roxo
    '#8c564b', // Marrom
    '#e377c2', // Rosa
    '#7f7f7f', // Cinza
    '#bcbd22', // Verde-amarelado
    '#17becf', // Ciano
  ];

  let hash = 0;
  for (let i = 0; i < asset.length; i++) {
    hash = asset.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}