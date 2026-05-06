"use client"

import React from 'react';
import { LayoutDashboard, Video, BarChart3, ListTree, Laptop, Share2, Settings, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Video, label: 'Live Feed' },
  { icon: BarChart3, label: 'AI Analytics' },
  { icon: ListTree, label: 'Event Stream' },
  { icon: Laptop, label: 'Devices' },
  { icon: Share2, label: 'Integrations' },
  { icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-20 lg:w-64 glass border-r border-white/10 flex flex-col items-center py-6 z-30 transition-all duration-500 hover:w-64 group/sidebar">
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center aura-border glow-pulse">
          <ShieldCheck className="w-7 h-7 text-accent" />
        </div>
        <div className="hidden lg:flex flex-col items-center group-hover/sidebar:flex">
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-50 text-foreground">CyberGuard</span>
          <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-accent">Neural Core v2.5</span>
        </div>
      </div>

      <nav className="flex-1 w-full px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all relative overflow-hidden group",
              item.active 
                ? "bg-accent/15 text-accent border border-accent/30 aura-border" 
                : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
            )}
          >
            <div className={cn("shrink-0 p-1 rounded-lg transition-colors", item.active ? "bg-accent/20" : "group-hover:bg-accent/10")}>
              <item.icon className={cn("w-5 h-5", item.active ? "text-accent" : "group-hover:text-foreground")} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider hidden lg:block group-hover/sidebar:block whitespace-nowrap">{item.label}</span>
            {item.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_15px_hsl(var(--accent))]" />}
          </button>
        ))}
      </nav>

      <div className="w-full px-3 mt-auto">
        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 glass aura-border hidden lg:block group-hover/sidebar:block overflow-hidden relative">
          <div className="absolute inset-0 shimmer opacity-30" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-[9px] font-bold uppercase text-red-400 tracking-widest">System Protocol</span>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold text-foreground">ENCRYPTED</span>
            <Badge variant="outline" className="text-[8px] h-4 border-emerald-500/30 text-emerald-400 bg-emerald-500/5">ACTIVE</Badge>
          </div>
        </div>
        {/* Compact version for small sidebar */}
        <div className="flex lg:hidden group-hover/sidebar:hidden justify-center py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 glow-pulse" />
        </div>
      </div>
    </aside>
  );
};