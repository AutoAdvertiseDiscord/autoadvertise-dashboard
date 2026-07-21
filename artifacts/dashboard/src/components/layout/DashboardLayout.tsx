import { Link, useLocation } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, ScrollText, Settings, Key, LogOut, Menu, ChevronLeft } from "lucide-react";
import { useGetMe, useLogout } from "@workspace/api-client-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/accounts", label: "Accounts", icon: Users },
    { href: "/dashboard/logs", label: "Logs", icon: ScrollText },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/dashboard/license", label: "License", icon: Key },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        className="flex flex-col border-r border-white/10 bg-card/50 backdrop-blur-2xl relative z-20 shrink-0"
      >
        <div className="p-4 flex items-center justify-between h-[72px]">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-sm shadow-[0_0_15px_rgba(124,58,237,0.5)]">A</div>
              AutoAd
            </motion.div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className={`p-2 hover:bg-white/5 rounded-md text-muted-foreground transition-colors ${collapsed ? 'mx-auto' : ''}`}>
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? "bg-primary/10 text-primary font-medium shadow-[inset_2px_0_0_currentColor]" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}>
                <item.icon size={20} className={isActive ? "text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]" : ""} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mb-4`}>
            {user?.avatar ? (
              <img src={user.avatar} className="w-10 h-10 rounded-full border border-white/10" alt="avatar" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-white/10 font-medium shrink-0">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-white truncate">{user?.username}</div>
                <div className="text-xs text-primary font-medium truncate capitalize">{user?.licensePlan || 'Free'} Plan</div>
              </div>
            )}
          </div>
          <button 
            onClick={() => logout.mutate(undefined, { onSuccess: () => window.location.reload() })}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors`}
          >
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto relative bg-background">
        {/* Ambient background glow */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[20%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
