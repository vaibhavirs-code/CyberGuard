"use client"

import React, { useEffect, useState } from 'react';
import { Cpu, Activity, Moon, Sun, Terminal } from 'lucide-react';
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
    <header className="h-24 glass flex items-center justify-between px-10 border-b border-white/10 z-20 transition-all duration-700 relative overflow-hidden">
      <div className="absolute inset-0 shimmer opacity-10 pointer-events-none" />
      
      <div className="flex items-center gap-6 relative z-10">
        <div className="flex flex-col">
          <h1 className="text-3xl font-headline font-bold tracking-tighter uppercase text-foreground leading-none">
            CyberGuard <span className="text-accent neon-text">Vision</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_12px_hsl(var(--accent))]" />
            <p className="text-[10px] uppercase tracking-[0.6em] text-muted-foreground font-bold opacity-70">
              Neural Control Interface
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-12 text-xs font-bold relative z-10">
        <div className="flex items-center gap-5 px-6 py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-help group aura-border">
          <div className="p-2 rounded-xl bg-primary/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(25,136,245,0.2)]">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[9px] tracking-widest opacity-60">Neural Core Load</span>
            <span className="text-foreground uppercase tracking-[0.3em] text-[12px] font-code">8.4% (SYNCED)</span>
          </div>
        </div>
        <div className="flex items-center gap-5 px-6 py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-help group aura-border">
          <div className="p-2 rounded-xl bg-emerald-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[9px] tracking-widest opacity-60">Security Integrity</span>
            <span className="text-emerald-400 uppercase tracking-[0.3em] text-[12px] font-code">Maximum Level</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 relative z-10">
        <div className="flex items-center gap-5 bg-white/5 p-2.5 px-6 rounded-full border border-white/10 aura-border group transition-all hover:bg-white/10">
          <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-[0.3em] group-hover:text-foreground transition-colors">OS Mode</span>
          <div className="flex items-center gap-4">
            <Sun className={cn("w-5 h-5 transition-all duration-700", theme === 'light' ? "text-yellow-400 scale-125 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "text-muted-foreground opacity-30")} />
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-accent shadow-inner" />
            <Moon className={cn("w-5 h-5 transition-all duration-700", theme === 'dark' ? "text-accent scale-125 neon-text" : "text-muted-foreground opacity-30")} />
          </div>
        </div>
        
        <div className="flex items-center gap-5 bg-accent/10 px-6 py-3 rounded-2xl border border-accent/30 shadow-[0_0_20px_rgba(15,252,235,0.1)] group cursor-pointer hover:bg-accent/20 transition-all">
          <Terminal className="w-5 h-5 text-accent animate-pulse" />
          <span className="text-[11px] font-bold text-accent uppercase tracking-[0.4em] group-hover:neon-text">Buffer Live</span>
        </div>
      </div>
    </header>
  );
};