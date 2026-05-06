"use client"

import React, { useState, useRef, useEffect } from 'react';
import { TrackedCustomer, Zone } from '@/lib/types';
import { Maximize2, Camera, Settings, RefreshCcw, Loader2, ShieldCheck, AlertCircle, Scan } from 'lucide-react';
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
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

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
    <div className="relative w-full h-full bg-black group">
      {/* Visual Source */}
      {videoUrl ? (
        <video ref={videoRef} src={videoUrl} autoPlay loop muted crossOrigin="anonymous" className="w-full h-full object-cover" />
      ) : (
        <video ref={videoRef} src="https://storage.googleapis.com/tfjs-models/demos/cvat/beach.mp4" autoPlay loop muted crossOrigin="anonymous" className="w-full h-full object-cover opacity-60 grayscale brightness-50" />
      )}
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(15,252,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,252,235,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* HUD Scanner */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="w-full h-1/2 bg-gradient-to-b from-transparent via-accent/30 to-transparent animate-scanline absolute top-0 left-0" />
      </div>

      {isModelLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
          <p className="text-accent font-code text-xs tracking-[0.5em] uppercase neon-text">Neural Core Linkage...</p>
        </div>
      )}

      {/* Top Indicators */}
      <div className="absolute top-6 left-6 flex gap-4 pointer-events-none">
        <div className="glass px-5 py-2.5 rounded-lg border-accent/20 flex items-center gap-3">
          <Scan className="w-4 h-4 text-accent animate-pulse" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Feed Streaming</span>
        </div>
        <div className="glass px-5 py-2.5 rounded-lg border-white/10 flex items-center gap-2">
          <span className="text-[10px] font-code text-white/50 uppercase tracking-widest">ENC_LATENCY: 12.4ms</span>
        </div>
      </div>

      <div className="absolute top-6 right-6 pointer-events-none">
        <div className="glass px-5 py-2.5 rounded-lg border-white/10 flex items-center gap-2">
           <ShieldCheck className="w-4 h-4 text-accent" />
           <span className="text-[10px] font-bold text-white uppercase tracking-widest">Protocol Active</span>
        </div>
      </div>

      {/* Zones */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {zones.map((zone) => (
            <g key={zone.id}>
              <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height} fill={zone.color} fillOpacity="0.05" stroke={zone.color} strokeWidth="0.2" className="transition-all" />
              <text x={zone.x + 0.5} y={zone.y + 3} fill={zone.color} style={{ fontSize: '1.8px', fontWeight: 'bold' }} className="uppercase tracking-widest opacity-80">{zone.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Tracker Visuals */}
      <div className="absolute inset-0 pointer-events-none">
        {customers.map((c) => (
          <div key={c.trackerId} className={cn("absolute border-2 transition-all duration-100 ease-linear", c.status === 'flagged' ? 'border-red-500 shadow-[0_0_20px_#ef444466]' : 'border-accent shadow-[0_0_20px_#1988F566]')} style={{ left: `${c.bbox.x}%`, top: `${c.bbox.y}%`, width: `${c.bbox.w}%`, height: `${c.bbox.h}%` }}>
            <div className={cn("absolute -top-8 left-0 px-3 py-1 text-[10px] font-bold text-white rounded-t-lg flex items-center gap-2", c.status === 'paid' ? 'bg-emerald-500' : (c.status === 'flagged' ? 'bg-red-500' : 'bg-primary'))}>
              <span>{c.trackerId}</span>
              <span className="opacity-40">|</span>
              <span className="font-code">{Math.round(c.confidence * 100)}%</span>
            </div>
            <div className="absolute inset-0 opacity-10 bg-accent/20" />
            {/* Corners */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white/80" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white/80" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white/80" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white/80" />
          </div>
        ))}
      </div>

      {/* Stats overlay */}
      <div className="absolute bottom-6 left-6 pointer-events-none">
        <div className="glass px-6 py-3 rounded-xl border-white/10 flex gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">AI Processing</span>
            <span className="text-lg font-code text-accent font-bold leading-none">FPS: {fps}</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Active Targets</span>
            <span className="text-lg font-code text-white font-bold leading-none">{customers.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};