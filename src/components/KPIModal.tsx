import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Target, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { kpiThemes, KPITheme } from "@/lib/formatting";

interface KPIModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (kpi: { type: 'kpi'; title: string; data: any }) => void;
  initialData?: any;
}

export function KPIModal({ open, onClose, onSave, initialData }: KPIModalProps) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [change, setChange] = useState("");
  const [changeType, setChangeType] = useState<'increase' | 'decrease' | 'neutral'>('increase');
  const [icon, setIcon] = useState<'trending-up' | 'trending-down' | 'target'>('target');
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<KPITheme>(kpiThemes[0]);

  useEffect(() => {
    if (initialData && open) {
      setTitle(initialData.title || "");
      setValue(initialData.data?.value || "");
      setUnit(initialData.data?.unit || "");
      setChange(initialData.data?.change || "");
      setChangeType(initialData.data?.changeType || 'increase');
      setIcon(initialData.data?.icon || 'target');
      setDescription(initialData.data?.description || "");
      
      // Load theme if available
      const savedTheme = initialData.data?.theme;
      if (savedTheme) {
        const foundTheme = kpiThemes.find(t => t.name === savedTheme.name) || kpiThemes[0];
        setTheme(foundTheme);
      }
    } else if (open) {
      // Reset form for new KPI
      setTitle("");
      setValue("");
      setUnit("");
      setChange("");
      setChangeType('increase');
      setIcon('target');
      setDescription("");
      setTheme(kpiThemes[0]);
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!title.trim() || !value.trim()) return;

    const kpiData = {
      type: 'kpi' as const,
      title: title.trim(),
      data: {
        value: value.trim(),
        unit: unit.trim(),
        change: change.trim(),
        changeType,
        icon,
        description: description.trim(),
        theme
      }
    };

    onSave(kpiData);
    onClose();
  };

  const getIconComponent = (iconName: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {initialData ? "Edit KPI" : "Create New KPI"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content & Data</TabsTrigger>
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="w-4 h-4" />
              Theme & Style
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">KPI Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Monthly Revenue, Active Users, Conversion Rate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    placeholder="e.g., 15,234 or 89.5"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit (optional)</Label>
                  <Input
                    id="unit"
                    placeholder="e.g., $, %, users"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="change">Change (optional)</Label>
                  <Input
                    id="change"
                    placeholder="e.g., +12.5% or -2.1%"
                    value={change}
                    onChange={(e) => setChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Change Type</Label>
                  <Select value={changeType} onValueChange={(value: any) => setChangeType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Increase (Green)</SelectItem>
                      <SelectItem value="decrease">Decrease (Red)</SelectItem>
                      <SelectItem value="neutral">Neutral (Gray)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={icon} onValueChange={(value: any) => setIcon(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="target">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Target
                      </div>
                    </SelectItem>
                    <SelectItem value="trending-up">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Trending Up
                      </div>
                    </SelectItem>
                    <SelectItem value="trending-down">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Trending Down
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this KPI measures..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-6 mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">KPI Themes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kpiThemes.map((kpiTheme) => (
                  <div
                    key={kpiTheme.name}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      theme.name === kpiTheme.name ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setTheme(kpiTheme)}
                    style={{
                      backgroundColor: kpiTheme.backgroundColor,
                      borderColor: kpiTheme.borderColor,
                      color: kpiTheme.textColor
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{kpiTheme.name}</h4>
                        {getIconComponent(icon)}
                      </div>
                      <div className="text-2xl font-bold">123,456</div>
                      <div className="text-sm opacity-75">Sample KPI Preview</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Selected Theme: {theme.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: theme.backgroundColor }}
                      />
                      <span>Background</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: theme.textColor }}
                      />
                      <span>Text Color</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                      <span>Accent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: theme.borderColor }}
                      />
                      <span>Border</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="border-t pt-4">
          {/* Preview */}
          <div className="space-y-2 mb-4">
            <Label className="text-sm font-medium">Live Preview</Label>
            <div 
              className="p-4 rounded border"
              style={{
                backgroundColor: theme.backgroundColor,
                borderColor: theme.borderColor,
                color: theme.textColor
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIconComponent(icon)}
                  <span className="text-sm font-medium">{title || "KPI Title"}</span>
                </div>
                {change && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    changeType === 'increase' ? 'bg-success/10 text-success' :
                    changeType === 'decrease' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {change}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{value || "0"}</span>
                {unit && <span className="text-lg ml-1" style={{ opacity: 0.7 }}>{unit}</span>}
              </div>
              {description && (
                <p className="text-xs mt-1" style={{ opacity: 0.7 }}>{description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!title.trim() || !value.trim()}
            >
              {initialData ? "Update KPI" : "Create KPI"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}