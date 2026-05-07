"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TrackedCustomer, ZoneDefinition as Zone } from '@/lib/types';
import { ShieldCheck, Loader2, Scan, Activity, Target, Move, Maximize2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoFeedProps {
  customers: TrackedCustomer[];
  zones: Zone[];
  onZoneChange: (zones: Zone[]) => void;
  isEditingZones: boolean;
  videoUrl: string | null;
  onFrame: (video: HTMLVideoElement) => void;
  isModelLoading: boolean;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ 
  customers, zones, onZoneChange, isEditingZones,
  videoUrl, onFrame, isModelLoading
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{ id: string, type: 'move' | 'resize' } | null>(null);

  useEffect(() => {
    let animationFrame: number;
    const process = async () => {
      if (videoRef.current && !videoRef.current.paused) {
        onFrame(videoRef.current);
      }
      animationFrame = requestAnimationFrame(process);
    };
    process();
    return () => cancelAnimationFrame(animationFrame);
  }, [onFrame]);

  const handleZoneMouseDown = (e: React.MouseEvent, id: string, type: 'move' | 'resize') => {
    if (!isEditingZones) return;
    e.stopPropagation();
    setDragState({ id, type });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onZoneChange(zones.map(z => {
      if (z.id !== dragState.id) return z;
      if (dragState.type === 'move') {
        return { ...z, x: Math.min(Math.max(x - z.width / 2, 0), 100 - z.width), y: Math.min(Math.max(y - z.height / 2, 0), 100 - z.height) };
      } else {
        return { ...z, width: Math.max(x - z.x, 5), height: Math.max(y - z.y, 5) };
      }
    }));
  }, [dragState, zones, onZoneChange]);

  const handleMouseUp = () => setDragState(null);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full bg-black group rounded-[2.5rem] overflow-hidden shadow-2xl aura-border"
    >
      {videoUrl ? (
        <video ref={videoRef} src={videoUrl} autoPlay loop muted crossOrigin="anonymous" className="w-full h-full object-cover" />
      ) : (
        <video ref={videoRef} src="https://storage.googleapis.com/tfjs-models/demos/cvat/beach.mp4" autoPlay loop muted crossOrigin="anonymous" className="w-full h-full object-cover opacity-80" />
      )}
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(rgba(15,252,235,0.1)_2px,transparent_2px),linear-gradient(90deg,rgba(15,252,235,0.1)_2px,transparent_2px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 overflow-hidden opacity-40">
          <div className="w-full h-1 bg-accent/50 absolute top-0 left-0 animate-scanline shadow-[0_0_20px_hsl(var(--accent))]" />
        </div>
      </div>

      <div className="absolute top-8 right-8 flex items-center gap-4 pointer-events-none animate-in fade-in duration-1000">
        <div className="glass px-5 py-2 rounded-full flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">Live Stream: Encrypted</span>
        </div>
        <div className="glass px-5 py-2 rounded-full flex items-center gap-3">
          <Zap className="w-3 h-3 text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">Quantum Link</span>
        </div>
      </div>

      {isModelLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/98 backdrop-blur-3xl">
          <Loader2 className="w-24 h-24 text-accent animate-spin mb-10" />
          <p className="text-accent font-code text-[14px] tracking-[1.8em] uppercase neon-text animate-pulse">Neural Synchronization v4.0</p>
        </div>
      )}

      <div className={cn("absolute inset-0", isEditingZones ? "cursor-crosshair" : "pointer-events-none")}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {zones.map((zone) => (
            <g key={zone.id}>
              <rect 
                x={zone.x} y={zone.y} width={zone.width} height={zone.height} 
                fill={zone.color} fillOpacity={isEditingZones ? "0.2" : "0.08"} 
                stroke={zone.color} strokeWidth="0.8" 
                className={cn("transition-all", isEditingZones && "cursor-move")}
                onMouseDown={(e) => handleZoneMouseDown(e, zone.id, 'move')}
              />
              <text x={zone.x + 0.8} y={zone.y + 3.2} fill={zone.color} style={{ fontSize: '1.8px', fontWeight: 'bold' }} className="uppercase tracking-[0.2em] font-headline">{zone.label}</text>
              {isEditingZones && (
                <rect 
                  x={zone.x + zone.width - 2.5} y={zone.y + zone.height - 2.5} width="2.5" height="2.5" 
                  fill={zone.color} className="cursor-nwse-resize"
                  onMouseDown={(e) => handleZoneMouseDown(e, zone.id, 'resize')}
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {customers.map((c) => (
          <div 
            key={c.id} 
            className={cn(
              "absolute border-2 transition-all duration-150 ease-linear", 
              c.alerted ? 'border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.7)]' : 'border-accent shadow-[0_0_25px_rgba(25,136,245,0.5)]'
            )} 
            style={{ 
              left: `${c.bbox.x}%`, 
              top: `${c.bbox.y}%`, 
              width: `${c.bbox.width}%`, 
              height: `${c.bbox.height}%` 
            }}
          >
            <div className={cn(
              "absolute -top-10 left-0 px-3 py-1 text-[11px] font-bold text-white rounded-t-xl flex items-center gap-3 backdrop-blur-xl border-t border-x border-white/30 shadow-2xl", 
              c.paid ? 'bg-emerald-500/90' : (c.alerted ? 'bg-red-500/90' : 'bg-primary/90')
            )}>
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="tracking-[0.2em] uppercase">{c.id}</span>
              <div className="w-px h-4 bg-white/20" />
              <span className="font-code text-[9px] uppercase">
                {c.paid ? 'Paid' : (c.alerted ? 'Flagged' : 'Unpaid')}
              </span>
            </div>
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-white/60" />
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-white/60" />
            <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-white/60" />
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-white/60" />
          </div>
        ))}
      </div>
    </div>
  );
};
