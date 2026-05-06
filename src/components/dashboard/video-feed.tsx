
"use client"

import React, { useState, useRef, useEffect } from 'react';
import { TrackedCustomer, Zone } from '@/lib/types';
import { Maximize2, Camera, Settings, RefreshCcw, Loader2 } from 'lucide-react';
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
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
    
    const zone = zones.find(z => z.id === id);
    if (zone) {
      setDragOffset({
        x: e.clientX - zone.x,
        y: e.clientY - zone.y
      });
    }
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
      className="relative flex-1 h-full rounded-xl overflow-hidden border border-white/10 group bg-black cursor-crosshair"
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
          src="https://storage.googleapis.com/tfjs-models/demos/cvat/beach.mp4" // Placeholder stable person video
          autoPlay
          loop
          muted
          crossOrigin="anonymous"
          className="w-full h-full object-cover grayscale brightness-75"
        />
      )}
      
      {isModelLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
          <p className="text-accent font-code text-xs tracking-widest uppercase">Initializing Neural Core...</p>
        </div>
      )}

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-[2px] bg-accent/20 animate-scanline absolute top-0 left-0" />
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
                fillOpacity={selectedZoneId === zone.id ? "0.3" : "0.1"}
                stroke={zone.color}
                strokeWidth="0.5"
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
                fill="white"
                style={{ fontSize: '2px' }}
                className="font-bold uppercase tracking-widest pointer-events-none opacity-70"
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
            className="absolute transition-all duration-100 ease-linear border-2"
            style={{
              left: `${c.bbox.x}%`,
              top: `${c.bbox.y}%`,
              width: `${c.bbox.w}%`,
              height: `${c.bbox.h}%`,
              borderColor: c.status === 'paid' ? '#10b981' : (c.status === 'flagged' ? '#ef4444' : '#1988F5'),
              boxShadow: `0 0 10px ${c.status === 'paid' ? '#10b981' : (c.status === 'flagged' ? '#ef4444' : '#1988F5')}44`
            }}
          >
            {/* Tag */}
            <div className={cn(
              "absolute -top-6 left-0 px-2 py-0.5 text-[9px] font-bold text-white rounded-t flex items-center gap-1.5",
              c.status === 'paid' ? 'bg-emerald-500' : (c.status === 'flagged' ? 'bg-red-500' : 'bg-primary')
            )}>
              <span>{c.trackerId}</span>
              <span className="opacity-50">|</span>
              <span>{Math.round(c.confidence * 100)}%</span>
            </div>
            
            {/* Corners */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-white/50" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-white/50" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-white/50" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-white/50" />
          </div>
        ))}
      </div>

      {/* Telemetry */}
      <div className="absolute bottom-4 left-4 flex gap-3 pointer-events-none">
        <div className="glass px-3 py-1 rounded-md border-white/10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] font-code text-accent">FPS: {fps}</span>
        </div>
        <div className="glass px-3 py-1 rounded-md border-white/10 flex items-center gap-2">
          <span className="text-[10px] font-code text-white/50 uppercase">Objects: {customers.length}</span>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
          <Camera className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors" onClick={() => videoRef.current?.load()}>
          <RefreshCcw className="w-5 h-5" />
        </button>
        <div className="h-6 w-px bg-white/10" />
        <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
