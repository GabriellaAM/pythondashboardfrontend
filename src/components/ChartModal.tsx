import { useState, useEffect } from "react";
import { Play, Save, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { chartColorSchemes, ChartColorScheme } from "@/lib/formatting";

interface ChartModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (component: { type: 'chart'; title: string; data: any }) => void;
  initialData?: any;
}

const chartTypes = [
  { value: 'line', label: 'Line Chart' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'area', label: 'Area Chart' },
];

const samplePythonCode = `import pandas as pd
import numpy as np

# Sample data generation
dates = pd.date_range('2024-01-01', periods=6, freq='M')
values = np.random.randint(3000, 7000, 6)

# Create DataFrame
data = pd.DataFrame({
    'name': [d.strftime('%b') for d in dates],
    'value': values
})

# Return data for visualization
return data.to_dict('records')`;

export function ChartModal({ open, onClose, onSave, initialData }: ChartModalProps) {
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState<string>('line');
  const [pythonCode, setPythonCode] = useState(samplePythonCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [colorScheme, setColorScheme] = useState<ChartColorScheme>(chartColorSchemes[0]);

  useEffect(() => {
    if (initialData && open) {
      setTitle(initialData.title || '');
      setChartType(initialData.data?.type || 'line');
      setPythonCode(initialData.data?.pythonCode || samplePythonCode);
      setExecutionResult(initialData.data || null);
      
      // Load color scheme if available
      const savedScheme = initialData.data?.colorScheme;
      if (savedScheme) {
        const scheme = chartColorSchemes.find(s => s.name === savedScheme.name) || chartColorSchemes[0];
        setColorScheme(scheme);
      }
    } else if (open) {
      // Reset form for new chart
      setTitle('');
      setChartType('line');
      setPythonCode(samplePythonCode);
      setExecutionResult(null);
      setColorScheme(chartColorSchemes[0]);
    }
  }, [initialData, open]);

  const executeCode = async () => {
    setIsExecuting(true);
    
    try {
      const result = await apiClient.executeCode(pythonCode);
      
      if (result.success) {
        setExecutionResult(result);
        toast({
          title: "Code executed successfully",
          description: `Execution completed in ${result.execution_time.toFixed(2)}s`,
        });
      } else {
        toast({
          title: "Execution failed",
          description: result.error || "An error occurred during execution",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Mock successful execution for demo
      const mockData = [
        { name: 'Jan', value: Math.floor(Math.random() * 5000) + 2000 },
        { name: 'Feb', value: Math.floor(Math.random() * 5000) + 2000 },
        { name: 'Mar', value: Math.floor(Math.random() * 5000) + 2000 },
        { name: 'Apr', value: Math.floor(Math.random() * 5000) + 2000 },
        { name: 'May', value: Math.floor(Math.random() * 5000) + 2000 },
        { name: 'Jun', value: Math.floor(Math.random() * 5000) + 2000 },
      ];
      
      setExecutionResult({ data: mockData });
      toast({
        title: "Code executed (demo mode)",
        description: "Generated sample data for demonstration",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your chart.",
        variant: "destructive",
      });
      return;
    }

    // Generate mock data if no execution result
    const mockData = [
      { name: 'Jan', value: Math.floor(Math.random() * 5000) + 2000 },
      { name: 'Feb', value: Math.floor(Math.random() * 5000) + 2000 },
      { name: 'Mar', value: Math.floor(Math.random() * 5000) + 2000 },
      { name: 'Apr', value: Math.floor(Math.random() * 5000) + 2000 },
      { name: 'May', value: Math.floor(Math.random() * 5000) + 2000 },
      { name: 'Jun', value: Math.floor(Math.random() * 5000) + 2000 },
    ];

    const chartData = {
      type: 'chart' as const,
      title: title.trim(),
      data: {
        type: chartType,
        data: executionResult?.data || mockData,
        pythonCode,
        colorScheme
      }
    };

    onSave(chartData);

    toast({
      title: "Chart saved",
      description: "Your chart has been added to the dashboard.",
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Chart' : 'Create New Chart'}
          </DialogTitle>
          <DialogDescription>
            Generate dynamic charts with Python code and customize the appearance.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">Code & Data</TabsTrigger>
            <TabsTrigger value="styling" className="gap-2">
              <Palette className="w-4 h-4" />
              Styling
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chart-title">Chart Title</Label>
                <Input
                  id="chart-title"
                  placeholder="Enter chart title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chart-type">Chart Type</Label>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chart type" />
                  </SelectTrigger>
                  <SelectContent>
                    {chartTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="python-code">Python Code</Label>
                <Button
                  onClick={executeCode}
                  disabled={isExecuting}
                  size="sm"
                  className="gap-2"
                >
                  <Play className="w-3 h-3" />
                  {isExecuting ? 'Running...' : 'Run Code'}
                </Button>
              </div>
              <Textarea
                id="python-code"
                placeholder="Enter your Python code here..."
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use pandas, numpy, and other allowed libraries. Return data in format: [{`name: 'Label', value: 123`}]
              </p>
            </div>

            {executionResult && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">
                    Generated {executionResult.data?.length || 0} data points
                  </p>
                  <div className="text-xs font-mono bg-background p-2 rounded border">
                    {JSON.stringify(executionResult.data?.slice(0, 3) || [], null, 2)}
                    {(executionResult.data?.length || 0) > 3 && '...'}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="styling" className="space-y-6 mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Color Scheme</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chartColorSchemes.map((scheme) => (
                  <div
                    key={scheme.name}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      colorScheme.name === scheme.name ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setColorScheme(scheme)}
                  >
                    <div className="space-y-2">
                      <h4 className="font-medium">{scheme.name}</h4>
                      <div className="flex gap-1">
                        {scheme.colors.slice(0, 6).map((color, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Selected Scheme: {colorScheme.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {colorScheme.colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color }}
                      />
                      <code className="text-xs bg-background px-1 py-0.5 rounded">
                        {color}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}