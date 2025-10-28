import React from 'react';
import { PlotlyChart } from './PlotlyChart';

interface CorrelationMatrixChartProps {
  data: {
    data: any[];
    columns: string[];
    index: string[];
  };
  carteira: string;
  janelaAmostral?: number;
  setorizar?: boolean;
}

export function CorrelationMatrixChart({ 
  data, 
  carteira, 
  janelaAmostral = 30, 
  setorizar = false 
}: CorrelationMatrixChartProps) {
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
      linewidth: 1
    },
    yaxis: {
      title: '',
      tickangle: 45,
      showline: true,
      linecolor: 'black',
      linewidth: 1
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
