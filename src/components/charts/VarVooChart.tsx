import React, { useState, useEffect } from 'react';
import { PlotlyChart } from './PlotlyChart';
import { frontendCache } from '../../lib/cache';

interface VarVooChartProps {
  carteira: string;
  inicio?: string;
  fim?: string;
}

interface ApiData {
  var: Record<string, number>;
  voo: Record<string, number>;
  nivel_confianca: number;
  janela_amostral: number;
  periodo: number;
}

export function VarVooChart({ carteira, inicio, fim }: VarVooChartProps) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!inicio || !fim) {
        setError('Período não especificado');
        setLoading(false);
        return;
      }

      try {
        // Check cache first
        const cacheKey = frontendCache.generateKey(`/api/portfolio/visualizations/var-voo/${inicio}/${fim}`, { carteira });
        const cachedData = frontendCache.get<ApiData>(cacheKey);
        
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8000/api/portfolio/visualizations/var-voo/${inicio}/${fim}?carteira=${carteira}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        frontendCache.set(cacheKey, result);
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados de VaR/VoO:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteira, inicio, fim]);

  if (loading) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Carregando dados...' }}
        title="Risco x Oportunidade (VaR x VoO)"
        description="Carregando dados..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Risco x Oportunidade (VaR x VoO)"
        description={`Erro ao carregar dados: ${error}`}
      />
    );
  }

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

  // Preparar dados para Plotly - EXATO do notebook
  const ativos = Object.keys(data.var);

  // EXATO do notebook: ordenar por diferencial (VoO + VaR)
  const ativosOrdenados = ativos
    .map(ativo => ({
      ativo,
      var: data.var[ativo],
      voo: data.voo[ativo],
      diferencial: data.voo[ativo] + data.var[ativo] // EXATO: x[2] + x[1] (VoO + VaR)
    }))
    .sort((a, b) => b.diferencial - a.diferencial); // EXATO: reverse=True

  // Desempacotar após ordenação (como no notebook)
  const ativosList = ativosOrdenados.map(item => item.ativo);
  const varValues = ativosOrdenados.map(item => item.var);
  const vooValues = ativosOrdenados.map(item => item.voo);

  // EXATO do notebook: go.Bar para VaR
  const traceVar = {
    x: ativosList,
    y: varValues,
    type: 'bar',
    name: 'VaR',
    marker_color: 'rgb(255, 99, 71)', // EXATO: marker_color='rgb(255, 99, 71)'
    hoverinfo: 'y', // EXATO: hoverinfo='y'
    hovertemplate: '<b>VaR</b>: %{y:.2f}%<extra></extra>' // EXATO: sem <br>%{x}:
  };

  // EXATO do notebook: go.Bar para VoO
  const traceVoo = {
    x: ativosList,
    y: vooValues,
    type: 'bar',
    name: 'VoO',
    marker_color: 'rgb(50, 205, 50)', // EXATO: marker_color='rgb(50, 205, 50)'
    hoverinfo: 'y', // EXATO: hoverinfo='y'
    hovertemplate: '<b>VoO</b>: %{y:.2f}%<extra></extra>' // EXATO: sem <br>%{x}:
  };

  // EXATO do notebook: min(min(var_values), min(voo_values)) * 1.1
  const minValue = Math.min(Math.min(...varValues), Math.min(...vooValues)) * 1.1;
  // EXATO do notebook: max(max(var_values), max(voo_values)) * 1.1
  const maxValue = Math.max(Math.max(...varValues), Math.max(...vooValues)) * 1.1;

  // EXATO do notebook: fig.update_layout(...)
  const layout = {
    barmode: 'relative', // EXATO: barmode='relative'
    title: {
      text: `Risco x Oportunidade (VaR x VoO): ${carteira}`, // EXATO: f'Risco x Oportunidade (VaR x VoO): {carteira.nome}'
      x: 0.5, // EXATO: 'x': 0.5
      y: 0.95, // EXATO: 'y': 0.95
      font: {
        size: 18, // EXATO: 'size': 18
        color: 'black', // EXATO: 'color': 'black'
        family: 'Georgia' // EXATO: 'family': 'Georgia'
      }
    },
    xaxis_title: '', // EXATO: xaxis_title=''
    yaxis_title: 'Percentual (%)', // EXATO: yaxis_title='Percentual (%)'
    plot_bgcolor: 'white', // EXATO: plot_bgcolor='white'
    xaxis: {
      showline: true, // EXATO: showline=True
      showgrid: false, // EXATO: showgrid=False
      linecolor: 'black', // EXATO: linecolor='black'
      linewidth: 2 // EXATO: linewidth=2
    },
    yaxis: {
      showline: true, // EXATO: showline=True
      showgrid: true, // EXATO: showgrid=True
      gridcolor: 'lightgray', // EXATO: gridcolor='lightgray'
      linecolor: 'black', // EXATO: linecolor='black'
      linewidth: 2, // EXATO: linewidth=2
      zeroline: true, // EXATO: zeroline=True
      zerolinewidth: 2, // EXATO: zerolinewidth=2
      zerolinecolor: 'black', // EXATO: zerolinecolor='black'
      range: [minValue, maxValue] // EXATO: range=[min_value, max_value]
    },
    font: {
      family: 'Georgia', // EXATO: family='Georgia'
      size: 15, // EXATO: size=15
      color: 'black' // EXATO: color='black'
    },
    annotations: [{
      x: 0.01, // EXATO: x=0.01
      y: 1.2, // EXATO: y=1.2
      showarrow: false, // EXATO: showarrow=False
      text: `<br>Janela Amostral: ${data.janela_amostral} dias<br>` +
            `Nível de Confiança: ${data.nivel_confianca}%<br>` +
            `Período: ${data.periodo} dias`, // EXATO: text com os parâmetros
      xref: "paper", // EXATO: xref="paper"
      yref: "paper", // EXATO: yref="paper"
      align: "left", // EXATO: align="left"
      bordercolor: "black", // EXATO: bordercolor="black"
      borderwidth: 1, // EXATO: borderwidth=1
      borderpad: 4, // EXATO: borderpad=4
      bgcolor: "white", // EXATO: bgcolor="white"
      font: {
        family: "Georgia", // EXATO: family="Georgia"
        size: 12, // EXATO: size=12
        color: "black" // EXATO: color="black"
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
