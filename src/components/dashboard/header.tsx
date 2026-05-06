"use client"

import React, { useEffect, useState } from 'react';
import { Shield, Cpu, Activity, Zap, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export const Header: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <header className="h-20 glass flex items-center justify-between px-8 border-b border-white/10 z-20 transition-all duration-700">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-headline font-bold tracking-tight uppercase text-foreground">
            CyberGuard <span className="text-accent">Vision</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-bold">
            Next-Gen AI Security Protocol
          </p>
        </div>
      </div>

      <div className="flex items-center gap-12 text-xs font-bold">
        <div className="flex items-center gap-3 group cursor-help">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all">
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[9px]">Neural Engine</span>
            <span className="text-foreground uppercase tracking-widest">Active (v2.5)</span>
          </div>
        </div>
        <div className="flex items-center gap-3 group cursor-help">
          <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all">
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[9px]">System Health</span>
            <span className="text-emerald-400 uppercase tracking-widest">OPTIMAL</span>
          </div>
        </div>
        <div className="flex items-center gap-3 group cursor-help">
          <div className="p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-all">
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[9px]">Response Latency</span>
            <span className="text-foreground uppercase tracking-widest">12ms</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 bg-white/5 p-2 px-4 rounded-full border border-white/10 aura-border">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Theme</span>
          <div className="flex items-center gap-2">
            <Sun className={cn("w-3.5 h-3.5", theme === 'light' ? "text-yellow-400" : "text-muted-foreground")} />
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-accent" />
            <Moon className={cn("w-3.5 h-3.5", theme === 'dark' ? "text-accent" : "text-muted-foreground")} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-accent glow-pulse" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Live Feed Processing</span>
        </div>
      </div>
    </header>
  );
};

import { cn } from '@/lib/utils';