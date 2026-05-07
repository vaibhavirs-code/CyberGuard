"use client"

import React, { useEffect, useState } from 'react';
import { Cpu, Activity, Moon, Sun, Terminal, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

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
    <header className="h-28 glass flex items-center justify-between px-12 border-b border-white/10 z-20 transition-all duration-700 relative overflow-hidden">
      <div className="absolute inset-0 shimmer opacity-15 pointer-events-none" />
      
      <div className="flex items-center gap-8 relative z-10">
        <div className="flex flex-col">
          <h1 className="text-4xl font-headline font-bold tracking-tighter uppercase text-foreground leading-none flex items-center gap-4">
            <Shield className="w-9 h-9 text-accent neon-text" />
            CyberGuard <span className="text-accent neon-text">Vision</span>
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-[0_0_15px_hsl(var(--accent))]" />
            <p className="text-[11px] uppercase tracking-[0.6em] text-muted-foreground font-bold opacity-80">
              Autonomous Neural Link Inbound
            </p>
          </div>
        </div>
      </div>

      <div className="hidden xl:flex items-center gap-12 text-xs font-bold relative z-10">
        <div className="flex items-center gap-6 px-8 py-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-help group aura-border shadow-lg">
          <div className="p-3 rounded-2xl bg-primary/20 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(25,136,245,0.3)]">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[10px] tracking-widest opacity-70">Buffer Capacity</span>
            <span className="text-foreground uppercase tracking-[0.4em] text-[14px] font-code">94.2% SYNCED</span>
          </div>
        </div>
        <div className="flex items-center gap-6 px-8 py-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-help group aura-border shadow-lg">
          <div className="p-3 rounded-2xl bg-emerald-500/20 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Activity className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[10px] tracking-widest opacity-70">Security Protocol</span>
            <span className="text-emerald-400 uppercase tracking-[0.4em] text-[14px] font-code">ULTRA SECURE</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-10 relative z-10">
        <div className="flex items-center gap-6 bg-white/5 px-8 py-3 rounded-full border border-white/15 aura-border group transition-all hover:bg-white/10 shadow-lg">
          <span className="text-[12px] uppercase font-bold text-muted-foreground tracking-[0.4em] group-hover:text-foreground transition-colors">OS MODE</span>
          <div className="flex items-center gap-5">
            <Sun className={cn("w-6 h-6 transition-all duration-700", theme === 'light' ? "text-yellow-400 scale-125 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" : "text-muted-foreground opacity-40")} />
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-accent" />
            <Moon className={cn("w-6 h-6 transition-all duration-700", theme === 'dark' ? "text-accent scale-125 neon-text" : "text-muted-foreground opacity-40")} />
          </div>
        </div>
        
        <div className="flex items-center gap-6 bg-accent/15 px-8 py-4 rounded-3xl border border-accent/40 shadow-[0_0_30px_rgba(15,252,235,0.2)] group cursor-pointer hover:bg-accent/25 transition-all">
          <Terminal className="w-6 h-6 text-accent animate-pulse" />
          <span className="text-[12px] font-bold text-accent uppercase tracking-[0.5em] group-hover:neon-text">Buffer Active</span>
        </div>
      </div>
    </header>
  );
};