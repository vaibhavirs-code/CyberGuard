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
    <div className="relative w-full h-full bg-black group rounded-2xl overflow-hidden shadow-2xl">
      {/* Visual Source */}
      {videoUrl ? (
        <video ref={videoRef} src={videoUrl} autoPlay loop muted crossOrigin="anonymous" className="w-full h-full object-cover" />
      ) : (
        <video ref={videoRef} src="https://storage.googleapis.com/tfjs-models/demos/cvat/beach.mp4" autoPlay loop muted crossOrigin="anonymous" className="w-full h-full object-cover opacity-70 grayscale brightness-75" />
      )}
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(15,252,235,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,252,235,0.08)_1px,transparent_1px)] bg-[size:30px_30px]" />
      
      {/* HUD Scanner */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="w-full h-[20%] bg-gradient-to-b from-transparent via-accent/40 to-transparent animate-scanline absolute top-0 left-0" />
      </div>

      {isModelLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
          <Loader2 className="w-16 h-16 text-accent animate-spin mb-6" />
          <p className="text-accent font-code text-[10px] tracking-[1em] uppercase neon-text animate-pulse">Neural Initialization...</p>
        </div>
      )}

      {/* HUD Elements */}
      <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
        <div className="glass px-5 py-2.5 rounded-xl border-accent/30 flex items-center gap-3 backdrop-blur-md shadow-lg">
          <Scan className="w-4 h-4 text-accent animate-pulse" />
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">AI Stream: Nominal</span>
        </div>
        <div className="glass px-5 py-2.5 rounded-xl border-white/10 flex items-center gap-2 backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          <span className="text-[9px] font-code text-white/70 uppercase tracking-widest">Protocol: CV-4589-X</span>
        </div>
      </div>

      <div className="absolute top-6 right-6 pointer-events-none">
        <div className="glass px-5 py-2.5 rounded-xl border-emerald-500/30 flex items-center gap-3 backdrop-blur-md">
           <ShieldCheck className="w-4 h-4 text-emerald-400" />
           <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Vision Secure</span>
        </div>
      </div>

      {/* Zones Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {zones.map((zone) => (
            <g key={zone.id}>
              <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height} fill={zone.color} fillOpacity="0.08" stroke={zone.color} strokeWidth="0.25" className="transition-all duration-700" />
              <rect x={zone.x} y={zone.y} width={zone.width} height="4" fill={zone.color} fillOpacity="0.2" />
              <text x={zone.x + 0.8} y={zone.y + 2.8} fill={zone.color} style={{ fontSize: '1.8px', fontWeight: 'bold' }} className="uppercase tracking-[0.3em] opacity-90 drop-shadow-md">{zone.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Tracker Visuals */}
      <div className="absolute inset-0 pointer-events-none">
        {customers.map((c) => (
          <div key={c.trackerId} className={cn("absolute border-2 transition-all duration-150 ease-linear", c.status === 'flagged' ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)]' : 'border-accent shadow-[0_0_25px_rgba(25,136,245,0.4)]')} style={{ left: `${c.bbox.x}%`, top: `${c.bbox.y}%`, width: `${c.bbox.w}%`, height: `${c.bbox.h}%` }}>
            <div className={cn("absolute -top-9 left-0 px-3 py-1.5 text-[10px] font-bold text-white rounded-t-xl flex items-center gap-3 backdrop-blur-md", c.status === 'paid' ? 'bg-emerald-500/80' : (c.status === 'flagged' ? 'bg-red-500/80' : 'bg-primary/80'))}>
              <span className="tracking-widest uppercase">{c.trackerId}</span>
              <div className="w-px h-3 bg-white/30" />
              <span className="font-code text-[9px]">{Math.round(c.confidence * 100)}% DET</span>
            </div>
            
            {/* HUD Corner Accents */}
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-white/90" />
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-white/90" />
            <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-white/90" />
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-white/90" />
            
            {/* Interior Mesh */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,hsl(var(--accent))_1px,transparent_1px)] bg-[size:4px_4px]" />
          </div>
        ))}
      </div>

      {/* Stats overlay */}
      <div className="absolute bottom-6 left-6 pointer-events-none">
        <div className="glass px-6 py-4 rounded-2xl border-white/10 flex gap-10 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-[0.2em] mb-1">Processing Velocity</span>
            <span className="text-xl font-code text-accent font-bold leading-none tracking-tighter">{fps} <span className="text-[10px] opacity-50">FPS</span></span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-[0.2em] mb-1">Active Entities</span>
            <span className="text-xl font-code text-white font-bold leading-none tracking-tighter">{customers.length.toString().padStart(2, '0')} <span className="text-[10px] opacity-50">TGT</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};