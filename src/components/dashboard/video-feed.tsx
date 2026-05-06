
"use client"

import React, { useState, useRef } from 'react';
import { TrackedCustomer, Zone } from '@/lib/types';
import { Maximize2, Camera, Settings, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoFeedProps {
  customers: TrackedCustomer[];
  zones: Zone[];
  onZoneChange: (zones: Zone[]) => void;
  isEditingZones: boolean;
  videoUrl: string | null;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ 
  customers, 
  zones, 
  onZoneChange, 
  isEditingZones,
  videoUrl 
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const handleZoneMouseDown = (id: string) => {
    if (!isEditingZones) return;
    setSelectedZoneId(id);
  };

  return (
    <div className="relative flex-1 h-full rounded-xl overflow-hidden border border-white/10 group bg-black">
      {/* Background Sim Image/Video */}
      {videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          className="w-full h-full object-cover opacity-80"
        />
      ) : (
        <img
          src="https://picsum.photos/seed/cyber-retail/1280/720"
          alt="Live CCTV Feed"
          className="w-full h-full object-cover opacity-60 grayscale-[30%] blur-[1px]"
          data-ai-hint="retail store cctv"
        />
      )}
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-[2px] bg-accent/20 animate-scanline absolute top-0 left-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Zone Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {zones.map((zone) => (
            <g key={zone.id}>
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                fill={zone.color}
                fillOpacity="0.1"
                stroke={zone.color}
                strokeWidth="0.5"
                strokeDasharray="1 0.5"
                className={cn(
                  "pointer-events-auto cursor-move transition-all duration-300",
                  selectedZoneId === zone.id && "stroke-white fill-white/20"
                )}
                onMouseDown={() => handleZoneMouseDown(zone.id)}
              />
              <text
                x={zone.x + 0.5}
                y={zone.y + 3}
                fill="white"
                style={{ fontSize: '2px' }}
                className="font-bold uppercase tracking-widest pointer-events-none"
              >
                {zone.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Tracker Overlays */}
      {customers.map((c) => (
        <div
          key={c.trackerId}
          className="absolute transition-all duration-500 ease-in-out border-2 pointer-events-none"
          style={{
            left: `${c.bbox.x}%`,
            top: `${c.bbox.y}%`,
            width: `${c.bbox.w}%`,
            height: `${c.bbox.h}%`,
            borderColor: c.status === 'paid' ? '#10b981' : (c.status === 'flagged' ? '#ef4444' : '#1988F5'),
            boxShadow: `0 0 10px ${c.status === 'paid' ? '#10b981' : (c.status === 'flagged' ? '#ef4444' : '#1988F5')}44`
          }}
        >
          {/* Tracker ID Tag */}
          <div className={cn(
            "absolute -top-6 left-0 px-2 py-0.5 text-[9px] font-bold text-white rounded-t flex items-center gap-1.5",
            c.status === 'paid' ? 'bg-emerald-500' : (c.status === 'flagged' ? 'bg-red-500' : 'bg-primary')
          )}>
            <span>ID: {c.trackerId}</span>
            <span className="opacity-70">|</span>
            <span>{Math.round(c.confidence * 100)}%</span>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white/50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white/50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/50" />
        </div>
      ))}

      {/* Video Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
          <Camera className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
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

      {/* Status Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border-accent/20">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">AI Scan Active</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border-primary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Neural Tracker</span>
        </div>
      </div>
    </div>
  );
};
