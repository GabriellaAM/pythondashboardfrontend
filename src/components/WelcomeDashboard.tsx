import { useState } from "react";
import { Plus, BarChart3, Table, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { useDashboard } from "@/contexts/DashboardContext";
import { toast } from "@/hooks/use-toast";

interface WelcomeDashboardProps {
  onDashboardCreated: (dashboardId: string) => void;
}

export function WelcomeDashboard({ onDashboardCreated }: WelcomeDashboardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { setCurrentDashboard, refreshDashboards } = useDashboard();

  const createWelcomeDashboard = async () => {
    setIsCreating(true);
    try {
      // Create welcome dashboard
      const dashboard = await apiClient.createDashboard({
        name: "Welcome to DataViz Pro",
        description: "Your first dashboard - start building amazing visualizations!"
      });

      // Set as current dashboard
      setCurrentDashboard(dashboard);
      
      // Refresh dashboards in sidebar
      refreshDashboards();
      
      // Small delay to ensure the API call completed
      setTimeout(() => {
        refreshDashboards();
      }, 500);
      
      // Notify parent component
      onDashboardCreated(dashboard.id);

      toast({
        title: "Welcome Dashboard Created!",
        description: "You can now start adding charts, tables, and KPIs.",
      });
    } catch (error) {
      console.error('Failed to create welcome dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to create welcome dashboard. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to DataViz Pro! 🎉
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Let's create your first dashboard to get started with data visualization
          </p>
        </div>
      </div>

      {/* Welcome Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-soft">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Create Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Build beautiful visualizations with various chart types like bar, line, pie, and more.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Table className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Data Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Display your data in organized, interactive tables with sorting and filtering.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">KPI Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Track key performance indicators with customizable metric cards.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <Card className="shadow-soft bg-gradient-subtle">
          <CardContent className="py-8">
            <h3 className="text-xl font-semibold mb-4">Ready to get started?</h3>
            <p className="text-muted-foreground mb-6">
              Create your first dashboard and start building amazing data visualizations
            </p>
            <Button 
              size="lg" 
              onClick={createWelcomeDashboard}
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating Dashboard...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create My First Dashboard
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't worry, you can always rename or delete this dashboard later. 
          This is just to help you get started! ✨
        </p>
      </div>
    </div>
  );
}