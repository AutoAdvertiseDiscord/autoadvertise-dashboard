import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRedeemLicense, useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function Redeem() {
  const { data: user, isLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const redeem = useRedeemLicense();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && user?.hasLicense) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!key.trim()) return;
    
    redeem.mutate({ data: { key: key.trim().toUpperCase() } }, {
      onSuccess: async () => {
        // Await the refetch so AuthGuard sees hasLicense:true before we navigate
        await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        // err is an ApiError — the server JSON body is in err.data
        setError(err?.data?.error || err?.message || "Failed to redeem license key");
      }
    });
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vh] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md">
        <Card className="border-white/10 bg-card/60 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              <Key className="w-7 h-7 text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Activate License</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Enter your license key to unlock the dashboard.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeem} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Input 
                  placeholder="XXXX-XXXX-XXXX-XXXX" 
                  value={key} 
                  onChange={(e) => setKey(e.target.value)}
                  className="font-mono text-center text-lg h-12 uppercase tracking-widest bg-black/40 border-white/20"
                  autoFocus
                />
                {error && <p className="text-destructive text-sm text-center font-medium">{error}</p>}
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={redeem.isPending || !key.trim()}>
                {redeem.isPending ? "Activating..." : "Activate Now"}
                {!redeem.isPending && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
