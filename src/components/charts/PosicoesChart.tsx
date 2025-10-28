import React from 'react';
import { PlotlyChart } from './PlotlyChart';

interface PosicoesChartProps {
  data: {
    data: any[];
    columns: string[];
  };
  carteira: string;
}

export function PosicoesChart({ data, carteira }: PosicoesChartProps) {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Posições dos Ativos ao Longo do Tempo"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  // Preparar dados para Plotly - Gantt Chart
  const traces = data.data.map((posicao, index) => {
    const startDate = new Date(posicao.Start || posicao.start);
    const endDate = new Date(posicao.Finish || posicao.finish);
    
    return {
      x: [startDate, endDate],
      y: [posicao.Ativo || posicao.ativo, posicao.Ativo || posicao.ativo],
      type: 'scatter',
      mode: 'lines',
      name: posicao.Ativo || posicao.ativo,
      line: {
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`, // Cores diferentes para cada ativo
        width: 20
      },
      showlegend: false,
      hovertemplate: `<b>${posicao.Ativo || posicao.ativo}</b><br>` +
        `Início: ${startDate.toLocaleDateString()}<br>` +
        `Fim: ${endDate.toLocaleDateString()}<extra></extra>`
    };
  });

  const layout = {
    title: {
      text: 'Posições dos Ativos ao Longo do Tempo',
      font: { size: 18, color: 'black', family: 'Georgia' }
    },
    xaxis: {
      title: 'Data',
      showline: true,
      showgrid: false,
      linecolor: 'black',
      linewidth: 2
    },
    yaxis: {
      title: '',
      showgrid: true,
      gridcolor: 'lightgray',
      showline: true,
      linecolor: 'black',
      linewidth: 2
    },
    height: Math.max(400, data.data.length * 30), // Altura dinâmica baseada no número de ativos
    showlegend: false
  };

  return (
    <PlotlyChart
      data={traces}
      layout={layout}
      title="Posições dos Ativos ao Longo do Tempo"
      description={`Timeline das posições dos ativos da carteira ${carteira}`}
    />
  );
}
