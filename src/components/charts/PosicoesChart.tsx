import React, { useState, useEffect, useMemo } from 'react';
import { PlotlyChart } from './PlotlyChart';

interface PosicoesChartProps {
  carteira: string;
}

interface ApiData {
  data: any[];
  columns: string[];
}

export function PosicoesChart({ carteira }: PosicoesChartProps) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8000/api/portfolio/visualizations/posicoes-timeline?carteira=${carteira}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados de posições:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteira]);

  // Preparar dados para Plotly - Gantt Chart (EXATO do notebook usando px.timeline)
  // Como Plotly.js não tem px.timeline, usamos barras horizontais
  const traces = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) {
      return [];
    }

    // Agrupar por ativo para criar barras horizontais
    const ativosMap = new Map<string, Array<{ start: Date, end: Date }>>();
    
    data.data.forEach((posicao: any) => {
      const ativo = posicao.Ativo || posicao.ativo;
      const startDate = new Date(posicao.Start || posicao.start);
      const endDate = new Date(posicao.Finish || posicao.finish);
      
      if (!ativosMap.has(ativo)) {
        ativosMap.set(ativo, []);
      }
      
      ativosMap.get(ativo)!.push({ start: startDate, end: endDate });
    });

    // Criar traces para cada período de cada ativo usando barras horizontais
    const tracesList: any[] = [];
    const ativos = Array.from(ativosMap.keys());
    
    ativos.forEach((ativo, ativoIndex) => {
      const periodos = ativosMap.get(ativo)!;
      
      periodos.forEach((periodo, periodIndex) => {
        const start = periodo.start;
        const end = periodo.end;
        const duration = end.getTime() - start.getTime();
        
        // Para Gantt chart, usamos barras horizontais
        // x0 = start, x1 = end, y = ativo
        tracesList.push({
          x: [start, end],
          y: [ativo, ativo],
          type: 'scatter',
          mode: 'lines',
          name: ativo,
          line: {
            color: `hsl(${(ativoIndex * 137.5) % 360}, 70%, 50%)`,
            width: 20
          },
          showlegend: false,
          hovertemplate: `<b>${ativo}</b><br>` +
            `Início: ${start.toLocaleDateString()}<br>` +
            `Fim: ${end.toLocaleDateString()}<extra></extra>`
        });
      });
    });

    return tracesList;
  }, [data]);

  const layout = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) {
      return {};
    }

    // Contar ativos únicos para calcular altura
    const ativosUnicos = new Set(data.data.map((posicao: any) => posicao.Ativo || posicao.ativo));
    const alturaPorAtivo = 30;
    const alturaTotal = alturaPorAtivo * ativosUnicos.size;

    return {
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
      height: Math.max(400, alturaTotal),
      showlegend: false,
      plot_bgcolor: 'white',
      font: {
        family: 'Georgia',
        size: 15,
        color: 'black'
      }
    };
  }, [data]);

  if (loading) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Carregando dados...' }}
        title="Posições dos Ativos ao Longo do Tempo"
        description="Carregando dados da API..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Posições dos Ativos ao Longo do Tempo"
        description="Erro ao carregar dados"
      />
    );
  }

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

  return (
    <PlotlyChart
      data={traces}
      layout={layout}
      title="Posições dos Ativos ao Longo do Tempo"
      description={`Timeline das posições dos ativos da carteira ${carteira}`}
    />
  );
}
