import { useState, useEffect, useRef } from "react";
import { Plus, Minus, Save, Upload, FileSpreadsheet, Palette, Settings2 } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ConditionalRule, TableFormatting } from "@/lib/formatting";

interface TableModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (component: { type: 'table'; title: string; data: any }) => void;
  initialData?: any;
}

export function TableModal({ open, onClose, onSave, initialData }: TableModalProps) {
  const [title, setTitle] = useState('');
  const [headers, setHeaders] = useState(['Column 1', 'Column 2', 'Column 3']);
  const [rows, setRows] = useState([
    ['Data 1', 'Data 2', 'Data 3'],
    ['Data 4', 'Data 5', 'Data 6'],
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Formatting states
  const [formatting, setFormatting] = useState<TableFormatting>({
    headerStyle: {
      backgroundColor: 'rgb(var(--muted))',
      textColor: 'rgb(var(--muted-foreground))',
      fontWeight: 'bold'
    },
    alternateRows: true,
    alternateRowColor: 'rgb(var(--muted) / 0.3)',
    borderStyle: 'light',
    conditionalRules: []
  });
  
  const [newRule, setNewRule] = useState<Partial<ConditionalRule>>({
    condition: 'greater',
    columnIndex: 0,
    backgroundColor: '#fef3c7',
    textColor: '#92400e',
    fontWeight: 'normal'
  });

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setHeaders(initialData.data?.headers || ['Column 1', 'Column 2', 'Column 3']);
      setRows(initialData.data?.rows || [['Data 1', 'Data 2', 'Data 3']]);
      setFormatting(initialData.data?.formatting || {
        headerStyle: {
          backgroundColor: 'rgb(var(--muted))',
          textColor: 'rgb(var(--muted-foreground))',
          fontWeight: 'bold'
        },
        alternateRows: true,
        alternateRowColor: 'rgb(var(--muted) / 0.3)',
        borderStyle: 'light',
        conditionalRules: []
      });
    } else {
      setTitle('');
      setHeaders(['Column 1', 'Column 2', 'Column 3']);
      setRows([
        ['Data 1', 'Data 2', 'Data 3'],
        ['Data 4', 'Data 5', 'Data 6'],
      ]);
      setFormatting({
        headerStyle: {
          backgroundColor: 'rgb(var(--muted))',
          textColor: 'rgb(var(--muted-foreground))',
          fontWeight: 'bold'
        },
        alternateRows: true,
        alternateRowColor: 'rgb(var(--muted) / 0.3)',
        borderStyle: 'light',
        conditionalRules: []
      });
    }
  }, [initialData, open]);

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
  };

  const addColumn = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setRows(rows.map(row => [...row, '']));
  };

  const removeColumn = (index: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== index));
    setRows(rows.map(row => row.filter((_, i) => i !== index)));
  };

  const addRow = () => {
    setRows([...rows, new Array(headers.length).fill('')]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse CSV with basic handling of quoted fields
    const parseCSVLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };

    const parsedHeaders = parseCSVLine(lines[0]);
    const parsedRows = lines.slice(1).map(parseCSVLine);

    return {
      headers: parsedHeaders,
      rows: parsedRows
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      try {
        const { headers: csvHeaders, rows: csvRows } = parseCSV(csvText);
        
        if (csvHeaders.length === 0) {
          toast({
            title: "Empty file",
            description: "The CSV file appears to be empty.",
            variant: "destructive",
          });
          return;
        }

        setHeaders(csvHeaders);
        setRows(csvRows.length > 0 ? csvRows : [new Array(csvHeaders.length).fill('')]);
        
        // Set title based on filename if not already set
        if (!title.trim()) {
          const fileName = file.name.replace('.csv', '');
          setTitle(fileName);
        }

        toast({
          title: "File uploaded successfully",
          description: `Loaded ${csvHeaders.length} columns and ${csvRows.length} rows.`,
        });
      } catch (error) {
        toast({
          title: "Error parsing file",
          description: "There was an error reading the CSV file.",
          variant: "destructive",
        });
      }
    };

    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "There was an error reading the file.",
        variant: "destructive",
      });
    };

    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const addConditionalRule = () => {
    if (!newRule.value || newRule.columnIndex === undefined) return;
    
    const rule: ConditionalRule = {
      id: Date.now().toString(),
      columnIndex: newRule.columnIndex,
      condition: newRule.condition || 'greater',
      value: newRule.value,
      value2: newRule.value2,
      backgroundColor: newRule.backgroundColor,
      textColor: newRule.textColor,
      fontWeight: newRule.fontWeight || 'normal'
    };
    
    setFormatting(prev => ({
      ...prev,
      conditionalRules: [...(prev.conditionalRules || []), rule]
    }));
    
    setNewRule({
      condition: 'greater',
      columnIndex: 0,
      backgroundColor: '#fef3c7',
      textColor: '#92400e',
      fontWeight: 'normal'
    });
  };

  const removeConditionalRule = (ruleId: string) => {
    setFormatting(prev => ({
      ...prev,
      conditionalRules: prev.conditionalRules?.filter(rule => rule.id !== ruleId) || []
    }));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your table.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      type: 'table',
      title: title.trim(),
      data: { headers, rows, formatting },
    });

    toast({
      title: "Table saved",
      description: "Your table has been added to the dashboard.",
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Table' : 'Create New Table'}
          </DialogTitle>
          <DialogDescription>
            Create and customize your data table with an Excel-like interface and formatting options.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="data">Data & Structure</TabsTrigger>
            <TabsTrigger value="formatting" className="gap-2">
              <Palette className="w-4 h-4" />
              Formatting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="table-title">Table Title</Label>
              <Input
                id="table-title"
                placeholder="Enter table title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* CSV Upload Section */}
            <div className="space-y-2">
              <Label>Import from CSV</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileUpload}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload CSV File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>CSV files only</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a CSV file to automatically populate the table. You can still edit the data after import.
              </p>
            </div>

            {/* Table Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Table Data</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addColumn}
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Column
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRow}
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Row
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="w-8"></th>
                        {headers.map((header, index) => (
                          <th key={index} className="p-2 border-r border-border min-w-[120px]">
                            <div className="flex items-center gap-1">
                              <Input
                                value={header}
                                onChange={(e) => updateHeader(index, e.target.value)}
                                className="text-xs font-medium bg-transparent border-none p-1 h-6"
                              />
                              {headers.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeColumn(index)}
                                  className="h-6 w-6 p-0 hover:bg-destructive/20"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-border">
                          <td className="p-2 bg-muted text-center text-xs font-medium">
                            <div className="flex items-center justify-center gap-1">
                              <span>{rowIndex + 1}</span>
                              {rows.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRow(rowIndex)}
                                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                                >
                                  <Minus className="w-2 h-2" />
                                </Button>
                              )}
                            </div>
                          </td>
                          {row.map((cell, colIndex) => (
                            <td key={colIndex} className="p-1 border-r border-border">
                              <Input
                                value={cell}
                                onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                className="border-none bg-transparent text-sm h-8"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="formatting" className="space-y-6 mt-4">
            {/* Basic Styling */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Basic Table Styling
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Border Style</Label>
                  <Select 
                    value={formatting.borderStyle} 
                    onValueChange={(value: any) => setFormatting(prev => ({ ...prev, borderStyle: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Border</SelectItem>
                      <SelectItem value="light">Light Border</SelectItem>
                      <SelectItem value="medium">Medium Border</SelectItem>
                      <SelectItem value="heavy">Heavy Border</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Alternate Row Colors</Label>
                    <Switch
                      checked={formatting.alternateRows}
                      onCheckedChange={(checked) => setFormatting(prev => ({ ...prev, alternateRows: checked }))}
                    />
                  </div>
                  {formatting.alternateRows && (
                    <Input
                      type="color"
                      value={formatting.alternateRowColor?.replace(/rgb\([^)]+\)/, '#f3f4f6') || '#f3f4f6'}
                      onChange={(e) => setFormatting(prev => ({ ...prev, alternateRowColor: e.target.value }))}
                      className="w-full h-10"
                    />
                  )}
                </div>
              </div>

              {/* Header Styling */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Header Styling</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Background</Label>
                    <Input
                      type="color"
                      value={formatting.headerStyle?.backgroundColor?.replace(/rgb\([^)]+\)/, '#f3f4f6') || '#f3f4f6'}
                      onChange={(e) => setFormatting(prev => ({ 
                        ...prev, 
                        headerStyle: { ...prev.headerStyle, backgroundColor: e.target.value }
                      }))}
                      className="w-full h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Text Color</Label>
                    <Input
                      type="color"
                      value={formatting.headerStyle?.textColor?.replace(/rgb\([^)]+\)/, '#374151') || '#374151'}
                      onChange={(e) => setFormatting(prev => ({ 
                        ...prev, 
                        headerStyle: { ...prev.headerStyle, textColor: e.target.value }
                      }))}
                      className="w-full h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Font Weight</Label>
                    <Select 
                      value={formatting.headerStyle?.fontWeight || 'bold'} 
                      onValueChange={(value: any) => setFormatting(prev => ({ 
                        ...prev, 
                        headerStyle: { ...prev.headerStyle, fontWeight: value }
                      }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional Formatting */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conditional Formatting</h3>
              
              {/* Add New Rule */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <Label className="text-sm font-medium mb-3 block">Add New Rule</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Column</Label>
                    <Select 
                      value={String(newRule.columnIndex || 0)} 
                      onValueChange={(value) => setNewRule(prev => ({ ...prev, columnIndex: parseInt(value) }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((header, index) => (
                          <SelectItem key={index} value={String(index)}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Condition</Label>
                    <Select 
                      value={newRule.condition} 
                      onValueChange={(value: any) => setNewRule(prev => ({ ...prev, condition: value }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="greater">Greater than</SelectItem>
                        <SelectItem value="less">Less than</SelectItem>
                        <SelectItem value="equal">Equal to</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="between">Between</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={newRule.value || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Enter value"
                      className="h-8"
                    />
                  </div>
                  
                  {newRule.condition === 'between' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Second Value</Label>
                      <Input
                        value={newRule.value2 || ''}
                        onChange={(e) => setNewRule(prev => ({ ...prev, value2: e.target.value }))}
                        placeholder="Enter second value"
                        className="h-8"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Background</Label>
                    <Input
                      type="color"
                      value={newRule.backgroundColor || '#fef3c7'}
                      onChange={(e) => setNewRule(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-full h-8"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Text Color</Label>
                    <Input
                      type="color"
                      value={newRule.textColor || '#92400e'}
                      onChange={(e) => setNewRule(prev => ({ ...prev, textColor: e.target.value }))}
                      className="w-full h-8"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={addConditionalRule} 
                  size="sm" 
                  className="mt-3"
                  disabled={!newRule.value || newRule.columnIndex === undefined}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Rule
                </Button>
              </div>
              
              {/* Existing Rules */}
              {formatting.conditionalRules && formatting.conditionalRules.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Active Rules</Label>
                  {formatting.conditionalRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: rule.backgroundColor }}
                        />
                        <span className="text-sm">
                          <strong>{headers[rule.columnIndex]}</strong> {rule.condition} <strong>{rule.value}</strong>
                          {rule.value2 && ` and ${rule.value2}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConditionalRule(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}