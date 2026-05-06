"use client"

import React, { useState, useRef, useEffect } from 'react';
import { TrackedCustomer, Zone } from '@/lib/types';
import { Maximize2, Camera, Settings, RefreshCcw, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
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
  customers, 
  zones, 
  onZoneChange, 
  isEditingZones,
  videoUrl,
  onFrame,
  isModelLoading,
  fps
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Detection Loop Trigger
  useEffect(() => {
    let animationFrame: number;
    const process = async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        onFrame(videoRef.current);
      }
      animationFrame = requestAnimationFrame(process);
    };
    process();
    return () => cancelAnimationFrame(animationFrame);
  }, [onFrame]);

  const handleZoneMouseDown = (e: React.MouseEvent, id: string) => {
    if (!isEditingZones) return;
    e.stopPropagation();
    setSelectedZoneId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isEditingZones || !selectedZoneId || !videoRef.current) return;
    
    const rect = videoRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onZoneChange(zones.map(z => {
      if (z.id === selectedZoneId) {
        return { ...z, x: Math.max(0, Math.min(100 - z.width, x)), y: Math.max(0, Math.min(100 - z.height, y)) };
      }
      return z;
    }));
  };

  const handleMouseUp = () => {
    setSelectedZoneId(null);
  };

  return (
    <div 
      className="relative flex-1 h-full rounded-xl overflow-hidden border border-white/10 group bg-[#05060f] cursor-crosshair neon-border transition-all duration-500"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Visual Source */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          muted
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          src="https://storage.googleapis.com/tfjs-models/demos/cvat/beach.mp4"
          autoPlay
          loop
          muted
          crossOrigin="anonymous"
          className="w-full h-full object-cover grayscale opacity-60"
        />
      )}
      
      {isModelLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
          <p className="text-accent font-code text-xs tracking-[0.5em] uppercase neon-text">Neural Core Linkage...</p>
        </div>
      )}

      {/* HUD Elements */}
      <div className="absolute top-4 left-4 z-10 flex gap-4 pointer-events-none">
        <div className="glass px-4 py-2 rounded-lg border-accent/20 flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
          <div className="relative">
             <div className="w-2 h-2 rounded-full bg-accent animate-ping absolute" />
             <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Feed Streaming</span>
        </div>
        
        <div className="glass px-4 py-2 rounded-lg border-white/10 flex items-center gap-2">
          <span className="text-[10px] font-code text-white/50 uppercase tracking-widest">ENC_LATENCY: 12.4ms</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="glass px-4 py-2 rounded-lg border-white/10 flex items-center gap-2 animate-pulse">
           <ShieldCheck className="w-4 h-4 text-accent" />
           <span className="text-[10px] font-bold text-white uppercase tracking-widest">Protocol Active</span>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="w-full h-[2px] bg-accent/40 animate-scanline absolute top-0 left-0" />
      </div>

      {/* Zone Overlays */}
      <div className="absolute inset-0">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {zones.map((zone) => (
            <g key={zone.id}>
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                fill={zone.color}
                fillOpacity={selectedZoneId === zone.id ? "0.3" : "0.08"}
                stroke={zone.color}
                strokeWidth="0.4"
                strokeDasharray={isEditingZones ? "1 0.5" : "none"}
                className={cn(
                  "transition-all duration-300",
                  isEditingZones ? "cursor-move pointer-events-auto" : "pointer-events-none"
                )}
                onMouseDown={(e) => handleZoneMouseDown(e, zone.id)}
              />
              <text
                x={zone.x + 0.5}
                y={zone.y + 3}
                fill={zone.color}
                style={{ fontSize: '2px', fontWeight: 'bold' }}
                className="uppercase tracking-widest pointer-events-none opacity-80 neon-text"
              >
                {zone.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* AI Bounding Boxes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {customers.map((c) => (
          <div
            key={c.trackerId}
            className={cn(
              "absolute transition-all duration-150 ease-out border-2",
              c.status === 'flagged' && "animate-pulse-ring"
            )}
            style={{
              left: `${c.bbox.x}%`,
              top: `${c.bbox.y}%`,
              width: `${c.bbox.w}%`,
              height: `${c.bbox.h}%`,
              borderColor: c.status === 'paid' ? '#10b981' : (c.status === 'flagged' ? '#ef4444' : '#1988F5'),
              boxShadow: `0 0 20px ${c.status === 'paid' ? '#10b981' : (c.status === 'flagged' ? '#ef4444' : '#1988F5')}44`
            }}
          >
            {/* Tag */}
            <div className={cn(
              "absolute -top-7 left-0 px-2 py-1 text-[9px] font-bold text-white rounded-t-md flex items-center gap-2 transition-colors",
              c.status === 'paid' ? 'bg-emerald-500' : (c.status === 'flagged' ? 'bg-red-500' : 'bg-primary')
            )}>
              {c.status === 'flagged' && <AlertCircle className="w-3 h-3 animate-pulse" />}
              <span>{c.trackerId}</span>
              <span className="opacity-40">|</span>
              <span className="font-code">{Math.round(c.confidence * 100)}%</span>
            </div>
            
            {/* Corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/60" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/60" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/60" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/60" />

            {/* Status Pulse */}
            <div className={cn(
              "absolute inset-0 opacity-10",
              c.status === 'paid' ? 'bg-emerald-500' : (c.status === 'flagged' ? 'bg-red-500 animate-pulse' : 'bg-primary')
            )} />
          </div>
        ))}
      </div>

      {/* Telemetry Footer */}
      <div className="absolute bottom-4 left-4 flex gap-3 pointer-events-none">
        <div className="glass px-4 py-1.5 rounded-lg border-white/10 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground uppercase tracking-tighter">AI Processing</span>
            <span className="text-[11px] font-code text-accent font-bold">FPS: {fps}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground uppercase tracking-tighter">Active Targets</span>
            <span className="text-[11px] font-code text-white font-bold">{customers.length}</span>
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/80 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 shadow-2xl">
        <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all transform hover:scale-110 active:scale-90">
          <Camera className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all transform hover:scale-110 active:scale-90" onClick={() => videoRef.current?.load()}>
          <RefreshCcw className="w-5 h-5" />
        </button>
        <div className="h-8 w-px bg-white/20" />
        <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all transform hover:scale-110 active:scale-90">
          <Settings className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all transform hover:scale-110 active:scale-90">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};