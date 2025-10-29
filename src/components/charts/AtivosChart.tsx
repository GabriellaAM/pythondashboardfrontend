import React, { useState, useEffect } from 'react';
import { PlotlyChart } from './PlotlyChart';

interface AtivosChartProps {
  carteira: string;
  inicio?: string;
  fim?: string;
}

interface ApiData {
  data: any[];
  columns: string[];
  index: string[];
}

export function AtivosChart({ carteira, inicio, fim }: AtivosChartProps) {
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
        setLoading(true);
        setError(null);
        
        // Usar a nova API limpa
        const response = await fetch(
          `http://localhost:8000/api/clean/carteira-vs-ativos/${inicio}/${fim}?carteira=${carteira}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
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
        title="Performance Individual dos Ativos"
        description="Carregando dados da API..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Performance Individual dos Ativos"
        description="Erro ao carregar dados"
      />
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Performance Individual dos Ativos"
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
      valor: (valores[ativo] || 0) * 100 // Converter para porcentagem para exibição (0.0040 -> 0.40%)
    }))
    .sort((a, b) => a.valor - b.valor);

  const trace = {
    x: ativosOrdenados.map(item => item.ativo),
    y: ativosOrdenados.map(item => item.valor),
    type: 'bar',
    marker: {
      color: ativosOrdenados.map(item => 
        item.valor < 0 ? 'rgb(255, 99, 71)' : 'rgb(50, 205, 50)'
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
      text: `${carteira}: performance acumulada dos ativos`,
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
      title="Performance Individual dos Ativos"
      description={`Performance acumulada dos ativos da carteira ${carteira}`}
    />
  );
}
