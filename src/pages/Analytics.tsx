import { TrendingUp, Users, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  const analyticsData = [
    {
      title: "Total Users",
      value: "12,543",
      change: "+12%",
      icon: Users,
      color: "text-chart-1"
    },
    {
      title: "Active Sessions", 
      value: "8,234",
      change: "+8%",
      icon: TrendingUp,
      color: "text-chart-2"
    },
    {
      title: "Page Views",
      value: "45,123",
      change: "+23%", 
      icon: BarChart3,
      color: "text-chart-3"
    },
    {
      title: "Conversion Rate",
      value: "3.4%",
      change: "+0.8%",
      icon: PieChart,
      color: "text-chart-4"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights and performance metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsData.map((item, index) => (
          <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{item.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted/30 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">User activity chart would go here</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted/30 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Traffic sources chart would go here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}