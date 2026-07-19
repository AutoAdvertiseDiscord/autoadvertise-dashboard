import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useGetLogs } from "@workspace/api-client-react";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export function Logs() {
  const [level, setLevel] = useState<string>("");
  const params = level ? { level: level as any } : undefined;
  const { data, isLoading } = useGetLogs(params);
  const queryClient = useQueryClient();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        <div className="flex justify-between items-end mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Logs</h1>
            <p className="text-muted-foreground">Real-time activity and error tracking.</p>
          </div>
          <div className="flex gap-3">
            <select 
              className="bg-black/40 border border-white/10 rounded-md px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 cursor-pointer"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
            <Button variant="outline" size="icon" className="h-[42px] w-[42px]" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/logs"] })}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col bg-black/40 border-white/10 backdrop-blur-xl">
          <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground font-mono">Loading system logs...</div>
            ) : data?.logs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground font-mono">No logs found for the selected filter.</div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-white/10 text-muted-foreground z-10 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-semibold w-48">Timestamp</th>
                    <th className="p-4 font-semibold w-28">Level</th>
                    <th className="p-4 font-semibold w-56">Account</th>
                    <th className="p-4 font-semibold">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {data?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-muted-foreground text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded uppercase text-[10px] font-bold tracking-wider ${
                          log.level === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          log.level === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                          log.level === 'warn' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>{log.level}</span>
                      </td>
                      <td className="p-4 text-white/90 truncate max-w-[14rem]">{log.accountName || '-'}</td>
                      <td className="p-4 text-white/90">
                        {log.action}
                        {log.details && <span className="text-muted-foreground ml-3 text-xs">{log.details}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
