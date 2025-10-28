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
}

export function PlotlyChart({ 
  data, 
  layout = {}, 
  config = {}, 
  title, 
  description,
  className = ""
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
    ...layout
  };

  const defaultConfig = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    ...config
  };

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
        <Plot
          data={data}
          layout={defaultLayout}
          config={defaultConfig}
          style={{ width: '100%', height: '400px' }}
        />
      </CardContent>
    </Card>
  );
}
