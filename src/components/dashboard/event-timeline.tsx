"use client"

import React, { useEffect, useRef } from 'react';
import { SystemLog } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Terminal, Info, AlertTriangle, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface EventTimelineProps {
  logs: SystemLog[];
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getIcon = (type: SystemLog['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'error': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
      case 'alert': return <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />;
      default: return <Info className="w-3.5 h-3.5 text-primary" />;
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-2xl overflow-hidden aura-border transition-all duration-700">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 shimmer opacity-5" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-2 rounded-lg bg-accent/20">
            <Terminal className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-foreground">Matrix Event Stream</h3>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Buffer Sync: ACTIVE</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3 font-code text-[11px] hide-scrollbar bg-black/40">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 group animate-in slide-in-from-left-4 duration-500 items-start border-l-2 border-white/5 pl-4 hover:border-accent/40 transition-all hover:bg-white/5 py-1">
            <span className="text-muted-foreground/30 shrink-0 font-bold tabular-nums">
              {format(new Date(log.timestamp), 'HH:mm:ss:SSS')}
            </span>
            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0">{getIcon(log.type)}</div>
              <p className={cn(
                "leading-relaxed tracking-wider",
                log.type === 'error' && "text-red-400 font-bold",
                log.type === 'success' && "text-emerald-400",
                log.type === 'alert' && "text-red-500 animate-pulse",
                log.type === 'warning' && "text-yellow-400",
                log.type === 'info' && "text-muted-foreground/80"
              )}>
                <span className="uppercase font-bold opacity-40 mr-2 tracking-tighter">[{log.type}]</span>
                <span className="text-foreground/90">{log.message}</span>
              </p>
            </div>
            <ChevronRight className="w-3 h-3 text-white/10 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/20 font-bold uppercase tracking-[1em] space-y-4">
            <div className="w-16 h-px bg-current animate-pulse" />
            <span className="animate-pulse">Awaiting Buffer Ingestion</span>
            <div className="w-16 h-px bg-current animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};