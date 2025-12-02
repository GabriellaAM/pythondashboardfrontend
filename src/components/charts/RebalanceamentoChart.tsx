import React, { useState, useEffect, useMemo } from 'react';
import { PlotlyChart } from './PlotlyChart';
import { frontendCache } from '../../lib/cache';

interface RebalanceamentoChartProps {
  carteira: string;
  inicio?: string;
  fim?: string;
}

interface ApiData {
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
}

export function RebalanceamentoChart({ carteira, inicio, fim }: RebalanceamentoChartProps) {
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
        const cacheKey = frontendCache.generateKey(`/api/portfolio/visualizations/rebalanceamento/${inicio}/${fim}`, { carteira });
        const cachedData = frontendCache.get<ApiData>(cacheKey);
        
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8000/api/portfolio/visualizations/rebalanceamento/${inicio}/${fim}?carteira=${carteira}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        frontendCache.set(cacheKey, result);
        setData(result);
        
      } catch (err) {
        console.error('Erro ao buscar dados de rebalanceamento:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carteira, inicio, fim]);

  // Preparar dados para Plotly - EXATO do notebook
  // Seguindo a mesma abordagem do CarteirasChart: dados já vêm processados da API
  // No notebook:
  // df = carteira.calcular_retornos_acumulados(inicio,fim,ponderar=True)
  // df = df[[carteira.nome]]
  // df_ajustado = carteira.df_posicao_balanceada_alerta[carteira.nome]
  // df_ajustado = df_ajustado[inicio:fim].pct_change().fillna(0)
  // df_ajustado = (1+df_ajustado).cumprod()-1
  // df_ajustado = df_ajustado.to_frame(name=carteira.nome + ' (Adj.)')
  // df = pd.concat([df, df_ajustado], axis=1)
  // df = df * 100  # Multiplicado no backend
  // for col in df.columns:
  const traces = useMemo(() => {
    if (!data || !data.diario || !data.alertas) {
      return [];
    }

    const result: any[] = [];

    // Processar dados diário (primeira coluna: carteira.nome)
    if (data.diario.data && data.diario.data.length > 0 && data.diario.columns.length > 0) {
      const colName = data.diario.columns[0] || carteira;
      result.push({
        x: data.diario.index,
        y: data.diario.data.map(row => {
          const value = row?.[colName];
          if (value === null || value === undefined) return null;
          const num = typeof value === 'number' ? value : Number(value);
          if (!isFinite(num)) return null;
          // Valores já vêm em porcentagem da API (multiplicados por 100 no backend)
          return num;
        }),
        type: 'scatter',
        mode: 'lines',
        name: colName, // EXATO: name=col
        hovertemplate: '%{y:.2f}%', // EXATO do notebook: hovertemplate='%{y:.2f}%'
        line_shape: 'spline', // EXATO: line_shape='spline'
        line: {
          width: 2 // EXATO: line=dict(width=2)
        }
        // NOTA: No notebook não especifica cores, então usa cores padrão do Plotly
      });
    }

    // Processar dados alertas (segunda coluna: carteira.nome + ' (Adj.)')
    if (data.alertas.data && data.alertas.data.length > 0 && data.alertas.columns.length > 0) {
      const adjustedName = data.alertas.columns[0] || `${carteira} (Adj.)`;
      result.push({
        x: data.alertas.index,
        y: data.alertas.data.map(row => {
          const value = row?.[adjustedName];
          if (value === null || value === undefined) return null;
          const num = typeof value === 'number' ? value : Number(value);
          if (!isFinite(num)) return null;
          // Valores já vêm em porcentagem da API (multiplicados por 100 no backend)
          return num;
        }),
        type: 'scatter',
        mode: 'lines',
        name: adjustedName, // EXATO: name=col
        hovertemplate: '%{y:.2f}%', // EXATO do notebook: hovertemplate='%{y:.2f}%'
        line_shape: 'spline', // EXATO: line_shape='spline'
        line: {
          width: 2 // EXATO: line=dict(width=2)
        }
        // NOTA: No notebook não especifica cores, então usa cores padrão do Plotly
      });
    }

    return result;
  }, [data, carteira]);

  const layout = useMemo(() => {
    const titulo = 'Rebalanceamento diário vs. Rebalanceamento nos alertas';
    
    return {
    margin: { t: 60 }, // EXATO: margin=dict(t=60)
    title: {
      text: titulo,
      x: 0.055, // EXATO: 'x': 0.055
      y: 0.97, // EXATO: 'y': 0.97
      font: {
        size: 18, // EXATO: 'size': 18
        color: 'black', // EXATO: 'color': 'black'
        family: 'Georgia' // EXATO: 'family': 'Georgia'
      }
    },
    xaxis_title: '', // EXATO: xaxis_title=''
    yaxis_title: 'Rentabilidade Acumulada (%)', // EXATO: yaxis_title='Rentabilidade Acumulada (%)'
    legend_title: '', // EXATO: legend_title=""
    hovermode: 'x unified', // EXATO: hovermode='x unified'
    plot_bgcolor: 'white', // EXATO: plot_bgcolor='white'
    xaxis: {
      showline: true, // EXATO: showline=True
      showgrid: true, // EXATO: showgrid=True
      gridcolor: 'lightgray', // EXATO: gridcolor='lightgray'
      linecolor: 'white', // EXATO: linecolor='white'
      linewidth: 2, // EXATO: linewidth=2
      zerolinecolor: 'lightgray' // EXATO: zerolinecolor='lightgray'
    },
    yaxis: {
      showline: true, // EXATO: showline=True
      showgrid: true, // EXATO: showgrid=True
      gridcolor: 'lightgray', // EXATO: gridcolor='lightgray'
      linecolor: 'white', // EXATO: linecolor='white'
      linewidth: 2, // EXATO: linewidth=2
      zerolinecolor: 'lightgray' // EXATO: zerolinecolor='lightgray'
    },
    legend: {
      orientation: 'h', // EXATO: orientation='h'
      yanchor: 'bottom', // EXATO: yanchor='bottom'
      y: 1.02, // EXATO: y=1.02
      xanchor: 'right', // EXATO: xanchor='right'
      x: 1 // EXATO: x=1
    },
    font: {
      family: 'Georgia', // EXATO: family='Georgia'
      size: 15, // EXATO: size=15
      color: 'black' // EXATO: color='black'
    },
    annotations: inicio && fim ? [{ // EXATO: annotations=[dict(...)]
      text: `Período: ${inicio} à ${fim}`, // EXATO: text=f'Período: {inicio} à {fim}'
      xref: 'paper', // EXATO: xref='paper'
      yref: 'paper', // EXATO: yref='paper'
      x: 0.00001, // EXATO: x=0.00001
      y: 1.065, // EXATO: y=1.065
      showarrow: false, // EXATO: showarrow=False
      font: {
        family: 'Georgia', // EXATO: family='Georgia'
        size: 13, // EXATO: size=13
        color: 'gray' // EXATO: color='gray'
      }
    }] : []
    };
  }, [inicio, fim]);

  if (loading) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: 'Carregando dados...' }}
        title="Rebalanceamento Diário vs. Alertas"
        description="Carregando dados da API..."
      />
    );
  }

  if (error) {
    return (
      <PlotlyChart
        data={[]}
        layout={{ title: `Erro: ${error}` }}
        title="Rebalanceamento Diário vs. Alertas"
        description="Erro ao carregar dados"
      />
    );
  }

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

  return (
    <PlotlyChart
      data={traces}
      layout={layout}
      title="Rebalanceamento Diário vs. Alertas"
      description={`Comparação entre rebalanceamento diário e por alertas para ${carteira}`}
    />
  );
}
