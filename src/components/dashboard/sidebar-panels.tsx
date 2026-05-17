
"use client"

import React, { useRef, useState, useEffect } from 'react';
import { TrackedCustomer, ArduinoStatus } from '@/lib/types';
import { PaymentConsole } from './payment-console';
import { Cpu, Upload, Video, Link, Link2Off, Activity, Zap, ShieldAlert, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarPanelsProps {
  customers: TrackedCustomer[];
  isEditingZones: boolean;
  onToggleEditing: () => void;
  onSimulatePayment: (method: any) => Promise<void>;
  isProcessing: boolean;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  arduinoStatus: ArduinoStatus;
  onConnectArduino: () => void;
  isBlockedByPolicy: boolean;
}

export const SidebarPanels: React.FC<SidebarPanelsProps> = ({ 
  customers, onSimulatePayment, isProcessing, onVideoUpload,
  arduinoStatus, onConnectArduino, isBlockedByPolicy
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const getStatusColor = (status: ArduinoStatus) => {
    switch (status) {
      case "CONNECTED": return "text-emerald-400 border-emerald-500/50 bg-emerald-500/10";
      case "CONNECTING": return "text-accent border-accent/50 bg-accent/10 animate-pulse";
      case "ERROR": return "text-red-400 border-red-500/50 bg-red-500/10";
      default: return "text-muted-foreground border-white/10 bg-white/5";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hardware Link */}
      <div className="glass rounded-[2rem] p-8 border-white/10 aura-border">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-accent/20"><Cpu className="w-6 h-6 text-accent" /></div>
            <div className="flex flex-col">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.3em]">Hardware Link</h3>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Nano Serial V3</span>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[9px] h-5 uppercase px-3", getStatusColor(arduinoStatus))}>
            {arduinoStatus}
          </Badge>
        </div>

        {isBlockedByPolicy && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-[9px] text-amber-200/70 font-medium">Hardware serial access blocked in preview. Run on localhost for full link.</p>
          </div>
        )}

        <Button 
          disabled={arduinoStatus === "CONNECTED" || isBlockedByPolicy} 
          onClick={onConnectArduino}
          className="w-full h-14 rounded-2xl border border-white/10 text-[11px] font-bold uppercase tracking-[0.3em] gap-4 bg-white/5 hover:bg-accent/15 transition-all"
        >
          {arduinoStatus === "CONNECTED" ? "Linked" : "Initialize Port"}
        </Button>
      </div>

      {/* Neural Matching */}
      <div className="glass rounded-[2rem] p-8 border-white/10 aura-border">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-yellow-500/20"><Zap className="w-6 h-6 text-yellow-500" /></div>
          <div className="flex flex-col">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.3em]">Neural Matching</h3>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Autonomous POS Link</span>
          </div>
        </div>
        <PaymentConsole onSimulatePayment={onSimulatePayment} isProcessing={isProcessing} />
      </div>

      {/* Target Insights */}
      <div className="glass rounded-[2rem] p-8 border-white/10 aura-border">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-primary/20"><Target className="w-6 h-6 text-primary" /></div>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.3em]">Active Links</h3>
        </div>
        <div className="space-y-4">
          {customers.map(c => (
            <div key={c.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-accent">{c.id}</span>
                <Badge variant="outline" className="text-[8px] opacity-60 uppercase">{c.ownershipState}</Badge>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-500" style={{ width: `${c.ownershipConfidence * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
