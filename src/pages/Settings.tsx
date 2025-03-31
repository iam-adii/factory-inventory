
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  SunMoon,
  UserCog,
  Bell,
  Shield,
  Database
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { settingsService } from "@/lib/services/settingsService";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [batchExpiryAlerts, setBatchExpiryAlerts] = useState(true);
  const [usageReportAlerts, setUsageReportAlerts] = useState(true);
  const [systemUpdateAlerts, setSystemUpdateAlerts] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Load settings from database on initial render
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await settingsService.getAllForUser();
        
        if (error) {
          console.error("Error loading settings:", error);
          return;
        }
        
        if (data) {
          // Process each setting and update state accordingly
          data.forEach(setting => {
            switch(setting.key) {
              case 'notifications_enabled':
                setNotificationsEnabled(setting.value === true);
                break;
              case 'email_alerts':
                setEmailAlerts(setting.value === true);
                break;
              case 'auto_backup':
                setAutoBackup(setting.value === true);
                break;
              case 'animations':
                setAnimations(setting.value === true);
                break;
              case 'compact_mode':
                setCompactMode(setting.value === true);
                break;
              case 'low_stock_alerts':
                setLowStockAlerts(setting.value === true);
                break;
              case 'batch_expiry_alerts':
                setBatchExpiryAlerts(setting.value === true);
                break;
              case 'usage_report_alerts':
                setUsageReportAlerts(setting.value === true);
                break;
              case 'system_update_alerts':
                setSystemUpdateAlerts(setting.value === true);
                break;
              case 'cloud_sync':
                setCloudSync(setting.value === true);
                break;
              // Theme is handled by ThemeProvider
            }
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  const handleThemeChange = (value: string) => {
    if (value === "light" || value === "dark" || value === "system") {
      setTheme(value);
      toast.success(`Theme changed to ${value} mode`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Save all settings to database
      const settingsToSave = [
        { key: 'notifications_enabled', value: notificationsEnabled },
        { key: 'email_alerts', value: emailAlerts },
        { key: 'auto_backup', value: autoBackup },
        { key: 'animations', value: animations },
        { key: 'compact_mode', value: compactMode },
        { key: 'low_stock_alerts', value: lowStockAlerts },
        { key: 'batch_expiry_alerts', value: batchExpiryAlerts },
        { key: 'usage_report_alerts', value: usageReportAlerts },
        { key: 'system_update_alerts', value: systemUpdateAlerts },
        { key: 'cloud_sync', value: cloudSync }
      ];
      
      // Save each setting
      for (const setting of settingsToSave) {
        const { error } = await settingsService.setSetting(setting.key, setting.value);
        if (error) {
          throw error;
        }
      }
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="container max-w-5xl py-6 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application preferences and configurations.
        </p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="bg-background dark:bg-gray-900 border dark:border-gray-800">
          <TabsTrigger value="appearance" className="data-[state=active]:bg-muted dark:data-[state=active]:bg-gray-800">
            <SunMoon className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-muted dark:data-[state=active]:bg-gray-800">
            <UserCog className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-muted dark:data-[state=active]:bg-gray-800">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-muted dark:data-[state=active]:bg-gray-800">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="data-[state=active]:bg-muted dark:data-[state=active]:bg-gray-800">
            <Database className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="border dark:border-gray-800">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Customize the appearance of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Color Theme</Label>
                <ToggleGroup 
                  type="single" 
                  value={theme} 
                  onValueChange={handleThemeChange} 
                  className="justify-start"
                  variant="outline"
                >
                  <ToggleGroupItem value="light" className="gap-2">
                    <SunMoon className="h-4 w-4" />
                    Light
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dark" className="gap-2">
                    <SunMoon className="h-4 w-4" />
                    Dark
                  </ToggleGroupItem>
                  <ToggleGroupItem value="system" className="gap-2">
                    <SunMoon className="h-4 w-4" />
                    System
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="animations">Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable UI animations.
                  </p>
                </div>
                <Switch 
                  id="animations" 
                  checked={animations} 
                  onCheckedChange={setAnimations}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use a more space-efficient interface layout.
                  </p>
                </div>
                <Switch 
                  id="compact-mode" 
                  checked={compactMode} 
                  onCheckedChange={setCompactMode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border dark:border-gray-800">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">In-app Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications within the application.
                  </p>
                </div>
                <Switch 
                  id="push-notifications" 
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important alerts via email.
                  </p>
                </div>
                <Switch 
                  id="email-alerts" 
                  checked={emailAlerts}
                  onCheckedChange={setEmailAlerts}
                />
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label>Alert Types</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="low-stock" 
                      checked={lowStockAlerts} 
                      onCheckedChange={setLowStockAlerts}
                    />
                    <Label htmlFor="low-stock">Low Stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="batch-expiry" 
                      checked={batchExpiryAlerts} 
                      onCheckedChange={setBatchExpiryAlerts}
                    />
                    <Label htmlFor="batch-expiry">Batch Expiry</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="usage-report" 
                      checked={usageReportAlerts} 
                      onCheckedChange={setUsageReportAlerts}
                    />
                    <Label htmlFor="usage-report">Usage Reports</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="system-updates" 
                      checked={systemUpdateAlerts} 
                      onCheckedChange={setSystemUpdateAlerts}
                    />
                    <Label htmlFor="system-updates">System Updates</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="border dark:border-gray-800">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Configure how your data is managed and backed up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-backup">Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Periodically backup your data.
                  </p>
                </div>
                <Switch 
                  id="auto-backup" 
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-sync">Cloud Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync data across multiple devices.
                  </p>
                </div>
                <Switch 
                  id="data-sync" 
                  checked={cloudSync}
                  onCheckedChange={setCloudSync}
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label>Data Export</Label>
                <div className="flex space-x-2">
                  <Button variant="outline" className="dark:border-gray-800">Export as CSV</Button>
                  <Button variant="outline" className="dark:border-gray-800">Export as JSON</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-destructive">Danger Zone</Label>
                <div className="flex space-x-2">
                  <Button variant="destructive">Delete All Data</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone. All data will be permanently deleted.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card className="border dark:border-gray-800">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Account settings coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border dark:border-gray-800">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Security settings coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" className="dark:border-gray-800">Cancel</Button>
        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </div>
    </div>
  );
};

export default Settings;
