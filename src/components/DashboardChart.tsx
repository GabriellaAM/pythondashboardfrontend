import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: Array<{ name: string; value: number; [key: string]: any }>;
}

interface DashboardChartProps {
  data: ChartData;
}

const CHART_COLORS = [
  'rgb(var(--chart-1))',
  'rgb(var(--chart-2))',
  'rgb(var(--chart-3))',
  'rgb(var(--chart-4))',
  'rgb(var(--chart-5))',
];

export function DashboardChart({ data }: DashboardChartProps) {
  const renderChart = () => {
    const commonProps = {
      data: data.data,
      className: "w-full h-[200px]"
    };

    switch (data.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }}
                axisLine={{ stroke: 'rgb(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }}
                axisLine={{ stroke: 'rgb(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(var(--card))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="rgb(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'rgb(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'rgb(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }}
                axisLine={{ stroke: 'rgb(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }}
                axisLine={{ stroke: 'rgb(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(var(--card))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="rgb(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }}
                axisLine={{ stroke: 'rgb(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'rgb(var(--muted-foreground))' }}
                axisLine={{ stroke: 'rgb(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(var(--card))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="rgb(var(--primary))"
                fill="rgb(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(var(--card))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <p>Unsupported chart type</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderChart()}
    </div>
  );
}