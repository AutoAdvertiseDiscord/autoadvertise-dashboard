import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Save, Bell, Shield, Webhook } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const update = useUpdateSettings();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    globalCooldown: 60,
    webhookUrl: "",
    notificationsEnabled: true
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        globalCooldown: settings.globalCooldown || 60,
        webhookUrl: settings.webhookUrl || "",
        notificationsEnabled: settings.notificationsEnabled ?? true
      });
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({
      data: {
        ...formData,
        webhookUrl: formData.webhookUrl || undefined
      }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/settings"] })
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Global Settings</h1>
          <p className="text-muted-foreground">Configure application-wide parameters.</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-muted-foreground">Loading settings...</div>
        ) : (
          <Card>
            <CardHeader className="border-b border-white/5 pb-6">
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>These settings apply to all active accounts in your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="space-y-8">
                
                <div className="flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-black/20">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                    <Bell size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Enable Notifications</h3>
                        <p className="text-sm text-muted-foreground mt-1">Receive system alerts for account errors and status changes.</p>
                      </div>
                      <Switch 
                        checked={formData.notificationsEnabled} 
                        onCheckedChange={c => setFormData({...formData, notificationsEnabled: c})} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white font-medium mb-1">
                      <Shield size={18} className="text-primary" />
                      <h3>Global Minimum Cooldown</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Hard limit to prevent API spam. Overrides individual account settings if higher.</p>
                    <div className="flex items-center gap-3">
                      <Input 
                        type="number" 
                        min="1" 
                        value={formData.globalCooldown} 
                        onChange={e => setFormData({...formData, globalCooldown: Number(e.target.value)})} 
                        className="w-32 font-mono text-lg"
                      />
                      <span className="text-muted-foreground font-medium">seconds</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white font-medium mb-1">
                      <Webhook size={18} className="text-primary" />
                      <h3>Discord Webhook URL</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Send system logs and critical alerts directly to a Discord channel.</p>
                    <Input 
                      value={formData.webhookUrl} 
                      onChange={e => setFormData({...formData, webhookUrl: e.target.value})} 
                      placeholder="https://discord.com/api/webhooks/..." 
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <Button type="submit" disabled={update.isPending} size="lg" className="px-8">
                    <Save className="w-5 h-5 mr-2" />
                    {update.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
