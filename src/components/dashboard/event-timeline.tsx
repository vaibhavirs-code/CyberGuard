"use client";

import React, { useRef } from 'react';
import type { SystemLog } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Activity, CheckCircle2, Info, Repeat, ShieldCheck, Terminal } from 'lucide-react';

interface EventTimelineProps {
  logs: SystemLog[];
  title?: string;
}

function getIcon(log: SystemLog) {
  if (log.type === 'alert') {
    return <ShieldCheck className="w-3.5 h-3.5 text-red-500 animate-pulse" />;
  }

  if (log.type === 'transfer' || log.category === 'TRANSFER') {
    return <Repeat className="w-3.5 h-3.5 text-violet-400" />;
  }

  switch (log.category) {
    case 'ITEM':
      return <Activity className="w-3.5 h-3.5 text-accent" />;
    case 'PAYMENT':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    case 'EXIT':
      return <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />;
    default:
      return <Info className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ logs, title = "Event Stream" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full glass rounded-[2rem] overflow-hidden aura-border transition-all duration-700 bg-black/40">
      <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 shimmer opacity-5" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-2 rounded-lg bg-accent/20">
            <Terminal className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-foreground">{title}</h3>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 font-code text-[11px] hide-scrollbar">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 group animate-in slide-in-from-left-4 duration-500 items-start border-l-2 border-white/5 pl-6 hover:border-accent/40 transition-all hover:bg-white/5 py-3 rounded-r-xl">
            <div className="flex flex-col gap-1 w-24 shrink-0">
              <span className="text-muted-foreground/30 font-bold tabular-nums">
                {format(new Date(log.timestamp), 'HH:mm:ss:SSS')}
              </span>
              <span className="text-[8px] uppercase tracking-widest font-black opacity-40">[{log.category}]</span>
              {log.cameraId && (
                <span className="text-[8px] uppercase tracking-widest font-black text-accent/70">
                  {log.cameraId}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <div className="shrink-0">{getIcon(log)}</div>
                <p className={cn("leading-relaxed tracking-wider font-bold", log.type === 'alert' ? "text-red-500" : "text-foreground/90")}>
                  {log.message}
                  {log.cameraLabel && <span className="text-cyan-300 ml-2">[{log.cameraLabel}]</span>}
                  {log.trackerId && <span className="text-accent ml-2">[{log.trackerId}]</span>}
                  {log.relatedTrackerId && <span className="text-violet-400 ml-2">[{log.relatedTrackerId}]</span>}
                  {log.itemId && <span className="text-yellow-300 ml-2">[{log.itemId}]</span>}
                </p>
              </div>

              {log.reasoning && (
                <p className="text-[9px] text-muted-foreground/60 leading-relaxed font-medium italic border-l border-white/10 pl-3">
                  Reasoning: {log.reasoning}
                </p>
              )}

              {typeof log.confidence === "number" && (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${log.confidence * 100}%` }} />
                  </div>
                  <span className="text-[8px] font-bold opacity-30">{Math.round(log.confidence * 100)}% CONFIDENCE</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/20 font-bold uppercase tracking-[1em] space-y-4">
            <span className="animate-pulse">Buffer Empty</span>
          </div>
        )}
      </div>
    </div>
  );
};
