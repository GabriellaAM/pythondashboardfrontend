import React from 'react';
import Plot from 'react-plotly.js';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PlotlyChartProps {
  data: any;
  layout?: any;
  config?: any;
  title?: string;
  description?: string;
  className?: string;
  containerMode?: boolean;
}

export function PlotlyChart({ 
  data, 
  layout = {}, 
  config = {}, 
  title, 
  description,
  className = "",
  containerMode = false
}: PlotlyChartProps) {
  const defaultLayout = {
    font: {
      family: 'Georgia',
      size: 15,
      color: 'black'
    },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    margin: { t: 60, r: 20, b: 60, l: 60 },
    autosize: true,
    ...layout
  };

  const defaultConfig = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true,
    ...config
  };

  if (containerMode) {
    return (
      <div className="w-full h-full" style={{ height: '100%', width: '100%' }}>
        <Plot
          data={data}
          layout={defaultLayout}
          config={defaultConfig}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%', minHeight: '300px' }}
        />
      </div>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full h-full min-h-[400px]">
          <Plot
            data={data}
            layout={defaultLayout}
            config={defaultConfig}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
