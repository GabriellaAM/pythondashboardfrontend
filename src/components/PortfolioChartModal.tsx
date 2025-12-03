import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { DateRangePicker } from "./ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface PortfolioChartModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (component: { type: 'portfolio'; title: string; data: any }) => void;
  initialData?: any;
}

const portfolioChartTypes = [
  { 
    value: 'carteiras', 
    label: 'Comparação de Carteiras',
    description: 'Compara a rentabilidade acumulada de múltiplas carteiras'
  },
  { 
    value: 'ativos', 
    label: 'Performance dos Ativos',
    description: 'Mostra a performance individual dos ativos de uma carteira'
  },
  { 
    value: 'decomposicao', 
    label: 'Decomposição',
    description: 'Decomposição da rentabilidade por componente'
  },
  { 
    value: 'carteira_vs_ativos', 
    label: 'Carteira vs Ativos',
    description: 'Compara a carteira com seus ativos individuais'
  },
  { 
    value: 'alocacoes', 
    label: 'Alocações',
    description: 'Visualiza as alocações da carteira'
  },
  { 
    value: 'correlacao', 
    label: 'Matriz de Correlação',
    description: 'Matriz de correlação entre ativos'
  },
  { 
    value: 'dias_positivos_negativos', 
    label: 'Dias Positivos/Negativos',
    description: 'Distribuição de dias positivos e negativos'
  },
  { 
    value: 'posicoes_abertas', 
    label: 'Posições Abertas',
    description: 'Tabela com posições abertas da carteira'
  },
];

const carteiras = ['EXC', 'HB', 'LC', 'AC'];

