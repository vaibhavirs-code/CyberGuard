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
    <div className="w-64 glass border-r border-white/10 flex flex-col items-center py-8 z-30 transition-all">
      <div className="flex flex-col items-center gap-2 mb-12">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center aura-border">
          <ShieldCheck className="w-7 h-7 text-accent animate-pulse" />
        </div>
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-50">System Core</span>
      </div>

      <nav className="flex-1 w-full px-4 space-y-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all group",
              item.active 
                ? "bg-accent/10 text-accent border border-accent/20 aura-border" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", item.active ? "text-accent" : "group-hover:text-foreground")} />
            <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="w-full px-4 mt-auto">
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 glass aura-border">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-[10px] font-bold uppercase text-red-400">System Status</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">SECURE</span>
            <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">ACTIVE</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};