"use client"

import React, { useEffect, useState } from 'react';
import { Shield, Cpu, Activity, Zap, Moon, Sun, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <header className="h-20 glass flex items-center justify-between px-8 border-b border-white/10 z-20 transition-all duration-700 relative overflow-hidden">
      <div className="absolute inset-0 shimmer opacity-10 pointer-events-none" />
      
      <div className="flex items-center gap-5 relative z-10">
        <div className="flex flex-col">
          <h1 className="text-2xl font-headline font-bold tracking-tight uppercase text-foreground leading-none">
            CyberGuard <span className="text-accent neon-text">Vision</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <p className="text-[9px] uppercase tracking-[0.5em] text-muted-foreground font-bold">
              Neural Network Interface
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-10 text-xs font-bold relative z-10">
        <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-help group">
          <div className="p-1.5 rounded-lg bg-primary/15 group-hover:scale-110 transition-transform">
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[8px] tracking-widest">Neural Load</span>
            <span className="text-foreground uppercase tracking-[0.2em] text-[11px]">8.4% (Optimal)</span>
          </div>
        </div>
        <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-help group">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 group-hover:scale-110 transition-transform">
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[8px] tracking-widest">Security</span>
            <span className="text-emerald-400 uppercase tracking-[0.2em] text-[11px]">Active Link</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 relative z-10">
        <div className="flex items-center gap-4 bg-white/5 p-2 px-5 rounded-full border border-white/10 aura-border group">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest group-hover:text-foreground transition-colors">Interface</span>
          <div className="flex items-center gap-3">
            <Sun className={cn("w-4 h-4 transition-all duration-500", theme === 'light' ? "text-yellow-400 scale-125" : "text-muted-foreground opacity-50")} />
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-accent" />
            <Moon className={cn("w-4 h-4 transition-all duration-500", theme === 'dark' ? "text-accent scale-125 neon-text" : "text-muted-foreground opacity-50")} />
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-accent/10 px-5 py-2.5 rounded-xl border border-accent/20">
          <Terminal className="w-4 h-4 text-accent animate-pulse" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">Live Matrix Stream</span>
        </div>
      </div>
    </header>
  );
};