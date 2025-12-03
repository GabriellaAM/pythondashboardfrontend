import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subMonths, subYears, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const today = new Date();

  const quickRanges = [
    { label: "Últimos 7 dias", from: subDays(today, 7), to: today },
    { label: "Últimos 30 dias", from: subDays(today, 30), to: today },
    { label: "Últimos 90 dias", from: subDays(today, 90), to: today },
    { label: "Último ano", from: subYears(today, 1), to: today },
    { label: "Este ano", from: startOfYear(today), to: today },
  ];

  return (
    <div 
      className={cn("grid gap-2", className)}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd 'de' MMM, yyyy", { locale: ptBR })} -{" "}
                  {format(dateRange.to, "dd 'de' MMM, yyyy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd 'de' MMM, yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione o período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="start"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex">
            <div className="border-r p-3 space-y-2 min-w-[140px]">
              <div className="text-sm font-medium mb-2">Períodos</div>
              {quickRanges.map((range, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateRangeChange({ from: range.from, to: range.to });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {range.label}
                </Button>
              ))}
            </div>
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