export function PortfolioChartModal({ open, onClose, onSave, initialData }: PortfolioChartModalProps) {
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<string>('carteiras');
  const [selectedCarteira, setSelectedCarteira] = useState<string>('EXC');
  const [selectedCarteiras, setSelectedCarteiras] = useState<string[]>(['EXC']);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [brlMode, setBrlMode] = useState(false);
  const [segmentar, setSegmentar] = useState(true);
  const [acumular, setAcumular] = useState(false);
  const [realAloc, setRealAloc] = useState(false);
  const [janelaAmostral, setJanelaAmostral] = useState(30);
  const [setorizar, setSetorizar] = useState(true);

  useEffect(() => {
    if (initialData && open) {
      setTitle(initialData.title || '');
      setChartType(initialData.data?.chartType || 'carteiras');
      setSelectedCarteira(initialData.data?.carteira || 'EXC');
      setSelectedCarteiras(initialData.data?.carteiras || ['EXC']);
      setBrlMode(initialData.data?.brl || false);
      setSegmentar(initialData.data?.segmentar ?? true);
      setAcumular(initialData.data?.acumular ?? false);
      setRealAloc(initialData.data?.realAloc ?? false);
      setJanelaAmostral(initialData.data?.janelaAmostral || 30);
      setSetorizar(initialData.data?.setorizar ?? true);
      
      if (initialData.data?.inicio && initialData.data?.fim) {
        setDateRange({
          from: new Date(initialData.data.inicio),
          to: new Date(initialData.data.fim)
        });
      }
    } else if (open) {
      // Reset form for new chart
      const hoje = new Date();
      const inicio = subDays(hoje, 30);
      setTitle('');
      setChartType('carteiras');
      setSelectedCarteira('EXC');
      setSelectedCarteiras(['EXC']);
      setDateRange({
        from: inicio,
        to: hoje
      });
      setBrlMode(false);
      setSegmentar(true);
      setAcumular(false);
      setRealAloc(false);
      setJanelaAmostral(30);
      setSetorizar(true);
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para o gráfico.",
        variant: "destructive",
      });
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Período obrigatório",
        description: "Por favor, selecione um período de datas.",
        variant: "destructive",
      });
      return;
    }

    const chartData = {
      type: 'portfolio' as const,
      title: title.trim(),
      data: {
        chartType,
        carteira: selectedCarteira,
        carteiras: chartType === 'carteiras' ? selectedCarteiras : [selectedCarteira],
        inicio: format(dateRange.from, 'yyyy-MM-dd'),
        fim: format(dateRange.to, 'yyyy-MM-dd'),
        brl: brlMode,
        segmentar,
        acumular,
        realAloc,
        janelaAmostral,
        setorizar
      }
    };

    onSave(chartData);

    toast({
      title: "Gráfico salvo",
      description: "O gráfico de portfolio foi adicionado ao dashboard.",
    });

    onClose();
  };

  const getChartTypeConfig = () => {
    const type = portfolioChartTypes.find(t => t.value === chartType);
    return type;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Gráfico de Portfolio' : 'Adicionar Gráfico de Portfolio'}
          </DialogTitle>
          <DialogDescription>
            Adicione gráficos de análise de portfolio ao dashboard com drag and drop e resize.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="chart-title">Título do Gráfico</Label>
            <Input
              id="chart-title"
              placeholder="Ex: Comparação de Carteiras EXC vs HB"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chart-type">Tipo de Gráfico</Label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de gráfico" />
              </SelectTrigger>
              <SelectContent>
                {portfolioChartTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getChartTypeConfig() && (
              <p className="text-xs text-muted-foreground">
                {getChartTypeConfig()?.description}
              </p>
            )}
          </div>

          {chartType === 'carteiras' && (
            <div className="space-y-2">
              <Label>Carteiras</Label>
              <div className="flex flex-wrap gap-2">
                {carteiras.map(carteira => (
                  <Button
                    key={carteira}
                    type="button"
                    variant={selectedCarteiras.includes(carteira) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (selectedCarteiras.includes(carteira)) {
                        setSelectedCarteiras(selectedCarteiras.filter(c => c !== carteira));
                      } else {
                        setSelectedCarteiras([...selectedCarteiras, carteira]);
                      }
                    }}
                  >
                    {carteira}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione uma ou mais carteiras para comparar
              </p>
            </div>
          )}

          {chartType !== 'carteiras' && chartType !== 'posicoes_abertas' && (
            <div className="space-y-2">
              <Label htmlFor="carteira">Carteira</Label>
              <Select value={selectedCarteira} onValueChange={setSelectedCarteira}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {carteiras.map(carteira => (
                    <SelectItem key={carteira} value={carteira}>{carteira}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Período</Label>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>

          {(chartType === 'carteiras' || chartType === 'carteira_vs_ativos') && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="brl-mode"
                checked={brlMode}
                onChange={(e) => setBrlMode(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="brl-mode" className="cursor-pointer">
                Exibir em BRL (Real)
              </Label>
            </div>
          )}

          {(chartType === 'decomposicao' || chartType === 'alocacoes') && (
            <>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="segmentar"
                  checked={segmentar}
                  onChange={(e) => setSegmentar(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="segmentar" className="cursor-pointer">
                  Segmentar
                </Label>
              </div>
              {chartType === 'decomposicao' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acumular"
                    checked={acumular}
                    onChange={(e) => setAcumular(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="acumular" className="cursor-pointer">
                    Acumular
                  </Label>
                </div>
              )}
              {chartType === 'alocacoes' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="realAloc"
                    checked={realAloc}
                    onChange={(e) => setRealAloc(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="realAloc" className="cursor-pointer">
                    Alocação Real
                  </Label>
                </div>
              )}
            </>
          )}

          {chartType === 'dias_positivos_negativos' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="segmentar-dias"
                checked={segmentar}
                onChange={(e) => setSegmentar(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="segmentar-dias" className="cursor-pointer">
                Segmentar
              </Label>
            </div>
          )}

          {chartType === 'correlacao' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="janela-amostral">Janela Amostral (dias)</Label>
                <Input
                  id="janela-amostral"
                  type="number"
                  min="1"
                  max="365"
                  value={janelaAmostral}
                  onChange={(e) => setJanelaAmostral(parseInt(e.target.value) || 30)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="setorizar"
                  checked={setorizar}
                  onChange={(e) => setSetorizar(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="setorizar" className="cursor-pointer">
                  Setorizar
                </Label>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar Gráfico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

