"use client"

import React, { useRef } from 'react';
import { TrackedCustomer } from '@/lib/types';
import { PaymentConsole } from './payment-console';
import { Users, Layout, Save, Trash2, Cpu, ArrowUpRight, Upload, Video, Link, Link2Off, Activity, Network, Zap } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Hardware Module */}
      <div className="glass rounded-2xl p-6 border-white/10 aura-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Cpu className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Arduino Link</h3>
          </div>
          <Badge variant="outline" className={cn("text-[9px] uppercase border-white/10", isArduinoConnected ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30")}>
            {isArduinoConnected ? 'Synced' : 'Offline'}
          </Badge>
        </div>
        <Button 
          variant="outline" disabled={isArduinoConnected} onClick={onConnectArduino}
          className="w-full h-12 border-white/10 hover:border-accent text-xs font-bold uppercase tracking-widest gap-2 aura-border"
        >
          {isArduinoConnected ? <><Link className="w-4 h-4 text-emerald-400" /> Nano V3 Synced</> : <><Link2Off className="w-4 h-4" /> Connect Hardware</>}
        </Button>
      </div>

      {/* Vision Input Module */}
      <div className="glass rounded-2xl p-6 border-white/10 aura-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/20">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider">Vision Input</h3>
        </div>
        <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={onVideoUpload} />
        <Button 
          variant="outline" onClick={() => fileInputRef.current?.click()}
          className="w-full h-12 border-dashed border-white/10 hover:border-accent text-xs font-bold uppercase tracking-widest gap-2 aura-border"
        >
          <Upload className="w-4 h-4" /> Inject Real Footage
        </Button>
      </div>

      {/* Neural Payment Engine */}
      <div className="glass rounded-2xl p-6 border-white/10 aura-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider">Neural Payment Engine</h3>
        </div>
        <PaymentConsole onSimulatePayment={onSimulatePayment} isProcessing={isProcessing} />
      </div>

      {/* Integration Stream */}
      <div className="glass rounded-2xl p-6 border-white/10 aura-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Network className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Integration Stream</h3>
          </div>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-75" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-150" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Stripe</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Webhook</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">POS API</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
};