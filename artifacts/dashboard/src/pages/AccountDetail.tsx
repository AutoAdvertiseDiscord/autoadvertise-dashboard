import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGetAccount, useUpdateAccount, useDeleteAccount, useTestAccount } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Trash2, Send } from "lucide-react";
import { Link } from "wouter";

export function AccountDetail() {
  const params = useParams();
  const id = params.id as string;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: account, isLoading } = useGetAccount(id);
  const update = useUpdateAccount();
  const del = useDeleteAccount();
  const test = useTestAccount();

  const [formData, setFormData] = useState({
    name: "", channelIds: "", messages: "", cooldown: 3600, imageUrl: "", discordToken: ""
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        channelIds: account.channelIds.join(", "),
        messages: account.messages.join("\n"),
        cooldown: account.cooldown,
        imageUrl: account.imageUrl || "",
        discordToken: ""
      });
    }
  }, [account]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: formData.name,
      channelIds: formData.channelIds.split(',').map(s => s.trim()).filter(Boolean),
      messages: formData.messages.split('\n').map(s => s.trim()).filter(Boolean),
      cooldown: Number(formData.cooldown),
      imageUrl: formData.imageUrl || undefined
    };
    if (formData.discordToken) payload.discordToken = formData.discordToken;

    update.mutate({ id, data: payload }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/accounts", id] })
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this account? All history will be lost.")) {
      del.mutate({ id }, { onSuccess: () => setLocation("/dashboard/accounts") });
    }
  };

  if (isLoading) return <DashboardLayout><div className="p-8 text-muted-foreground">Loading account details...</div></DashboardLayout>;
  if (!account) return <DashboardLayout><div className="p-8 text-muted-foreground">Account not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/accounts">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-4">
              {account.name}
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                account.status === 'running' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                account.status === 'error' ? 'bg-destructive/20 text-destructive border border-destructive/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>{account.status}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">ID: <span className="font-mono">{account.id}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-white mb-1.5 block">Account Name</label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-1.5 block">Update Token</label>
                    <p className="text-xs text-muted-foreground mb-2">Leave blank to keep the current token.</p>
                    <Input type="password" value={formData.discordToken} onChange={e => setFormData({...formData, discordToken: e.target.value})} placeholder="••••••••••••••••••••••••" className="font-mono" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-1.5 block">Channel IDs</label>
                    <Textarea value={formData.channelIds} onChange={e => setFormData({...formData, channelIds: e.target.value})} required className="font-mono text-sm min-h-[80px]" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-1.5 block">Messages</label>
                    <Textarea value={formData.messages} onChange={e => setFormData({...formData, messages: e.target.value})} required className="min-h-[150px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-white mb-1.5 block">Cooldown (s)</label>
                      <Input type="number" min="1" value={formData.cooldown} onChange={e => setFormData({...formData, cooldown: Number(e.target.value)})} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white mb-1.5 block">Image URL (optional)</label>
                      <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10 mt-6">
                    <Button type="submit" disabled={update.isPending} className="h-11 px-6">
                      <Save className="w-4 h-4 mr-2" /> 
                      {update.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Manual Actions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">Send a single test message to verify the token and channels are correct.</p>
                <Button variant="secondary" className="w-full h-11" onClick={() => test.mutate({ id })} disabled={test.isPending}>
                  <Send className="w-4 h-4 mr-2 text-primary" /> 
                  {test.isPending ? "Sending..." : "Send Test Message"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">Deleting an account is irreversible. All associated logs and statistics will be permanently removed.</p>
                <Button variant="destructive" className="w-full h-11 bg-destructive hover:bg-destructive/90 text-white border-none" onClick={handleDelete} disabled={del.isPending}>
                  <Trash2 className="w-4 h-4 mr-2" /> 
                  {del.isPending ? "Deleting..." : "Delete Account"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
