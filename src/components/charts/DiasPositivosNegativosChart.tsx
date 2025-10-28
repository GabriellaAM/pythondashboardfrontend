import React from 'react';
import { PlotlyChart } from './PlotlyChart';

interface DiasPositivosNegativosChartProps {
  data: {
    pos_percents: Record<string, number>;
    neg_percents: Record<string, number>;
    fora_da_carteira_percents: Record<string, number>;
  };
  carteira: string;
  inicio?: string;
  fim?: string;
  segmentar?: boolean;
}

export function DiasPositivosNegativosChart({ 
  data, 
  carteira, 
  inicio, 
  fim, 
  segmentar = false 
}: DiasPositivosNegativosChartProps) {
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
      title="Percentual de Dias Positivos/Negativos"
      description={`Análise de dias positivos e negativos para ${carteira}`}
    />
  );
}
