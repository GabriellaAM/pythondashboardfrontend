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
  const ativosOrdenados = ativos
    .map(ativo => ({
      ativo,
      valor: (valores[ativo] || 0) * 100 // Converter para porcentagem
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
    hovertemplate: '<b>%{x}</b><br>Rentabilidade: %{y:.2f}%<extra></extra>',
    hoverlabel: {
      bgcolor: 'white',
      font_size: 12,
      font_family: 'Georgia'
    },
    showlegend: false
  };

  const layout = {
    title: {
      text: `Performance Acumulada: ${carteira} vs. Ativos`,
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
      title: 'Rentabilidade Acumulada (%)',
      showline: true,
      showgrid: true,
      gridcolor: 'lightgray',
      linecolor: 'white',
      linewidth: 2,
      zerolinecolor: 'lightgray'
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
