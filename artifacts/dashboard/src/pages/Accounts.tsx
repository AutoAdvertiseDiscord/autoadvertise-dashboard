import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useListAccounts, useCreateAccount, useStartAccount, useStopAccount } from "@workspace/api-client-react";
import { Plus, Play, Square, Settings2, Users } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export function Accounts() {
  const { data: accounts, isLoading } = useListAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const create = useCreateAccount();
  const start = useStartAccount();
  const stop = useStopAccount();

  const [formData, setFormData] = useState({
    name: "", discordToken: "", channelIds: "", messages: "", cooldown: 3600
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      data: {
        name: formData.name,
        discordToken: formData.discordToken,
        channelIds: formData.channelIds.split(',').map(s => s.trim()).filter(Boolean),
        messages: formData.messages.split('\n').map(s => s.trim()).filter(Boolean),
        cooldown: Number(formData.cooldown)
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
        setIsModalOpen(false);
        setFormData({ name: "", discordToken: "", channelIds: "", messages: "", cooldown: 3600 });
      }
    });
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    if (currentStatus === 'running') {
      stop.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/accounts"] }) });
    } else {
      start.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/accounts"] }) });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Accounts</h1>
            <p className="text-muted-foreground">Manage your Discord advertising accounts.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Account
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading accounts...</div>
        ) : accounts?.length === 0 ? (
          <Card className="border-dashed border-2 border-white/10 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No accounts yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">Add your first Discord account to start automating your advertising campaigns.</p>
              <Button onClick={() => setIsModalOpen(true)} size="lg">Add Your First Account</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts?.map((acc, i) => (
              <motion.div key={acc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="relative overflow-hidden group hover:border-white/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{acc.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="relative flex h-2.5 w-2.5">
                            {acc.status === 'running' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                              acc.status === 'running' ? 'bg-green-500' :
                              acc.status === 'error' ? 'bg-destructive' :
                              acc.status === 'pending' ? 'bg-amber-500' : 'bg-gray-500'
                            }`}></span>
                          </span>
                          <span className="text-sm text-muted-foreground capitalize font-medium">{acc.status}</span>
                        </div>
                      </div>
                      <Link href={`/dashboard/accounts/${acc.id}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white bg-white/5 rounded-full">
                          <Settings2 className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="space-y-3 mb-8 bg-black/20 rounded-lg p-4 border border-white/5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Channels</span>
                        <span className="text-white font-mono">{acc.channelIds.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Messages Sent</span>
                        <span className="text-white font-mono">{acc.totalMessagesSent || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cooldown</span>
                        <span className="text-white font-mono">{acc.cooldown}s</span>
                      </div>
                    </div>

                    <Button 
                      variant={acc.status === 'running' ? 'secondary' : 'default'} 
                      className={`w-full h-11 ${acc.status === 'running' ? 'hover:bg-destructive hover:text-white border-transparent' : ''}`}
                      onClick={() => toggleStatus(acc.id, acc.status)}
                      disabled={start.isPending || stop.isPending}
                    >
                      {acc.status === 'running' ? (
                        <><Square className="w-4 h-4 mr-2" /> Stop Automating</>
                      ) : (
                        <><Play className="w-4 h-4 mr-2 fill-current" /> Start Automating</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Discord Account">
        <form onSubmit={handleCreate} className="space-y-5 mt-2">
          <div>
            <label className="text-sm font-medium text-white mb-1.5 block">Account Name</label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Main Alt" required />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-1.5 block">Discord Token</label>
            <Input type="password" value={formData.discordToken} onChange={e => setFormData({...formData, discordToken: e.target.value})} placeholder="Account auth token" required />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-1.5 block">Channel IDs</label>
            <p className="text-xs text-muted-foreground mb-2">Comma separated list of Discord channel IDs.</p>
            <Textarea value={formData.channelIds} onChange={e => setFormData({...formData, channelIds: e.target.value})} placeholder="123456789, 987654321" required className="min-h-[60px] font-mono" />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-1.5 block">Messages</label>
            <p className="text-xs text-muted-foreground mb-2">One message per line. Will cycle through them.</p>
            <Textarea value={formData.messages} onChange={e => setFormData({...formData, messages: e.target.value})} placeholder="Hello world!&#10;Check out my project!" required className="min-h-[100px]" />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-1.5 block">Cooldown (seconds)</label>
            <Input type="number" min="1" value={formData.cooldown} onChange={e => setFormData({...formData, cooldown: Number(e.target.value)})} required />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-white/10 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? "Adding..." : "Add Account"}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
