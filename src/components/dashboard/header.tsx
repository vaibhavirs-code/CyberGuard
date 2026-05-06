"use client"

import React from 'react';
import { Shield, Cpu, Activity, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 glass flex items-center justify-between px-6 border-b z-20 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-lg neon-border">
          <Shield className="w-6 h-6 text-accent animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-headline font-bold tracking-wider uppercase text-white">
            CyberGuard <span className="text-accent">Vision</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            Next-Gen AI Security Protocol
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8 text-xs font-medium">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[9px]">Neural Engine</span>
            <span className="text-white">Active (v2.5)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[9px]">System Health</span>
            <span className="text-accent font-bold">OPTIMAL</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[9px]">Response Latency</span>
            <span className="text-white">12ms</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-2 w-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#0FFCEB]" />
        <span className="text-[11px] font-code text-accent uppercase tracking-widest">Live Feed Processing</span>
      </div>
    </header>
  );
};
