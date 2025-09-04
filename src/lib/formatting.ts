// Formatting utilities for conditional formatting and styling

export interface ConditionalRule {
  id: string;
  columnIndex: number;
  condition: 'greater' | 'less' | 'equal' | 'contains' | 'between';
  value: string;
  value2?: string; // For 'between' condition
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
}

export interface TableFormatting {
  headerStyle?: {
    backgroundColor?: string;
    textColor?: string;
    fontWeight?: 'normal' | 'bold';
  };
  alternateRows?: boolean;
  alternateRowColor?: string;
  borderStyle?: 'none' | 'light' | 'medium' | 'heavy';
  conditionalRules?: ConditionalRule[];
}

export interface ChartColorScheme {
  name: string;
  colors: string[];
}

export interface KPITheme {
  name: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;
}

// Predefined color schemes for charts
export const chartColorSchemes: ChartColorScheme[] = [
  {
    name: 'Default',
    colors: ['rgb(var(--primary))', 'rgb(var(--secondary))', 'rgb(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  },
  {
    name: 'Blue Tones',
    colors: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a', '#60a5fa', '#93c5fd', '#dbeafe']
  },
  {
    name: 'Green Tones', 
    colors: ['#10b981', '#059669', '#047857', '#065f46', '#34d399', '#6ee7b7', '#d1fae5']
  },
  {
    name: 'Warm',
    colors: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#fbbf24', '#fcd34d', '#fef3c7']
  },
  {
    name: 'Purple Tones',
    colors: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#a78bfa', '#c4b5fd', '#ede9fe']
  },
  {
    name: 'Monochrome',
    colors: ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f9fafb']
  }
];

// Predefined KPI themes
export const kpiThemes: KPITheme[] = [
  {
    name: 'Default',
    backgroundColor: 'rgb(var(--card))',
    textColor: 'rgb(var(--foreground))',
    accentColor: 'rgb(var(--primary))',
    borderColor: 'rgb(var(--border))'
  },
  {
    name: 'Success',
    backgroundColor: 'rgb(34 197 94 / 0.1)',
    textColor: 'rgb(34 197 94)',
    accentColor: 'rgb(34 197 94)',
    borderColor: 'rgb(34 197 94 / 0.2)'
  },
  {
    name: 'Warning',
    backgroundColor: 'rgb(245 158 11 / 0.1)',
    textColor: 'rgb(245 158 11)',
    accentColor: 'rgb(245 158 11)',
    borderColor: 'rgb(245 158 11 / 0.2)'
  },
  {
    name: 'Danger',
    backgroundColor: 'rgb(239 68 68 / 0.1)',
    textColor: 'rgb(239 68 68)',
    accentColor: 'rgb(239 68 68)',
    borderColor: 'rgb(239 68 68 / 0.2)'
  },
  {
    name: 'Info',
    backgroundColor: 'rgb(59 130 246 / 0.1)',
    textColor: 'rgb(59 130 246)',
    accentColor: 'rgb(59 130 246)',
    borderColor: 'rgb(59 130 246 / 0.2)'
  },
  {
    name: 'Dark',
    backgroundColor: 'rgb(15 23 42)',
    textColor: 'rgb(248 250 252)',
    accentColor: 'rgb(96 165 250)',
    borderColor: 'rgb(30 41 59)'
  }
];

// Utility function to evaluate conditional formatting rules
export function evaluateConditionalRule(rule: ConditionalRule, cellValue: string): boolean {
  const numericValue = parseFloat(cellValue);
  const ruleValue = parseFloat(rule.value);
  const ruleValue2 = rule.value2 ? parseFloat(rule.value2) : 0;

  switch (rule.condition) {
    case 'greater':
      return !isNaN(numericValue) && !isNaN(ruleValue) && numericValue > ruleValue;
    case 'less':
      return !isNaN(numericValue) && !isNaN(ruleValue) && numericValue < ruleValue;
    case 'equal':
      if (!isNaN(numericValue) && !isNaN(ruleValue)) {
        return numericValue === ruleValue;
      }
      return cellValue.toLowerCase() === rule.value.toLowerCase();
    case 'contains':
      return cellValue.toLowerCase().includes(rule.value.toLowerCase());
    case 'between':
      return !isNaN(numericValue) && !isNaN(ruleValue) && !isNaN(ruleValue2) && 
             numericValue >= Math.min(ruleValue, ruleValue2) && 
             numericValue <= Math.max(ruleValue, ruleValue2);
    default:
      return false;
  }
}

// Get the style for a cell based on conditional rules
export function getCellStyleFromRules(
  rules: ConditionalRule[], 
  cellValue: string, 
  columnIndex: number
): React.CSSProperties {
  const style: React.CSSProperties = {};
  
  for (const rule of rules) {
    if (rule.columnIndex === columnIndex && evaluateConditionalRule(rule, cellValue)) {
      if (rule.backgroundColor) {
        style.backgroundColor = rule.backgroundColor;
      }
      if (rule.textColor) {
        style.color = rule.textColor;
      }
      if (rule.fontWeight) {
        style.fontWeight = rule.fontWeight;
      }
      // Apply first matching rule only
      break;
    }
  }
  
  return style;
}

// Default border styles
export const borderStyles = {
  none: '',
  light: 'border border-border/30',
  medium: 'border border-border',
  heavy: 'border-2 border-border'
};