import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { KPITheme } from "@/lib/formatting";

interface DashboardKPIProps {
  data?: {
    value: string;
    unit?: string;
    change?: string;
    changeType?: 'increase' | 'decrease' | 'neutral';
    icon?: 'trending-up' | 'trending-down' | 'target';
    description?: string;
    theme?: KPITheme;
  };
  loading?: boolean;
}

export function DashboardKPI({ data, loading = false }: DashboardKPIProps) {
  if (loading || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }
  
  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'trending-up':
        return <TrendingUp className="w-4 h-4" />;
      case 'trending-down':
        return <TrendingDown className="w-4 h-4" />;
      case 'target':
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getChangeColorClass = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'bg-success/10 text-success';
      case 'decrease':
        return 'bg-destructive/10 text-destructive';
      case 'neutral':
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getContainerStyle = () => {
    const style: React.CSSProperties = {};
    
    if (data.theme) {
      if (data.theme.backgroundColor) {
        style.backgroundColor = data.theme.backgroundColor;
      }
      if (data.theme.borderColor) {
        style.borderColor = data.theme.borderColor;
      }
      if (data.theme.textColor) {
        style.color = data.theme.textColor;
      }
    }
    
    return style;
  };

  return (
    <div 
      className="h-full flex flex-col justify-between p-4 rounded-lg border transition-all"
      style={getContainerStyle()}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2" style={{ 
          color: data.theme?.accentColor || 'inherit',
          opacity: 0.8 
        }}>
          {getIconComponent(data.icon)}
        </div>
        {data.change && (
          <span className={`text-xs px-2 py-1 rounded font-medium ${getChangeColorClass(data.changeType)}`}>
            {data.change}
          </span>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-2">
          <span className="text-3xl font-bold">{data.value}</span>
          {data.unit && (
            <span className="text-xl ml-1" style={{ opacity: 0.7 }}>
              {data.unit}
            </span>
          )}
        </div>
        
        {data.description && (
          <p className="text-sm leading-relaxed" style={{ opacity: 0.7 }}>
            {data.description}
          </p>
        )}
      </div>
    </div>
  );
}