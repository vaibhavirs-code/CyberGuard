
"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TrackedCustomer, Zone } from '@/lib/types';
import { ShieldCheck, Loader2, Scan, Activity, Target, Move, Maximize2 } from 'lucide-react';
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
      if (videoRef.current && !videoRef.current.paused) onFrame(videoRef.current);
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
      className="relative w-full h-full bg-black group rounded-3xl overflow-hidden shadow-2xl aura-border"
    >
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
          <div className="w-full h-0.5 bg-accent/40 absolute top-0 left-0 animate-scanline shadow-[0_0_15px_hsl(var(--accent))]" />
        </div>
      </div>

      {isModelLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl">
          <Loader2 className="w-20 h-20 text-accent animate-spin mb-8" />
          <p className="text-accent font-code text-[12px] tracking-[1.5em] uppercase neon-text animate-pulse">Neural Synchronization</p>
        </div>
      )}

      {/* Zones Layer */}
      <div className={cn("absolute inset-0", isEditingZones ? "cursor-crosshair" : "pointer-events-none")}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {zones.map((zone) => (
            <g key={zone.id}>
              <rect 
                x={zone.x} y={zone.y} width={zone.width} height={zone.height} 
                fill={zone.color} fillOpacity={isEditingZones ? "0.15" : "0.05"} 
                stroke={zone.color} strokeWidth="0.5" 
                className={cn("transition-all", isEditingZones && "cursor-move")}
                onMouseDown={(e) => handleZoneMouseDown(e, zone.id, 'move')}
              />
              <text x={zone.x + 0.5} y={zone.y + 2.5} fill={zone.color} style={{ fontSize: '1.5px', fontWeight: 'bold' }} className="uppercase tracking-widest">{zone.label}</text>
              {isEditingZones && (
                <rect 
                  x={zone.x + zone.width - 2} y={zone.y + zone.height - 2} width="2" height="2" 
                  fill={zone.color} className="cursor-nwse-resize"
                  onMouseDown={(e) => handleZoneMouseDown(e, zone.id, 'resize')}
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Tracker Visuals */}
      <div className="absolute inset-0 pointer-events-none">
        {customers.map((c) => (
          <div key={c.trackerId} className={cn("absolute border-2 transition-all duration-150 ease-linear", c.status === 'flagged' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'border-accent shadow-[0_0_20px_rgba(25,136,245,0.4)]')} style={{ left: `${c.bbox.x}%`, top: `${c.bbox.y}%`, width: `${c.bbox.w}%`, height: `${c.bbox.h}%` }}>
            <div className={cn("absolute -top-8 left-0 px-2 py-0.5 text-[10px] font-bold text-white rounded-t-lg flex items-center gap-2 backdrop-blur-md border-t border-x border-white/20 shadow-xl", c.status === 'paid' ? 'bg-emerald-500/90' : (c.status === 'flagged' ? 'bg-red-500/90' : 'bg-primary/90'))}>
              <Target className="w-3 h-3 animate-pulse" />
              <span className="tracking-widest uppercase">{c.trackerId}</span>
              <div className="w-px h-3 bg-white/20" />
              <span className="font-code text-[8px]">{Math.round(c.confidence * 100)}% REL</span>
            </div>
            {/* Brackets */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white/50" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white/50" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white/50" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white/50" />
          </div>
        ))}
      </div>
    </div>
  );
};
