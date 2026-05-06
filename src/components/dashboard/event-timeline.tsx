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
    <div className="flex flex-col h-full glass rounded-xl border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider">System Event Stream</h3>
        </div>
        <span className="text-[10px] font-code text-muted-foreground">LOG_LEVEL: VERBOSE</span>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 font-code text-[11px] hide-scrollbar"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 group">
            <span className="text-muted-foreground/50 shrink-0">
              [{format(new Date(log.timestamp), 'HH:mm:ss')}]
            </span>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0">{getIcon(log.type)}</div>
              <p className={cn(
                "leading-relaxed",
                log.type === 'error' && "text-red-400 font-bold",
                log.type === 'success' && "text-emerald-400",
                log.type === 'alert' && "text-red-500 animate-pulse",
                log.type === 'warning' && "text-yellow-400",
                log.type === 'info' && "text-muted-foreground"
              )}>
                <span className="uppercase font-bold opacity-70 mr-2">{log.type}:</span>
                {log.message}
              </p>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
            Initializing System Monitoring...
          </div>
        )}
      </div>
    </div>
  );
};
