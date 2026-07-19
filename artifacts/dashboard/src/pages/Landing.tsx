import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { motion } from "framer-motion";

export function Landing() {
  const { data: user, isLoading } = useGetMe();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      if (!user.hasLicense) setLocation("/redeem");
      else setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const handleLogin = () => {
    window.location.href = "/api/auth/discord";
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center text-center px-4">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vh] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vh] bg-[#5865F2]/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-3xl"
      >
        <div className="w-20 h-20 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(88,101,242,0.3)] border border-[#5865F2]/20">
          <SiDiscord className="text-[#5865F2] w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-primary mb-8 backdrop-blur-sm">
          <Zap size={14} className="fill-primary" /> AutoAdvertise v2.0 is live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
          Automate your Discord <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            advertising.
          </span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          The premium command center for Discord power users. Manage multiple accounts, schedule messages, and track performance with absolute precision.
        </p>
        
        <Button 
          size="lg" 
          onClick={handleLogin} 
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-none shadow-[0_0_30px_-5px_rgba(88,101,242,0.6)] h-14 px-8 rounded-full text-base font-medium transition-all"
        >
          <SiDiscord className="mr-3 h-6 w-6" />
          Login with Discord
        </Button>
      </motion.div>
    </div>
  );
}
