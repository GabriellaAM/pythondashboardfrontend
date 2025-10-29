import React from 'react';
import { PlotlyChart } from './PlotlyChart';

interface AlocacoesChartProps {
  data: {
    data: any[];
    columns: string[];
    index: string[];
  };
  carteira: string;
  inicio?: string;
  fim?: string;
  segmentar?: boolean;
  realAloc?: boolean;
}

export function AlocacoesChart({ 
  data, 
  carteira, 
  inicio, 
  fim, 
  segmentar = false, 
  realAloc = false 
}: AlocacoesChartProps) {
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
      y: data.data.map(row => (row[column] || 0) * 100), // ✅ Converter para porcentagem para exibição (0.0040 -> 0.40)
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
    <PlotlyChart
      data={traces}
      layout={layout}
      title="Alocação de Ativos ao Longo do Tempo"
      description={`Evolução das alocações da carteira ${carteira} ao longo do tempo`}
    />
  );
}
