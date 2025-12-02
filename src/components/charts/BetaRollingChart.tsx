import React, { useState, useEffect, useMemo } from 'react';
import { PlotlyChart } from './PlotlyChart';
import { frontendCache } from '../../lib/cache';

interface BetaRollingChartProps {
  carteira: string;
  inicio?: string;
  fim?: string;
  janela?: number;
}

interface ApiData {
  betas: {
    data: any[];
    columns: string[];
    index: string[];
  };
  historical_mean: {
    data: any[];
    columns: string[];
    index: string[];
  };
  returns_difference: {
    data: any[];
    columns: string[];
    index: string[];
  };
}

export function BetaRollingChart({ 
  carteira, 
  inicio, 
  fim, 
  janela = 30 
}: BetaRollingChartProps) {
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
        const cacheKey = frontendCache.generateKey(`/api/portfolio/visualizations/beta-rolling/${inicio}/${fim}`, { 
          carteira, 
          janela 
        });
        const cachedData = frontendCache.get<ApiData>(cacheKey);
        
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8000/api/portfolio/visualizations/beta-rolling/${inicio}/${fim}?carteira=${carteira}&janela=${janela}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        frontendCache.set(cacheKey, result);
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados de beta rolling:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteira, inicio, fim, janela]);
  // EXATO do notebook: plot customizado com matplotlib convertido para Plotly
  const traces = useMemo(() => {
    if (!data || !data.betas || !data.betas.data || data.betas.data.length === 0) {
      return [];
    }

    const result: any[] = [];

    // EXATO do notebook: plt.plot(betas.index, betas, color='grey', alpha=0.05)
    // Plotar todas as linhas de beta em cinza com opacity baixa (shading effect)
    if (data.betas.columns && data.betas.columns.length > 0) {
      data.betas.columns.forEach((column) => {
        result.push({
          x: data.betas.index,
          y: data.betas.data.map(row => {
            const value = row?.[column];
            if (value === null || value === undefined) return null;
            const num = typeof value === 'number' ? value : Number(value);
            if (!isFinite(num)) return null;
            return num;
          }),
          type: 'scatter',
          mode: 'lines',
          name: column,
          line: {
            color: 'grey',
            width: 1
          },
          opacity: 0.05, // EXATO: alpha=0.05
          showlegend: false,
          hovertemplate: `<b>${column}</b><br>Beta: %{y:.4f}<extra></extra>`
        });
      });
    }

    // EXATO do notebook: plt.plot(historical_mean.index, historical_mean, color='red', linestyle='--', label='Média Móvel Mensal')
    // Plotar média móvel mensal da carteira em vermelho tracejado
    if (data.historical_mean && data.historical_mean.data && data.historical_mean.data.length > 0 && data.historical_mean.columns.length > 0) {
      const meanColumn = data.historical_mean.columns[0];
      result.push({
        x: data.historical_mean.index,
        y: data.historical_mean.data.map(row => {
          const value = row?.[meanColumn];
          if (value === null || value === undefined) return null;
          const num = typeof value === 'number' ? value : Number(value);
          if (!isFinite(num)) return null;
          return num;
        }),
        type: 'scatter',
        mode: 'lines',
        name: 'Média Móvel Mensal',
        line: {
          color: 'red',
          width: 2,
          dash: 'dash' // EXATO: linestyle='--'
        },
        hovertemplate: '<b>Média Móvel Mensal</b><br>Beta: %{y:.4f}<extra></extra>'
      });
    }

    // EXATO do notebook: plt.axhline(y=1, color='black', linestyle='--', linewidth=1)
    // Linha horizontal em y=1
    result.push({
      x: data.betas.index.length > 0 ? [data.betas.index[0], data.betas.index[data.betas.index.length - 1]] : [],
      y: [1, 1],
      type: 'scatter',
      mode: 'lines',
      name: 'y = 1',
      line: {
        color: 'black',
        width: 1,
        dash: 'dash' // EXATO: linestyle='--'
      },
      showlegend: false,
      hovertemplate: 'y = 1<extra></extra>'
    });

    // EXATO do notebook: ax2.plot(returns_difference.index, returns_difference, color='#660924', label='Return Difference (High Beta - BTC)')
    // Eixo Y secundário com diferença de retorno
    if (data.returns_difference && data.returns_difference.data && data.returns_difference.data.length > 0) {
      const diffColumn = data.returns_difference.columns[0] || 'difference';
      result.push({
        x: data.returns_difference.index,
        y: data.returns_difference.data.map(row => {
          const value = row?.[diffColumn];
          if (value === null || value === undefined) return null;
          const num = typeof value === 'number' ? value : Number(value);
          if (!isFinite(num)) return null;
          return num * 100; // Converter para porcentagem
        }),
        type: 'scatter',
        mode: 'lines',
        name: 'Return Difference (Carteira - BTC)',
        yaxis: 'y2', // Eixo Y secundário
        line: {
          color: '#660924', // EXATO: color='#660924'
          width: 2
        },
        hovertemplate: '<b>Return Difference</b><br>%{y:.2f}%<extra></extra>'
      });
    }

    return result;
  }, [data]);

  const layout = useMemo(() => {
    // EXATO do notebook: plt.title('Beta semanal da carteira High Beta com Diferença de Retorno Diário (High Beta - BTC)')
    const titulo = `Beta semanal da carteira ${carteira} com Diferença de Retorno Diário (${carteira} - BTC)`;
    
    return {
      title: {
        text: titulo,
        font: { size: 16, color: 'black', family: 'Georgia' }
      },
      xaxis: {
        title: 'Data', // EXATO: plt.xlabel('Data')
        showline: true,
        showgrid: true,
        gridcolor: 'lightgray',
        linecolor: 'black',
        linewidth: 2
      },
      yaxis: {
        title: 'Beta', // EXATO: ax.set_ylabel('Beta', color='#3F3F3F')
        showline: true,
        showgrid: true,
        gridcolor: 'lightgray',
        linecolor: '#3F3F3F', // EXATO: color='#3F3F3F'
        linewidth: 2,
        zeroline: true,
        zerolinecolor: 'black',
        zerolinewidth: 1,
        range: [-3, 3], // EXATO: ax.set_ylim(-3, 3)
        tickcolor: '#3F3F3F' // EXATO: ax.tick_params(axis='y', labelcolor='#3F3F3F')
      },
      yaxis2: {
        title: 'Return Difference (%)', // EXATO: ax2.set_ylabel('Return Difference (%)', color='#660924')
        overlaying: 'y',
        side: 'right',
        showline: true,
        linecolor: '#660924', // EXATO: color='#660924'
        linewidth: 2,
        tickcolor: '#660924', // EXATO: ax2.tick_params(axis='y', labelcolor='#660924')
        tickformat: '.0%' // EXATO: ax2.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x * 100:.0f}%'))
      },
      hovermode: 'x unified',
      legend: {
        x: 0.01, // EXATO: ax.legend(loc='upper left')
        y: 0.99,
        bgcolor: 'rgba(255, 255, 255, 0.8)'
      },
      plot_bgcolor: 'white',
      font: {
        family: 'Georgia',
        size: 12,
        color: 'black'
      }
    };
  }, [carteira]);

  if (loading) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Carregando dados...' }}
        title="Beta Rolling vs BTC"
        description="Carregando dados da API..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Beta Rolling vs BTC"
        description="Erro ao carregar dados"
      />
    );
  }

  if (!data || !data.betas || !data.betas.data || data.betas.data.length === 0) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Nenhum dado disponível' }}
        title="Beta Rolling vs BTC"
        description="Dados não disponíveis para o período selecionado"
      />
    );
  }

  return (
    <PlotlyChart
      data={traces}
      layout={layout}
      title="Beta Rolling vs BTC"
      description={`Beta rolling da carteira ${carteira} com diferença de retorno diário`}
    />
  );
}
