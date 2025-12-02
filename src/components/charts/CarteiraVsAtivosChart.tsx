import React from 'react';
import { PlotlyChart } from './PlotlyChart';

interface CarteiraVsAtivosChartProps {
  data: {
    data: any[];
    columns: string[];
    index: string[];
  };
  carteira: string;
  inicio?: string;
  fim?: string;
}

export function CarteiraVsAtivosChart({ data, carteira, inicio, fim }: CarteiraVsAtivosChartProps) {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Performance Acumulada: Carteira vs. Ativos"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  // Preparar dados para Plotly - gráfico de barras como no notebook
  const ativos = data.columns;
  const valores = data.data[data.data.length - 1]; // Última linha (performance acumulada)
  
  // Ordenar por performance
  // Valores já vêm em porcentagem da API (multiplicados por 100 no backend)
  const ativosOrdenados = ativos
    .map(ativo => ({
      ativo,
      valor: valores[ativo] || 0 // Valores já estão em porcentagem (ex: 0.40 = 0.40%)
    }))
    .sort((a, b) => a.valor - b.valor);

  const trace = {
    x: ativosOrdenados.map(item => item.ativo),
    y: ativosOrdenados.map(item => item.valor),
    type: 'bar',
    marker: {
      color: ativosOrdenados.map(item => 
        item.ativo === carteira ? 'rgb(187,13,49)' : 'gray'
      ),
      line: {
        color: 'rgb(0,0,0,0)',
        width: 0.1
      }
    },
    hoverinfo: 'y', // EXATO do notebook
    hovertemplate: '<b>%{x}</b>: %{y:.2f}%<extra></extra>', // EXATO do notebook: sem <br>Rentabilidade:
    hoverlabel: {
      bgcolor: 'white',
      font_size: 12,
      font_family: 'Georgia'
    },
    showlegend: false
  };

  const layout = {
    margin: { t: 60 }, // EXATO do notebook: margin=dict(t=60)
    title: {
      text: `Performance Acumulada: ${carteira} vs. Ativos`,
      x: 0.055,
      y: 0.97,
      font: { size: 18, color: 'black', family: 'Georgia' }
    },
    xaxis_title: '', // EXATO do notebook: xaxis_title=''
    yaxis_title: 'Rentabilidade Acumulada (%)', // EXATO do notebook
    plot_bgcolor: 'white', // EXATO do notebook: plot_bgcolor='white'
    xaxis: {
      title: '',
      showline: true,
      showgrid: false,
      linecolor: 'white',
      linewidth: 2
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
    font: { // EXATO do notebook: font=dict(family='Georgia', size=15, color='black')
      family: 'Georgia',
      size: 15,
      color: 'black'
    },
    annotations: inicio && fim ? [{ // EXATO do notebook
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
      data={[trace]}
      layout={layout}
      title="Performance Acumulada: Carteira vs. Ativos"
      description={`Comparação entre a carteira ${carteira} e seus ativos individuais`}
    />
  );
}
