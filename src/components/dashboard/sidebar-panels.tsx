"use client"

import React from 'react';
import { TrackedCustomer } from '@/lib/types';
import { PaymentConsole } from './payment-console';
import { Users, Layout, Save, Trash2, Cpu, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarPanelsProps {
  customers: TrackedCustomer[];
  isEditingZones: boolean;
  onToggleEditing: () => void;
  onSimulatePayment: (method: 'QR' | 'POS' | 'Card' | 'UPI') => void;
  isProcessing: boolean;
}

export const SidebarPanels: React.FC<SidebarPanelsProps> = ({ 
  customers, 
  isEditingZones, 
  onToggleEditing,
  onSimulatePayment,
  isProcessing
}) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Live Trackers Panel */}
      <div className="flex-1 glass rounded-xl flex flex-col overflow-hidden border-white/5">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Active Trackers</h3>
          </div>
          <Badge variant="outline" className="font-code text-[10px] border-accent/20 text-accent">
            {customers.length} TARGETS
          </Badge>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {customers.map((c) => (
              <div 
                key={c.trackerId}
                className={cn(
                  "p-3 rounded-lg border border-white/5 bg-white/5 group transition-all duration-300",
                  c.status === 'paid' && "border-emerald-500/20 bg-emerald-500/5",
                  c.status === 'flagged' && "border-red-500/20 bg-red-500/10 animate-pulse"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="font-code text-xs font-bold">{c.trackerId}</span>
                  </div>
                  <Badge 
                    className={cn(
                      "text-[9px] font-bold uppercase",
                      c.status === 'paid' ? "bg-emerald-500/20 text-emerald-400" : 
                      c.status === 'flagged' ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary"
                    )}
                  >
                    {c.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Layout className="w-3 h-3" />
                    <span>Zone: <span className="text-white uppercase">{c.currentZone}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3" />
                    <span>Conf: <span className="text-white">{(c.confidence * 100).toFixed(0)}%</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Payment Simulation Console */}
      <div className="glass rounded-xl p-4 border-white/5">
        <PaymentConsole onSimulatePayment={onSimulatePayment} isProcessing={isProcessing} />
      </div>

      {/* Control Module */}
      <div className="glass rounded-xl p-4 border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpRight className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">System Controls</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant={isEditingZones ? "default" : "outline"} 
            size="sm"
            onClick={onToggleEditing}
            className={cn(
              "h-9 text-[10px] font-bold uppercase tracking-widest gap-2 transition-all",
              isEditingZones ? "bg-accent text-accent-foreground" : "border-white/10 hover:border-accent"
            )}
          >
            <Layout className="w-3.5 h-3.5" />
            {isEditingZones ? 'Lock Zones' : 'Edit Zones'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2 border-white/10 hover:border-emerald-500"
          >
            <Save className="w-3.5 h-3.5 text-emerald-500" />
            Save Layout
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2 border-white/10 hover:border-red-500"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            Reset Zones
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2 border-white/10 hover:border-primary"
          >
            <Cpu className="w-3.5 h-3.5 text-primary" />
            Hard Reset
          </Button>
        </div>

        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold mb-2">
            <span>Arduino Connection</span>
            <span className="text-emerald-500">CONNECTED</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-accent w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
