import React from 'react';
import { PlotlyChart } from './PlotlyChart';

interface DecomposicaoChartProps {
  data: {
    data: any[];
    columns: string[];
    index: string[];
  };
  carteira: string;
  inicio?: string;
  fim?: string;
  segmentar?: boolean;
  acumular?: boolean;
}

export function DecomposicaoChart({ 
  data, 
  carteira, 
  inicio, 
  fim, 
  segmentar = true, 
  acumular = false 
}: DecomposicaoChartProps) {
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

  // Preparar dados para Plotly - gráfico de barras empilhadas
  const traces = data.columns.map((column, index) => {
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
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
        `Contribuição: %{y:.4f}%<extra></extra>`,
      hoverlabel: {
        bgcolor: 'white',
        font_size: 12,
        font_family: 'Georgia'
      },
      showlegend: true
    };
  });

  const yTitle = acumular 
    ? 'Retornos Ponderados e Acumulados (%)' 
    : 'Retornos Diários Ponderados (%)';

  const layout = {
    title: {
      text: `Decomposição de Retorno (USD): ${carteira}`,
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
    barmode: 'relative',
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
      title="Decomposição de Retorno"
      description={`Contribuição de cada ativo para o retorno da carteira ${carteira}`}
    />
  );
}
