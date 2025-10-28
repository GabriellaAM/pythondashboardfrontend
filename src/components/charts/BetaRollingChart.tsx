import React from 'react';
import { PlotlyChart } from './PlotlyChart';

interface BetaRollingChartProps {
  data: {
    data: any[];
    columns: string[];
    index: string[];
  };
  carteira: string;
  inicio?: string;
  fim?: string;
  janela?: number;
}

export function BetaRollingChart({ 
  data, 
  carteira, 
  inicio, 
  fim, 
  janela = 30 
}: BetaRollingChartProps) {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Beta Rolling vs BTC"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  // Preparar dados para Plotly - gráfico de linha
  const traces = data.columns.map((column, index) => {
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];
    
    return {
      x: data.index,
      y: data.data.map(row => row[column] || 0),
      type: 'scatter',
      mode: 'lines',
      name: column,
      line: {
        color: colors[index % colors.length],
        width: 2
      },
      hovertemplate: `<b>${column}</b><br>` +
        `Data: %{x}<br>` +
        `Beta: %{y:.4f}<extra></extra>`
    };
  });

  const layout = {
    title: {
      text: `Beta Rolling vs BTC - ${carteira}`,
      x: 0.5,
      y: 0.95,
      font: { size: 16, color: 'black', family: 'Georgia' }
    },
    xaxis: {
      title: 'Data',
      showline: true,
      showgrid: true,
      gridcolor: 'lightgray',
      linecolor: 'black',
      linewidth: 2
    },
    yaxis: {
      title: 'Beta',
      showline: true,
      showgrid: true,
      gridcolor: 'lightgray',
      linecolor: 'black',
      linewidth: 2,
      zeroline: true,
      zerolinecolor: 'black',
      zerolinewidth: 1
    },
    hovermode: 'x unified',
    annotations: inicio && fim ? [{
      text: `Período: ${inicio} à ${fim} | Janela: ${janela} dias`,
      xref: 'paper',
      yref: 'paper',
      x: 0.5,
      y: 1.1,
      showarrow: false,
      font: {
        family: 'Georgia',
        size: 12,
        color: 'gray'
      }
    }] : []
  };

  return (
    <PlotlyChart
      data={traces}
      layout={layout}
      title="Beta Rolling vs BTC"
      description={`Beta rolling da carteira ${carteira} em relação ao BTC`}
    />
  );
}
