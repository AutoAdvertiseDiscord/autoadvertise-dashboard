import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Users, Send, Activity, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) return <DashboardLayout><div className="flex h-full items-center justify-center text-muted-foreground">Loading dashboard...</div></DashboardLayout>;

  const statCards = [
    { title: "Total Accounts", value: stats?.totalAccounts || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Active Now", value: stats?.activeAccounts || 0, icon: Activity, color: "text-green-400", bg: "bg-green-400/10" },
    { title: "Messages Sent", value: stats?.totalMessagesSent || 0, icon: Send, color: "text-primary", bg: "bg-primary/10" },
    { title: "Errors", value: stats?.errorAccounts || 0, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Overview</h1>
          <p className="text-muted-foreground">Monitor your automated advertising performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                      <h2 className="text-4xl font-bold text-white tracking-tight">{stat.value.toLocaleString()}</h2>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                      <stat.icon size={22} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {stats?.recentLogs?.length === 0 && <p className="text-muted-foreground text-sm">No recent activity.</p>}
                  {stats?.recentLogs?.map((log, i) => (
                    <div key={i} className="flex items-start gap-4 text-sm">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        log.level === 'success' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' :
                        log.level === 'error' ? 'bg-destructive shadow-[0_0_8px_rgba(248,113,113,0.6)]' :
                        log.level === 'warn' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' :
                        'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                      }`} />
                      <div className="flex-1">
                        <p className="text-white font-medium">{log.action} <span className="text-muted-foreground font-normal ml-2">{log.accountName && `on ${log.accountName}`}</span></p>
                        {log.details && <p className="text-muted-foreground mt-0.5">{log.details}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>License Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={stats?.licenseStatus === 'active' ? 'success' : 'destructive'} className="uppercase">
                      {stats?.licenseStatus || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="text-white font-medium capitalize text-lg">{stats?.licensePlan || 'N/A'}</span>
                  </div>
                  {stats?.licenseExpiry && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="text-white font-mono">{new Date(stats.licenseExpiry).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
