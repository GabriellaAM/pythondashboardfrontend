import { getCellStyleFromRules, borderStyles, TableFormatting } from "@/lib/formatting";
import { Skeleton } from '@/components/ui/skeleton';

interface TableData {
  headers: string[];
  rows: string[][];
  formatting?: TableFormatting;
}

interface DashboardTableProps {
  data?: TableData;
  loading?: boolean;
}

const TableSkeleton = () => (
  <div className="w-full space-y-3">
    <Skeleton className="w-full h-8" />
    <Skeleton className="w-full h-6" />
    <Skeleton className="w-5/6 h-6" />
    <Skeleton className="w-4/5 h-6" />
    <Skeleton className="w-3/4 h-6" />
  </div>
);

export function DashboardTable({ data, loading = false }: DashboardTableProps) {
  if (loading || !data) {
    return <TableSkeleton />;
  }
  
  const { headers, rows, formatting } = data;

  const getRowClassName = (rowIndex: number) => {
    let className = "border-t border-border hover:bg-muted/25 transition-colors";
    
    if (formatting?.alternateRows && rowIndex % 2 === 1) {
      className += " bg-muted/30";
    }
    
    return className;
  };

  const getTableClassName = () => {
    let className = "w-full text-sm";
    
    if (formatting?.borderStyle) {
      className += ` ${borderStyles[formatting.borderStyle]}`;
    }
    
    return className;
  };

  const getHeaderStyle = () => {
    const style: React.CSSProperties = {};
    
    if (formatting?.headerStyle?.backgroundColor) {
      style.backgroundColor = formatting.headerStyle.backgroundColor;
    }
    if (formatting?.headerStyle?.textColor) {
      style.color = formatting.headerStyle.textColor;
    }
    if (formatting?.headerStyle?.fontWeight) {
      style.fontWeight = formatting.headerStyle.fontWeight;
    }
    
    return style;
  };

  return (
    <div className="w-full">
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className={getTableClassName()}>
            <thead className="bg-muted/50">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-3 py-2 text-left font-medium text-muted-foreground border-r border-border last:border-r-0"
                    style={getHeaderStyle()}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={getRowClassName(rowIndex)}
                >
                  {row.map((cell, cellIndex) => {
                    const conditionalStyle = formatting?.conditionalRules 
                      ? getCellStyleFromRules(formatting.conditionalRules, cell, cellIndex)
                      : {};
                    
                    return (
                      <td
                        key={cellIndex}
                        className="px-3 py-2 border-r border-border last:border-r-0"
                        style={conditionalStyle}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {rows.length === 0 && (
        <div className="flex items-center justify-center h-24 text-muted-foreground">
          <p>No data available</p>
        </div>
      )}
    </div>
  );
}