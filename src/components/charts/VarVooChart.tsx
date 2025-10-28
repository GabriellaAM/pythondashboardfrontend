import React from 'react';
import { PlotlyChart } from './PlotlyChart';

interface VarVooChartProps {
  data: {
    var: Record<string, number>;
    voo: Record<string, number>;
    nivel_confianca: number;
    janela_amostral: number;
    periodo: number;
  };
  carteira: string;
}

export function VarVooChart({ data, carteira }: VarVooChartProps) {
  if (!data || !data.var || !data.voo) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Risco x Oportunidade (VaR x VoO)"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  // Preparar dados para Plotly - gráfico de barras lado a lado
  const ativos = Object.keys(data.var);
  
  // Ordenar por diferença entre VoO e VaR (ordem decrescente de diferencial)
  const ativosOrdenados = ativos
    .map(ativo => ({
      ativo,
      var: data.var[ativo],
      voo: data.voo[ativo],
      diferencial: data.voo[ativo] + data.var[ativo] // VoO - VaR (positivo = melhor)
    }))
    .sort((a, b) => b.diferencial - a.diferencial);

  const traceVar = {
    x: ativosOrdenados.map(item => item.ativo),
    y: ativosOrdenados.map(item => item.var),
    type: 'bar',
    name: 'VaR',
    marker: {
      color: 'rgb(255, 99, 71)'
    },
    hovertemplate: '<b>VaR</b><br>%{x}: %{y:.2f}%<extra></extra>'
  };

  const traceVoo = {
    x: ativosOrdenados.map(item => item.ativo),
    y: ativosOrdenados.map(item => item.voo),
    type: 'bar',
    name: 'VoO',
    marker: {
      color: 'rgb(50, 205, 50)'
    },
    hovertemplate: '<b>VoO</b><br>%{x}: %{y:.2f}%<extra></extra>'
  };

  // Calcular range do eixo Y
  const allValues = [...Object.values(data.var), ...Object.values(data.voo)];
  const minValue = Math.min(...allValues) * 1.1;
  const maxValue = Math.max(...allValues) * 1.1;

  const layout = {
    title: {
      text: `Risco x Oportunidade (VaR x VoO): ${carteira}`,
      x: 0.5,
      y: 0.95,
      font: { size: 18, color: 'black', family: 'Georgia' }
    },
    xaxis: {
      title: '',
      showline: true,
      showgrid: false,
      linecolor: 'black',
      linewidth: 2
    },
    yaxis: {
      title: 'Percentual (%)',
      showline: true,
      showgrid: true,
      gridcolor: 'lightgray',
      linecolor: 'black',
      linewidth: 2,
      zeroline: true,
      zerolinewidth: 2,
      zerolinecolor: 'black',
      range: [minValue, maxValue]
    },
    barmode: 'relative',
    annotations: [{
      x: 0.01,
      y: 1.2,
      showarrow: false,
      text: `<br>Janela Amostral: ${data.janela_amostral} dias<br>` +
            `Nível de Confiança: ${data.nivel_confianca}%<br>` +
            `Período: ${data.periodo} dias`,
      xref: "paper",
      yref: "paper",
      align: "left",
      bordercolor: "black",
      borderwidth: 1,
      borderpad: 4,
      bgcolor: "white",
      font: {
        family: "Georgia",
        size: 12,
        color: "black"
      }
    }]
  };

  return (
    <PlotlyChart
      data={[traceVar, traceVoo]}
      layout={layout}
      title="Risco x Oportunidade (VaR x VoO)"
      description={`Análise de risco e oportunidade para ${carteira}`}
    />
  );
}
