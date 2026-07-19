import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useGetLicenseInfo } from "@workspace/api-client-react";
import { ShieldCheck, Clock, CalendarDays, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function License() {
  const { data: license, isLoading } = useGetLicenseInfo();

  if (isLoading) return <DashboardLayout><div className="p-8 text-muted-foreground">Loading license info...</div></DashboardLayout>;

  const maskedKey = license?.key ? `${license.key.slice(0, 4)} - XXXX - XXXX - ${license.key.slice(-4)}` : "XXXX-XXXX-XXXX-XXXX";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">License Information</h1>
          <p className="text-muted-foreground">Manage your AutoAdvertise subscription and billing details.</p>
        </div>

        <Card className="relative overflow-hidden border border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] p-8 opacity-[0.03] pointer-events-none">
            <ShieldCheck size={400} />
          </div>
          
          <CardContent className="p-10 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
              <div>
                <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-3 flex items-center gap-2">
                  <KeyRound size={16} /> Activation Key
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white font-mono tracking-wider bg-black/40 px-6 py-4 rounded-xl border border-white/10 shadow-inner inline-block">
                  {maskedKey}
                </h2>
              </div>
              <div className="flex flex-col gap-3 items-end">
                <Badge variant={license?.status === 'active' ? 'success' : 'destructive'} className="text-sm px-4 py-1.5 uppercase font-bold tracking-widest">
                  {license?.status} Status
                </Badge>
                <Badge variant="outline" className="text-sm px-4 py-1.5 uppercase font-bold tracking-widest text-primary border-primary/50 bg-primary/10">
                  {license?.plan} PLAN
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/10">
              <div className="flex gap-5 items-center bg-black/20 p-5 rounded-xl border border-white/5">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <CalendarDays className="text-muted-foreground w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Redeemed On</p>
                  <p className="text-xl text-white font-semibold">
                    {license?.redeemedAt ? new Date(license.redeemedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-5 items-center bg-black/20 p-5 rounded-xl border border-white/5">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Clock className="text-primary w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Expires On</p>
                  <p className="text-xl text-white font-semibold">
                    {license?.expiresAt ? new Date(license.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Lifetime Access'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
