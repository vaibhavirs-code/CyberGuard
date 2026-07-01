
"use client";

import React from "react";
import { ShieldCheck, Terminal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onEnter: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.05),transparent_70%)]" />
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="w-full h-1 bg-accent/30 absolute top-0 left-0 animate-scanline shadow-[0_0_20px_hsl(var(--accent))]" />
      </div>

      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="w-24 h-24 rounded-[2rem] bg-accent/20 flex items-center justify-center aura-border glow-pulse mb-8 border border-accent/40">
          <ShieldCheck className="w-12 h-12 text-accent" />
        </div>

        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.3em] text-foreground font-headline">
            CyberGuard <span className="text-accent glow-text">Vision</span>
          </h1>
          <p className="text-muted-foreground uppercase tracking-[0.6em] text-[10px] font-bold opacity-60">
            Retail Monitoring Console / Operator Review
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Button
            onClick={onEnter}
            className="h-16 px-12 rounded-2xl bg-accent/10 border border-accent/40 text-accent hover:bg-accent/20 transition-all hover:scale-105 aura-border group overflow-hidden relative"
          >
            <div className="absolute inset-0 shimmer opacity-20 group-hover:opacity-40 transition-opacity" />
            <span className="relative z-10 text-xs font-bold uppercase tracking-[0.4em] flex items-center gap-4">
              Enter System <Terminal className="w-4 h-4 animate-pulse" />
            </span>
          </Button>
          
          <div className="flex items-center gap-3 opacity-30">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Local Session Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
