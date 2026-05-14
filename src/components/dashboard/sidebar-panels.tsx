"use client"

import React, { useRef } from 'react';
import { TrackedCustomer } from '@/lib/types';
import { PaymentConsole } from './payment-console';
import { Cpu, Upload, Video, Link, Link2Off, Activity, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarPanelsProps {
  customers: TrackedCustomer[];
  isEditingZones: boolean;
  onToggleEditing: () => void;
  onSimulatePayment: (method: 'QR' | 'POS' | 'Card' | 'UPI') => Promise<void>;
  isProcessing: boolean;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isArduinoConnected: boolean;
  onConnectArduino: () => void;
  isBlockedByPolicy?: boolean;
}

export const SidebarPanels: React.FC<SidebarPanelsProps> = ({ 
  customers, isEditingZones, onToggleEditing,
  onSimulatePayment, isProcessing, onVideoUpload,
  isArduinoConnected, onConnectArduino,
  isBlockedByPolicy = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div className="space-y-8 pb-12">
      {/* Hardware Interface */}
      <div className="glass rounded-[2rem] p-8 border-white/10 aura-border group/panel hover:bg-white/5 transition-all duration-700">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl transition-all duration-500", isArduinoConnected ? "bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-accent/20")}>
              <Cpu className={cn("w-6 h-6", isArduinoConnected ? "text-emerald-400" : "text-accent")} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.3em] text-foreground">Hardware Link</h3>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Nano Serial V3</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
             <Badge variant="outline" className={cn("text-[9px] h-5 uppercase border-white/10 backdrop-blur-3xl px-3", isArduinoConnected ? "text-emerald-400 border-emerald-500/50 bg-emerald-500/10" : "text-red-400 border-red-500/50 bg-red-500/10")}>
              {isArduinoConnected ? 'Synced' : 'Offline'}
            </Badge>
            <span className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border", isLocal ? "text-emerald-500 border-emerald-500/30" : "text-amber-500 border-amber-500/30")}>
              {isLocal ? 'Local Mode' : 'Preview Mode'}
            </span>
          </div>
        </div>

        {isBlockedByPolicy && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold uppercase text-amber-500 tracking-widest">Protocol Restriction</span>
            </div>
            <p className="text-[9px] text-amber-200/70 leading-relaxed font-medium">
              Hardware serial access is blocked inside preview mode. Run the app on <span className="text-amber-400">localhost</span> for full Arduino integration.
            </p>
          </div>
        )}

        <Button 
          variant="outline" 
          disabled={isArduinoConnected || isBlockedByPolicy} 
          onClick={onConnectArduino}
          className={cn(
            "w-full h-14 rounded-2xl border-white/10 text-[11px] font-bold uppercase tracking-[0.3em] gap-4 aura-border bg-white/5 transition-all duration-500",
            !isBlockedByPolicy && "hover:border-accent hover:bg-accent/15",
            isBlockedByPolicy && "opacity-50 grayscale"
          )}
        >
          {isArduinoConnected ? <><Link className="w-5 h-5 text-emerald-400" /> Interface Linked</> : <><Link2Off className="w-5 h-5" /> Initialize Port</>}
        </Button>
      </div>

      {/* Neural Vision Ingestion */}
      <div className="glass rounded-[2rem] p-8 border-white/10 aura-border group/panel hover:bg-white/5 transition-all duration-700">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-primary/20 group-hover/panel:scale-110 transition-transform shadow-[0_0_20px_rgba(25,136,245,0.2)]">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.3em] text-foreground">Vision Stream</h3>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Custom Feed Ingest</span>
          </div>
        </div>
        <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={onVideoUpload} />
        <Button 
          variant="outline" onClick={() => fileInputRef.current?.click()}
          className="w-full h-14 rounded-2xl border-dashed border-white/20 hover:border-accent text-[11px] font-bold uppercase tracking-[0.3em] gap-4 aura-border bg-white/5 hover:bg-accent/10 transition-all duration-700 group/btn"
        >
          <Upload className="w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" /> 
          Inject Vision Packet
        </Button>
      </div>

      {/* AI Payment Engine */}
      <div className="glass rounded-[2rem] p-8 border-white/10 aura-border group/panel hover:bg-white/5 transition-all duration-700">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-yellow-500/20 group-hover/panel:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.3em] text-foreground">Neural Matching</h3>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Autonomous Matcher</span>
          </div>
        </div>
        <PaymentConsole onSimulatePayment={onSimulatePayment} isProcessing={isProcessing} />
      </div>

      {/* Analytics Telemetry */}
      <div className="glass rounded-[2rem] p-8 border-white/10 aura-border group/panel hover:bg-white/5 transition-all duration-700">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-emerald-500/20 group-hover/panel:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Activity className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.3em] text-foreground">Live Telemetry</h3>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">System Heartbeat</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {[
            { label: 'Cloud', status: 'Synced', color: 'bg-emerald-500' },
            { label: 'POS API', status: 'Live', color: 'bg-emerald-500' },
            { label: 'Latency', status: '12ms', color: 'bg-accent' },
            { label: 'Security', status: 'V3 High', color: 'bg-emerald-500' }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 group/item hover:border-accent/40 transition-all hover:bg-white/10">
              <div className={cn("w-2 h-2 rounded-full glow-pulse", item.color)} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-foreground tracking-widest">{item.label}</span>
                <span className="text-[9px] text-muted-foreground uppercase opacity-70">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
