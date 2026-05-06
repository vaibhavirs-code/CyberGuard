"use client"

import React, { useEffect, useRef } from 'react';
import { SystemLog } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Terminal, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

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
    <div className="flex flex-col h-full glass rounded-2xl overflow-hidden aura-border">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-[0.3em]">System Event Stream</h3>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">LOG_LEVEL: VERBOSE</span>
          <select className="bg-transparent text-[10px] font-bold uppercase border-none focus:ring-0 text-muted-foreground cursor-pointer">
            <option>All Events</option>
            <option>Alerts Only</option>
            <option>System Only</option>
          </select>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 font-code text-[11px] hide-scrollbar bg-black/20">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 group animate-in slide-in-from-left-2 duration-300">
            <span className="text-muted-foreground/40 shrink-0 font-bold">
              [{format(new Date(log.timestamp), 'HH:mm:ss')}]
            </span>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{getIcon(log.type)}</div>
              <p className={cn(
                "leading-relaxed tracking-wide",
                log.type === 'error' && "text-red-400 font-bold",
                log.type === 'success' && "text-emerald-400",
                log.type === 'alert' && "text-red-500 animate-pulse",
                log.type === 'warning' && "text-yellow-400",
                log.type === 'info' && "text-muted-foreground/80"
              )}>
                <span className="uppercase font-bold opacity-60 mr-2">{log.type}:</span>
                {log.message}
              </p>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground/30 font-bold uppercase tracking-[0.5em] animate-pulse">
            Neural Core Online // Ready
          </div>
        )}
      </div>
    </div>
  );
};