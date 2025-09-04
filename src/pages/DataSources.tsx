import { useState } from "react";
import { Database, Plus, Settings, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DataSources() {
  const [dataSources] = useState([
    {
      id: 1,
      name: "PostgreSQL Database",
      type: "Database",
      status: "Connected",
      lastSync: "2 minutes ago",
      icon: Database,
      color: "bg-chart-1"
    },
    {
      id: 2, 
      name: "Sales API",
      type: "REST API", 
      status: "Connected",
      lastSync: "5 minutes ago",
      icon: Activity,
      color: "bg-chart-2"
    },
    {
      id: 3,
      name: "Analytics CSV",
      type: "File Upload",
      status: "Syncing",
      lastSync: "1 hour ago", 
      icon: Database,
      color: "bg-chart-3"
    }
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Sources</h1>
          <p className="text-muted-foreground mt-1">Manage your data connections and sources</p>
        </div>
        
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Data Source
        </Button>
      </div>

      {/* Data Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataSources.map((source) => (
          <Card key={source.id} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-3">
              <div className={`w-10 h-10 ${source.color} rounded-lg flex items-center justify-center mr-3`}>
                <source.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{source.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{source.type}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge 
                    variant={source.status === 'Connected' ? 'default' : 'secondary'}
                    className={source.status === 'Connected' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {source.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last sync:</span>
                  <span className="text-sm font-medium">{source.lastSync}</span>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Settings className="w-3 h-3" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Data Source Card */}
        <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-muted-foreground">Add New Data Source</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Connect your databases, APIs, and files</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Active data sources</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Data Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2M</div>
            <p className="text-xs text-muted-foreground">Records this month</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-xs text-muted-foreground">Successful syncs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}