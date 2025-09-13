"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/app/data-context";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Store,
  Bell,
  Lock,
  Palette,
  Database,
  Save,
  RefreshCw,
  Download,
  Upload,
  FileText,
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { backupService } from "@/services/backupService";
import { restoreService } from "@/services/restoreService";
import { backupScheduler } from "@/services/backupScheduler";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { settings, updateSettings } = useData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: "",
    address: "",
    phone: "",
    email: "",
    currency: "৳",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlert: true,
    duePaymentAlert: true,
    newOrderAlert: true,
    emailNotifications: false,
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "light",
    compactMode: false,
    showImages: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    requirePassword: false,
    sessionTimeout: 30,
    backupEnabled: true,
  });

  // Backup state
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStats, setBackupStats] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [schedulerSettings, setSchedulerSettings] = useState({
    enabled: false,
    frequency: "daily",
    time: "02:00",
    format: "json",
    retention: 30,
    autoCleanup: true,
  });

  useEffect(() => {
    if (settings) {
      setStoreSettings(settings.store || storeSettings);
      setNotificationSettings(settings.notifications || notificationSettings);
      setAppearanceSettings(settings.appearance || appearanceSettings);
      setSecuritySettings(settings.security || securitySettings);
      setLoading(false);
    }
  }, [settings]);

  // Load backup stats and scheduler status on component mount
  useEffect(() => {
    const loadBackupData = async () => {
      try {
        const stats = await backupService.getBackupStats();
        setBackupStats(stats);

        const status = backupScheduler.getStatus();
        setSchedulerStatus(status);
        setSchedulerSettings(status.settings);
      } catch (error) {
        console.error("Error loading backup data:", error);
      }
    };
    loadBackupData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings({
        store: storeSettings,
        notifications: notificationSettings,
        appearance: appearanceSettings,
        security: securitySettings,
      });
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Backup functions
  const handleExportJSON = async () => {
    setBackupLoading(true);
    try {
      const result = await backupService.exportToJSON();
      toast({
        title: "Backup Successful",
        description: `Data exported to ${result.filename}. ${result.recordCount} records exported.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setBackupLoading(true);
    try {
      const result = await backupService.exportToCSV();
      toast({
        title: "CSV Export Successful",
        description: `${result.totalFiles} CSV files exported successfully.`,
      });
    } catch (error) {
      toast({
        title: "CSV Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleCreateCompressedBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await backupService.createCompressedBackup();
      toast({
        title: "Compressed Backup Created",
        description: `Backup saved as ${result.filename}. ${result.recordCount} records exported.`,
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validation = backupService.validateBackupFile(file);
      if (validation.valid) {
        setRestoreFile(file);
        toast({
          title: "File Selected",
          description: "Backup file is ready for restore.",
        });
      } else {
        toast({
          title: "Invalid File",
          description: validation.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      toast({
        title: "No File Selected",
        description: "Please select a backup file to restore.",
        variant: "destructive",
      });
      return;
    }

    setBackupLoading(true);
    try {
      // Parse the backup file
      const parseResult = await backupService.parseBackupFile(restoreFile);

      // Validate the backup data
      const validation = restoreService.validateBackupData(parseResult.data);
      if (!validation.valid) {
        toast({
          title: "Invalid Backup File",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        toast({
          title: "Backup Warnings",
          description: validation.warnings.join(", "),
          variant: "default",
        });
      }

      // Restore the data
      const restoreResult = await restoreService.restoreFromBackup(
        parseResult.data,
        {
          overwrite: false, // Merge with existing data
        }
      );

      if (restoreResult.success) {
        toast({
          title: "Restore Successful",
          description: `Restored ${restoreResult.summary.totalRecords} records from ${restoreResult.summary.totalCollections} collections.`,
        });

        // Download restore report
        restoreService.downloadRestoreReport(restoreResult);

        // Clear the selected file
        setRestoreFile(null);

        // Refresh backup stats
        const stats = await backupService.getBackupStats();
        setBackupStats(stats);
      } else {
        toast({
          title: "Restore Failed",
          description:
            "Some collections failed to restore. Check the restore report for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  // Scheduler functions
  const handleUpdateSchedulerSettings = async (newSettings) => {
    try {
      await backupScheduler.updateSettings(newSettings);
      setSchedulerSettings(newSettings);

      const status = backupScheduler.getStatus();
      setSchedulerStatus(status);

      toast({
        title: "Scheduler Updated",
        description:
          "Backup scheduler settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update scheduler settings.",
        variant: "destructive",
      });
    }
  };

  const handleExecuteImmediateBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await backupScheduler.executeImmediateBackup(
        schedulerSettings.format
      );
      toast({
        title: "Immediate Backup Created",
        description: `Backup created successfully. ${result.recordCount} records backed up.`,
      });

      // Refresh stats
      const stats = await backupService.getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-none shadow-md">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your application settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            disabled={saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Store className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="mr-2 h-4 w-4" />
            Backup & Restore
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Update your store details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={storeSettings.storeName}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        storeName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={storeSettings.phone}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={storeSettings.email}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency Symbol</Label>
                  <Input
                    id="currency"
                    value={storeSettings.currency}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        currency: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Store Address</Label>
                <Input
                  id="address"
                  value={storeSettings.address}
                  onChange={(e) =>
                    setStoreSettings({
                      ...storeSettings,
                      address: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when items are running low on stock
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.lowStockAlert}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      lowStockAlert: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Due Payment Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for pending payments
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.duePaymentAlert}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      duePaymentAlert: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Order Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new orders are placed
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.newOrderAlert}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      newOrderAlert: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch
                  checked={appearanceSettings.theme === "dark"}
                  onCheckedChange={(checked) =>
                    setAppearanceSettings({
                      ...appearanceSettings,
                      theme: checked ? "dark" : "light",
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing for a more compact view
                  </p>
                </div>
                <Switch
                  checked={appearanceSettings.compactMode}
                  onCheckedChange={(checked) =>
                    setAppearanceSettings({
                      ...appearanceSettings,
                      compactMode: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Images</Label>
                  <p className="text-sm text-muted-foreground">
                    Display product images in lists
                  </p>
                </div>
                <Switch
                  checked={appearanceSettings.showImages}
                  onCheckedChange={(checked) =>
                    setAppearanceSettings({
                      ...appearanceSettings,
                      showImages: checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your application security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Password Protection</Label>
                  <p className="text-sm text-muted-foreground">
                    Require password for sensitive actions
                  </p>
                </div>
                <Switch
                  checked={securitySettings.requirePassword}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      requirePassword: checked,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">
                  Session Timeout (minutes)
                </Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable automatic data backup
                  </p>
                </div>
                <Switch
                  checked={securitySettings.backupEnabled}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      backupEnabled: checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore Settings */}
        <TabsContent value="backup" className="space-y-4">
          {/* Backup Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Data Overview</CardTitle>
              <CardDescription>
                Current data statistics and backup information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupStats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {backupStats.totalCollections}
                    </div>
                    <div className="text-sm text-blue-600">Collections</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {backupStats.totalRecords}
                    </div>
                    <div className="text-sm text-green-600">Total Records</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-600">
                      {new Date(backupStats.exportDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-purple-600">Last Export</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p className="text-muted-foreground">
                    Loading data statistics...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Create backups of your data in different formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    <h3 className="font-semibold">JSON Backup</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Complete backup with all data and metadata
                  </p>
                  <Button
                    onClick={handleExportJSON}
                    disabled={backupLoading}
                    className="w-full"
                    variant="outline"
                  >
                    {backupLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export JSON
                  </Button>
                </div>

                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center mb-2">
                    <Archive className="h-5 w-5 mr-2 text-green-600" />
                    <h3 className="font-semibold">CSV Files</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Export each collection as separate CSV files
                  </p>
                  <Button
                    onClick={handleExportCSV}
                    disabled={backupLoading}
                    className="w-full"
                    variant="outline"
                  >
                    {backupLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export CSV
                  </Button>
                </div>

                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center mb-2">
                    <Archive className="h-5 w-5 mr-2 text-purple-600" />
                    <h3 className="font-semibold">Compressed</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create a compressed backup file
                  </p>
                  <Button
                    onClick={handleCreateCompressedBackup}
                    disabled={backupLoading}
                    className="w-full"
                    variant="outline"
                  >
                    {backupLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="mr-2 h-4 w-4" />
                    )}
                    Create Backup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restore Options */}
          <Card>
            <CardHeader>
              <CardTitle>Restore Data</CardTitle>
              <CardDescription>
                Restore data from a previous backup file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center mb-4">
                  <Upload className="h-5 w-5 mr-2 text-orange-600" />
                  <h3 className="font-semibold">Restore from Backup</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a JSON backup file to restore your data
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="restore-file">Select Backup File</Label>
                    <Input
                      id="restore-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                  </div>
                  {restoreFile && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {restoreFile.name} selected
                    </div>
                  )}
                  <Button
                    onClick={handleRestore}
                    disabled={!restoreFile || backupLoading}
                    className="w-full"
                    variant="default"
                  >
                    {backupLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Restore Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Scheduler */}
          <Card>
            <CardHeader>
              <CardTitle>Automated Backups</CardTitle>
              <CardDescription>
                Schedule automatic backups of your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup your data at scheduled intervals
                  </p>
                </div>
                <Switch
                  checked={schedulerSettings.enabled}
                  onCheckedChange={(checked) =>
                    handleUpdateSchedulerSettings({
                      ...schedulerSettings,
                      enabled: checked,
                    })
                  }
                />
              </div>

              {schedulerSettings.enabled && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <select
                        id="frequency"
                        value={schedulerSettings.frequency}
                        onChange={(e) =>
                          handleUpdateSchedulerSettings({
                            ...schedulerSettings,
                            frequency: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={schedulerSettings.time}
                        onChange={(e) =>
                          handleUpdateSchedulerSettings({
                            ...schedulerSettings,
                            time: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="format">Format</Label>
                      <select
                        id="format"
                        value={schedulerSettings.format}
                        onChange={(e) =>
                          handleUpdateSchedulerSettings({
                            ...schedulerSettings,
                            format: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                        <option value="compressed">Compressed</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retention">Retention (days)</Label>
                      <Input
                        id="retention"
                        type="number"
                        value={schedulerSettings.retention}
                        onChange={(e) =>
                          handleUpdateSchedulerSettings({
                            ...schedulerSettings,
                            retention: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Cleanup</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically delete old backup files
                      </p>
                    </div>
                    <Switch
                      checked={schedulerSettings.autoCleanup}
                      onCheckedChange={(checked) =>
                        handleUpdateSchedulerSettings({
                          ...schedulerSettings,
                          autoCleanup: checked,
                        })
                      }
                    />
                  </div>

                  {schedulerStatus && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Status:{" "}
                            {schedulerStatus.isRunning ? "Running" : "Stopped"}
                          </p>
                          {schedulerStatus.nextRunTime && (
                            <p className="text-xs text-blue-700">
                              Next backup:{" "}
                              {new Date(
                                schedulerStatus.nextRunTime
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={handleExecuteImmediateBackup}
                          disabled={backupLoading}
                          size="sm"
                          variant="outline"
                        >
                          {backupLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Archive className="mr-2 h-4 w-4" />
                          )}
                          Backup Now
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Collection Details */}
          {backupStats && (
            <Card>
              <CardHeader>
                <CardTitle>Collection Details</CardTitle>
                <CardDescription>
                  Detailed breakdown of your data collections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {backupStats.collectionStats.map((collection, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center">
                        {collection.hasError ? (
                          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        )}
                        <span className="font-medium capitalize">
                          {collection.name.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {collection.count} records
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
