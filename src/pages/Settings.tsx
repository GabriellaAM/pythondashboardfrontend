import { useState } from "react";
import { Bell, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    monthly: true
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your application preferences and notifications</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="w-4 h-4" />
            Preferences
          </TabsTrigger>
        </TabsList>


        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch 
                  checked={notifications.email}
                  onCheckedChange={() => handleNotificationChange('email')}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                </div>
                <Switch 
                  checked={notifications.push}
                  onCheckedChange={() => handleNotificationChange('push')}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Get weekly analytics summary</p>
                </div>
                <Switch 
                  checked={notifications.weekly}
                  onCheckedChange={() => handleNotificationChange('weekly')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Monthly Reports</Label>
                  <p className="text-sm text-muted-foreground">Get monthly performance reports</p>
                </div>
                <Switch 
                  checked={notifications.monthly}
                  onCheckedChange={() => handleNotificationChange('monthly')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="preferences" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Dashboard View</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred dashboard layout</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Data Refresh Interval</Label>
                <p className="text-sm text-muted-foreground">How often to refresh dashboard data</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Export Format</Label>
                <p className="text-sm text-muted-foreground">Default format for data exports</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}