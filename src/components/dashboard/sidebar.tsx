"use client"

import React from 'react';
import { LayoutDashboard, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-20 lg:w-56 glass border-r border-white/10 flex flex-col items-center py-8 z-30 transition-all duration-700 hover:w-56 group/sidebar overflow-hidden">
      <div className="flex flex-col items-center gap-4 mb-14 px-4 w-full">
        <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center aura-border glow-pulse transition-transform duration-500 group-hover/sidebar:scale-110">
          <ShieldCheck className="w-7 h-7 text-accent" />
        </div>
        <div className="hidden lg:flex flex-col items-center group-hover/sidebar:flex animate-in fade-in slide-in-from-top-2">
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-50 text-foreground">CyberGuard</span>
          <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-accent">Operations Console</span>
        </div>
      </div>

      <nav className="flex-1 w-full px-4 space-y-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative overflow-hidden group",
              item.active 
                ? "bg-accent/15 text-accent border border-accent/40 aura-border" 
                : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
            )}
          >
            <div className={cn("shrink-0 p-1.5 rounded-xl transition-colors", item.active ? "bg-accent/20 shadow-[0_0_15px_hsl(var(--accent)/0.3)]" : "group-hover:bg-accent/10")}>
              <item.icon className={cn("w-5 h-5", item.active ? "text-accent" : "group-hover:text-foreground")} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest hidden lg:block group-hover/sidebar:block whitespace-nowrap">{item.label}</span>
            {item.active && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-accent rounded-r-full shadow-[0_0_20px_hsl(var(--accent))]" />}
          </button>
        ))}
      </nav>

      <div className="w-full px-4 mt-auto">
        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 glass aura-border hidden lg:block group-hover/sidebar:block overflow-hidden relative group/alert transition-all hover:bg-red-500/10">
          <div className="absolute inset-0 shimmer opacity-20" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-[9px] font-bold uppercase text-red-400 tracking-[0.2em]">Protocol V3</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-foreground tracking-tighter">SECURED</span>
            <Badge variant="outline" className="text-[8px] h-4 border-emerald-500/40 text-emerald-400 bg-emerald-500/5 px-1.5">ACTIVE</Badge>
          </div>
        </div>
        <div className="flex lg:hidden group-hover/sidebar:hidden justify-center py-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 glow-pulse" />
        </div>
      </div>
    </aside>
  );
};
