import React from 'react';
import { PlotlyChart } from './PlotlyChart';

interface RebalanceamentoChartProps {
  data: {
    diario: {
      data: any[];
      columns: string[];
      index: string[];
    };
    alertas: {
      data: any[];
      columns: string[];
      index: string[];
    };
  };
  carteira: string;
  inicio?: string;
  fim?: string;
}

export function RebalanceamentoChart({ data, carteira, inicio, fim }: RebalanceamentoChartProps) {
  if (!data || !data.diario || !data.alertas) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Rebalanceamento Diário vs. Alertas"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  // Preparar dados para Plotly
  const traces = [];

  // Rebalanceamento diário
  if (data.diario.data && data.diario.data.length > 0) {
    data.diario.columns.forEach((column, index) => {
      traces.push({
        x: data.diario.index,
        y: data.diario.data.map(row => row[column] * 100), // Converter para porcentagem
        type: 'scatter',
        mode: 'lines',
        name: `${column} (Diário)`,
        line: {
          color: '#8884d8',
          width: 2,
          shape: 'spline'
        },
        hovertemplate: `<b>%{fullData.name}</b><br>` +
          `Data: %{x}<br>` +
          `Rentabilidade: %{y:.2f}%<extra></extra>`
      });
    });
  }

  // Rebalanceamento por alertas
  if (data.alertas.data && data.alertas.data.length > 0) {
    data.alertas.columns.forEach((column, index) => {
      traces.push({
        x: data.alertas.index,
        y: data.alertas.data.map(row => row[column] * 100), // Converter para porcentagem
        type: 'scatter',
        mode: 'lines',
        name: `${column} (Alertas)`,
        line: {
          color: '#82ca9d',
          width: 2,
          shape: 'spline'
        },
        hovertemplate: `<b>%{fullData.name}</b><br>` +
          `Data: %{x}<br>` +
          `Rentabilidade: %{y:.2f}%<extra></extra>`
      });
    });
  }

  const layout = {
    title: {
      text: 'Rebalanceamento diário vs. Rebalanceamento nos alertas',
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
      title="Rebalanceamento Diário vs. Alertas"
      description={`Comparação entre rebalanceamento diário e por alertas para ${carteira}`}
    />
  );
}
