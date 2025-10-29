import React from 'react';
import { PlotlyChart } from './PlotlyChart';

interface CarteirasChartProps {
  data: {
    data: any[];
    columns: string[];
    index: string[];
  };
  brl?: boolean;
  inicio?: string;
  fim?: string;
}

export function CarteirasChart({ data, brl = false, inicio, fim }: CarteirasChartProps) {
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

  // Preparar dados para Plotly
  const traces = data.columns.map((column, index) => {
    const color = getColorForAsset(column);
    return {
      x: data.index,
      y: data.data.map(row => row[column] * 100), // ✅ Converter para porcentagem para exibição (0.0040 -> 0.40)
      type: 'scatter',
      mode: 'lines',
      name: column,
      line: {
        color: color,
        width: 2,
        shape: 'spline' // Linhas suaves como no notebook
      },
      hovertemplate: `<b>%{fullData.name}</b><br>` +
        `Data: %{x}<br>` +
        `Rentabilidade: %{y:.2f}%<extra></extra>`
    };
  });

  const layout = {
    title: {
      text: brl ? 'Rentabilidade das Carteiras (BRL)' : 'Rentabilidade Carteiras (USD)',
      x: 0.055,
      y: 0.97,
      font: { size: 18, color: 'black', family: 'Georgia' }
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
    '#17becf'  // Ciano
  ];
  
  // Usar hash do nome do ativo para escolher cor consistente
  let hash = 0;
  for (let i = 0; i < asset.length; i++) {
    hash = asset.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
