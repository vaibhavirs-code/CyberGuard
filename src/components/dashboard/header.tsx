
"use client"

import React, { useEffect, useState } from 'react';
import { Cpu, Activity, Moon, Sun, Terminal, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const Header: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <header className="relative h-24 px-10 flex items-center justify-between border-b border-cyan-400/20 backdrop-blur-2xl bg-black/40 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,255,0.1),transparent_40%)] pointer-events-none" />
      
      <div className="flex items-center gap-5 z-10">
        <div className="p-3.5 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
          <Shield className="w-8 h-8 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
            CyberGuard <span className="text-cyan-300 glow-text">Vision</span>
          </h1>
          <p className="uppercase tracking-[0.4em] text-[9px] text-cyan-200/60 font-bold">
            Autonomous Neural Security Core
          </p>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-6 z-10">
        <div className="flex items-center gap-4 px-6 py-3 rounded-2xl border border-cyan-400/15 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
          <div className="p-2.5 rounded-xl bg-cyan-400/10">
            <Cpu className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-100/40 font-bold">Neural Engine</p>
            <p className="text-white font-bold tracking-widest text-xs">98% SYNCED</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 rounded-2xl border border-emerald-400/15 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
          <div className="p-2.5 rounded-xl bg-emerald-400/10">
            <Activity className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-emerald-100/40 font-bold">Sentinel Status</p>
            <p className="text-emerald-300 font-bold tracking-widest text-xs">ACTIVE</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 z-10">
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-cyan-400/20 bg-white/5 shadow-inner">
          <Sun className={`w-4 h-4 transition-all ${theme === 'light' ? 'text-yellow-400 scale-110' : 'text-gray-500'}`} />
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          <Moon className={`w-4 h-4 transition-all ${theme === 'dark' ? 'text-cyan-300 scale-110' : 'text-gray-500'}`} />
        </div>

        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 hover:bg-cyan-400/20 transition-all shadow-md">
          <Terminal className="w-4 h-4 text-cyan-300 animate-pulse" />
          <span className="uppercase tracking-[0.3em] text-[10px] font-bold text-cyan-200">
            Buffer: Active
          </span>
        </div>
      </div>
    </header>
  );
};
