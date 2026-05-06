"use client"

import React, { useRef } from 'react';
import { TrackedCustomer } from '@/lib/types';
import { PaymentConsole } from './payment-console';
import { Users, Layout, Save, Trash2, Cpu, ArrowUpRight, Upload, Video, Link, Link2Off, Activity, Network, Zap, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarPanelsProps {
  customers: TrackedCustomer[];
  isEditingZones: boolean;
  onToggleEditing: () => void;
  onSimulatePayment: (method: 'QR' | 'POS' | 'Card' | 'UPI') => void;
  isProcessing: boolean;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isArduinoConnected: boolean;
  onConnectArduino: () => void;
}

export const SidebarPanels: React.FC<SidebarPanelsProps> = ({ 
  customers, isEditingZones, onToggleEditing,
  onSimulatePayment, isProcessing, onVideoUpload,
  isArduinoConnected, onConnectArduino
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6 pb-10">
      {/* Hardware Module */}
      <div className="glass rounded-3xl p-6 border-white/10 aura-border group/panel hover:bg-white/5 transition-all duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-accent/20 group-hover/panel:scale-110 transition-transform">
              <Cpu className="w-5 h-5 text-accent" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Hardware Link</h3>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Nano V3 Serial</span>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[8px] h-5 uppercase border-white/10 backdrop-blur-md", isArduinoConnected ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/5" : "text-red-400 border-red-500/40 bg-red-500/5")}>
            {isArduinoConnected ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <Button 
          variant="outline" disabled={isArduinoConnected} onClick={onConnectArduino}
          className="w-full h-12 rounded-2xl border-white/10 hover:border-accent text-[10px] font-bold uppercase tracking-[0.2em] gap-3 aura-border bg-white/5 hover:bg-accent/10 transition-all duration-500"
        >
          {isArduinoConnected ? <><Link className="w-4 h-4 text-emerald-400" /> Interface Linked</> : <><Link2Off className="w-4 h-4" /> Initialize Link</>}
        </Button>
      </div>

      {/* Vision Input Module */}
      <div className="glass rounded-3xl p-6 border-white/10 aura-border group/panel hover:bg-white/5 transition-all duration-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/20 group-hover/panel:scale-110 transition-transform">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Vision Ingestion</h3>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">External Data Stream</span>
          </div>
        </div>
        <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={onVideoUpload} />
        <Button 
          variant="outline" onClick={() => fileInputRef.current?.click()}
          className="w-full h-12 rounded-2xl border-dashed border-white/20 hover:border-accent text-[10px] font-bold uppercase tracking-[0.2em] gap-3 aura-border bg-white/5 transition-all duration-500 group"
        >
          <Upload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" /> 
          Inject Custom Feed
        </Button>
      </div>

      {/* Neural Payment Engine */}
      <div className="glass rounded-3xl p-6 border-white/10 aura-border group/panel hover:bg-white/5 transition-all duration-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2.5 rounded-xl bg-yellow-500/20 group-hover/panel:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Payment Processor</h3>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Neural Matching Engine</span>
          </div>
        </div>
        <PaymentConsole onSimulatePayment={onSimulatePayment} isProcessing={isProcessing} />
      </div>

      {/* System Stats / Analytics */}
      <div className="glass rounded-3xl p-6 border-white/10 aura-border group/panel hover:bg-white/5 transition-all duration-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 group-hover/panel:scale-110 transition-transform">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Analytics Stream</h3>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Real-time Telemetry</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Stripe', status: 'Linked' },
            { label: 'Webhook', status: 'Active' },
            { label: 'POS API', status: 'Stream' },
            { label: 'Cloud', status: 'Synced' }
          ].map((item, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 group/item hover:border-accent/40 transition-all">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 glow-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase text-foreground tracking-widest">{item.label}</span>
                <span className="text-[8px] text-muted-foreground uppercase">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};