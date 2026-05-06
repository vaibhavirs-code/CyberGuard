"use client"

import React, { useState, useRef, useEffect } from 'react';
import { TrackedCustomer, Zone } from '@/lib/types';
import { ShieldCheck, Loader2, Scan, Activity, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoFeedProps {
  customers: TrackedCustomer[];
  zones: Zone[];
  onZoneChange: (zones: Zone[]) => void;
  isEditingZones: boolean;
  videoUrl: string | null;
  onFrame: (video: HTMLVideoElement) => void;
  isModelLoading: boolean;
  fps: number;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ 
  customers, zones, onZoneChange, isEditingZones,
  videoUrl, onFrame, isModelLoading, fps
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let animationFrame: number;
    const process = async () => {
      if (videoRef.current && !videoRef.current.paused) onFrame(videoRef.current);
      animationFrame = requestAnimationFrame(process);
    };
    process();
    return () => cancelAnimationFrame(animationFrame);
  }, [onFrame]);

  return (
    <div className="relative w-full h-full bg-black group rounded-3xl overflow-hidden shadow-2xl aura-border">
      {/* Visual Source */}
      {videoUrl ? (
        <video ref={videoRef} src={videoUrl} autoPlay loop muted crossOrigin="anonymous" className="w-full h-full object-cover" />
      ) : (
        <video ref={videoRef} src="https://storage.googleapis.com/tfjs-models/demos/cvat/beach.mp4" autoPlay loop muted crossOrigin="anonymous" className="w-full h-full object-cover opacity-80" />
      )}
      
      {/* HUD Layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(15,252,235,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(15,252,235,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="w-full h-1 bg-accent/40 absolute top-0 left-0 animate-scanline shadow-[0_0_15px_hsl(var(--accent))]" />
        </div>
      </div>

      {isModelLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl">
          <div className="relative">
            <Loader2 className="w-20 h-20 text-accent animate-spin mb-8" />
            <div className="absolute inset-0 text-accent blur-xl opacity-50 animate-pulse">
               <Loader2 className="w-20 h-20" />
            </div>
          </div>
          <p className="text-accent font-code text-[12px] tracking-[1.5em] uppercase neon-text animate-pulse">Neural Synchronization</p>
        </div>
      )}

      {/* Top HUD Indicators */}
      <div className="absolute top-8 left-8 flex flex-col gap-4 pointer-events-none">
        <div className="glass px-6 py-3 rounded-2xl border-accent/40 flex items-center gap-4 backdrop-blur-2xl shadow-2xl">
          <Scan className="w-4 h-4 text-accent animate-pulse" />
          <span className="text-[11px] font-bold text-accent uppercase tracking-[0.4em] neon-text">AI Stream ACTIVE</span>
        </div>
        <div className="glass px-6 py-3 rounded-2xl border-white/10 flex items-center gap-3 backdrop-blur-2xl">
          <Activity className="w-4 h-4 text-white/70 animate-bounce" />
          <span className="text-[10px] font-code text-white/70 uppercase tracking-widest">Latency: 12ms</span>
        </div>
      </div>

      <div className="absolute top-8 right-8 pointer-events-none">
        <div className="glass px-6 py-3 rounded-2xl border-emerald-500/40 flex items-center gap-4 backdrop-blur-2xl">
           <ShieldCheck className="w-4 h-4 text-emerald-400" />
           <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">System Nominal</span>
        </div>
      </div>

      {/* Zones Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {zones.map((zone) => (
            <g key={zone.id}>
              <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height} fill={zone.color} fillOpacity="0.06" stroke={zone.color} strokeWidth="0.3" className="transition-all duration-1000" />
              <rect x={zone.x} y={zone.y} width={zone.width} height="4" fill={zone.color} fillOpacity="0.25" />
              <text x={zone.x + 1} y={zone.y + 3} fill={zone.color} style={{ fontSize: '2px', fontWeight: 'bold' }} className="uppercase tracking-[0.4em] opacity-90 drop-shadow-lg">{zone.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Tracker Visuals */}
      <div className="absolute inset-0 pointer-events-none">
        {customers.map((c) => (
          <div key={c.trackerId} className={cn("absolute border-2 transition-all duration-150 ease-linear", c.status === 'flagged' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'border-accent shadow-[0_0_30px_rgba(25,136,245,0.5)]')} style={{ left: `${c.bbox.x}%`, top: `${c.bbox.y}%`, width: `${c.bbox.w}%`, height: `${c.bbox.h}%` }}>
            <div className={cn("absolute -top-10 left-0 px-4 py-2 text-[11px] font-bold text-white rounded-t-2xl flex items-center gap-4 backdrop-blur-2xl border-t border-x border-white/20 shadow-xl", c.status === 'paid' ? 'bg-emerald-500/90' : (c.status === 'flagged' ? 'bg-red-500/90' : 'bg-primary/90'))}>
              <Target className="w-3.5 h-3.5 animate-pulse" />
              <span className="tracking-widest uppercase">{c.trackerId}</span>
              <div className="w-px h-3.5 bg-white/40" />
              <span className="font-code text-[10px] tracking-tighter">{Math.round(c.confidence * 100)}% RELIABILITY</span>
            </div>
            
            {/* HUD Corner Brackets */}
            <div className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-white animate-pulse" />
            <div className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-white animate-pulse" />
            <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-white animate-pulse" />
            <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-white animate-pulse" />
            
            {/* Interior Energy Mesh */}
            <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle,hsl(var(--accent))_1.5px,transparent_1.5px)] bg-[size:6px_6px] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Bottom Telemetry HUD */}
      <div className="absolute bottom-8 left-8 right-8 pointer-events-none flex justify-between items-end">
        <div className="glass px-8 py-5 rounded-3xl border-white/20 flex gap-12 backdrop-blur-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-[0.3em] mb-1 opacity-70">Detection FPS</span>
            <span className="text-2xl font-code text-accent font-bold leading-none tracking-tighter neon-text">{fps} <span className="text-[12px] opacity-40">PROC</span></span>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-[0.3em] mb-1 opacity-70">Tracked Entities</span>
            <span className="text-2xl font-code text-white font-bold leading-none tracking-tighter">{customers.length.toString().padStart(2, '0')} <span className="text-[12px] opacity-40">UNITS</span></span>
          </div>
        </div>
        
        <div className="glass px-6 py-4 rounded-2xl border-accent/30 flex items-center gap-4 backdrop-blur-2xl">
           <div className="w-2.5 h-2.5 rounded-full bg-accent glow-pulse" />
           <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Real-time Stream: ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
};