"use client"

import React, { useEffect, useState } from 'react';
import { Cpu, Activity, Moon, Sun, Terminal, Shield, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export const Header: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
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
    <header className="relative h-20 px-8 flex items-center justify-between border-b border-primary/20 glass dark:bg-black/60 bg-white/60 z-50">
      <div className="flex items-center gap-6">
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(0,255,255,0.2)] group hover:scale-105 transition-transform">
          <Shield className="w-7 h-7 text-primary animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground font-headline">
            CyberGuard <span className="text-primary glow-text">Vision</span>
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[8px] h-4 uppercase tracking-[0.2em] border-primary/20 text-primary/70">
              Autonomous Neural Security
            </Badge>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-8">
        <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-primary/10 bg-white/5 hover:bg-white/10 transition-all">
          <Cpu className="w-4 h-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Processor</span>
            <span className="text-[10px] font-bold text-foreground">98% Synced</span>
          </div>
        </div>
        <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl border border-emerald-500/10 bg-white/5 hover:bg-white/10 transition-all">
          <Zap className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Sentinel</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Active</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-primary/20 bg-white/5">
          <Sun className={`w-3.5 h-3.5 transition-all ${theme === 'light' ? 'text-yellow-500 scale-110' : 'text-muted-foreground'}`} />
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} className="scale-75" />
          <Moon className={`w-3.5 h-3.5 transition-all ${theme === 'dark' ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
        </div>

        <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-all cursor-pointer">
          <Terminal className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Buffer</span>
        </div>
      </div>
    </header>
  );
};