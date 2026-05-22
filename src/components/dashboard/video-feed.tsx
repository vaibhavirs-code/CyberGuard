
"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TrackedCustomer, ZoneDefinition as Zone } from '@/lib/types';
import { ShieldCheck, Loader2, Scan, Activity, Target, Move, Maximize2, Zap, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    let anim: number;
    const proc = () => {
      if (videoRef.current && !videoRef.current.paused) {
        onFrame(videoRef.current);
      }
      anim = requestAnimationFrame(proc);
    };
    proc();
    return () => cancelAnimationFrame(anim);
  }, [onFrame]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black group rounded-[2.5rem] overflow-hidden shadow-2xl aura-border border-white/5">
      {videoUrl ? (
        <video ref={videoRef} src={videoUrl} autoPlay loop muted crossOrigin="anonymous" className="w-full h-full object-cover" />
      ) : (
        <video ref={videoRef} src="https://storage.googleapis.com/tfjs-models/demos/cvat/beach.mp4" autoPlay loop muted crossOrigin="anonymous" className="w-full h-full object-cover opacity-80" />
      )}
      
      {/* HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(rgba(15,252,235,0.1)_2px,transparent_2px),linear-gradient(90deg,rgba(15,252,235,0.1)_2px,transparent_2px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 overflow-hidden opacity-40">
          <div className="w-full h-1 bg-accent/50 absolute top-0 left-0 animate-scanline shadow-[0_0_20px_hsl(var(--accent))]" />
        </div>
      </div>

      {isModelLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/98 backdrop-blur-3xl">
          <Loader2 className="w-24 h-24 text-accent animate-spin mb-10" />
          <p className="text-accent font-code text-[14px] tracking-[1.8em] uppercase animate-pulse">Neural Synchronization</p>
        </div>
      )}

      {/* Zone Rendering */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {zones.map((zone) => (
            <g key={zone.id}>
              <rect 
                x={zone.x} y={zone.y} width={zone.width} height={zone.height} 
                fill={zone.color} fillOpacity="0.08" 
                stroke={zone.color} strokeWidth="0.8" 
              />
              <text x={zone.x + 0.8} y={zone.y + 3.2} fill={zone.color} style={{ fontSize: '1.8px', fontWeight: 'bold' }} className="uppercase tracking-[0.2em] font-headline">{zone.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Tracker Rendering */}
      <div className="absolute inset-0 pointer-events-none">
        {customers.map((c) => (
          <div 
            key={c.id} 
            className={cn(
              "absolute border-2 transition-all duration-150 ease-linear", 
              c.ageClass === 'child' 
                ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)]' 
                : (c.alerted ? 'border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.7)]' : 'border-accent shadow-[0_0_25px_rgba(25,136,245,0.5)]')
            )} 
            style={{ left: `${c.bbox.x}%`, top: `${c.bbox.y}%`, width: `${c.bbox.width}%`, height: `${c.bbox.height}%` }}
          >
            <div className={cn(
              "absolute -top-12 left-0 px-3 py-1.5 min-w-[120px] backdrop-blur-xl border border-white/20 shadow-2xl rounded-t-xl", 
              c.ageClass === 'child' ? 'bg-yellow-500/80' : (c.paid ? 'bg-emerald-500/80' : (c.alerted ? 'bg-red-500/80' : 'bg-primary/80'))
            )}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    {c.ageClass === 'child' ? 'KID' : 'TARGET'} {c.id}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-1">
                   <span className="text-[8px] font-bold uppercase opacity-80 text-white/90">{c.ownershipState}</span>
                   <span className="text-[8px] font-code text-white/90">{Math.round(c.ownershipConfidence * 100)}%</span>
                </div>
              </div>
            </div>
            
            {/* Visual Corner Accents */}
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-white/60" />
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-white/60" />
          </div>
        ))}
      </div>
    </div>
  );
};
