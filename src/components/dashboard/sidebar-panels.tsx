
"use client"

import React, { useRef } from 'react';
import { TrackedCustomer } from '@/lib/types';
import { PaymentConsole } from './payment-console';
import { Users, Layout, Save, Trash2, Cpu, ArrowUpRight, Upload, Video, Link, Link2Off, Activity } from 'lucide-react';
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
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isArduinoConnected: boolean;
  onConnectArduino: () => void;
}

export const SidebarPanels: React.FC<SidebarPanelsProps> = ({ 
  customers, 
  isEditingZones, 
  onToggleEditing,
  onSimulatePayment,
  isProcessing,
  onVideoUpload,
  isArduinoConnected,
  onConnectArduino
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Live Trackers Panel */}
      <div className="flex-1 glass rounded-xl flex flex-col overflow-hidden border-white/5">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Neural Map</h3>
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
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      c.status === 'paid' ? "bg-emerald-500" : "bg-accent"
                    )} />
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
                    <Activity className="w-3 h-3 text-accent" />
                    <span>Conf: <span className="text-white">{(c.confidence * 100).toFixed(0)}%</span></span>
                  </div>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="py-10 text-center text-muted-foreground/30 font-code text-[10px] uppercase">
                Awaiting Target Detection...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Hardware Control */}
      <div className="glass rounded-xl p-4 border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Arduino Link</h3>
          </div>
          <Badge variant="outline" className={cn(
            "text-[9px] font-bold uppercase",
            isArduinoConnected ? "border-emerald-500/50 text-emerald-400" : "border-red-500/50 text-red-400"
          )}>
            {isArduinoConnected ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <Button 
          variant="outline" 
          disabled={isArduinoConnected}
          className="w-full h-10 border-white/10 hover:border-accent group text-[10px] font-bold uppercase transition-all"
          onClick={onConnectArduino}
        >
          {isArduinoConnected ? (
            <><Link className="w-4 h-4 mr-2 text-emerald-400" /> Nano V3 Synced</>
          ) : (
            <><Link2Off className="w-4 h-4 mr-2" /> Connect Hardware</>
          )}
        </Button>
      </div>

      {/* Video Source Control */}
      <div className="glass rounded-xl p-4 border-white/5 space-y-3">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">Vision Input</h3>
        </div>
        <input 
          type="file" 
          accept="video/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={onVideoUpload}
        />
        <Button 
          variant="outline" 
          className="w-full h-10 border-dashed border-white/10 hover:border-accent group text-[10px] font-bold uppercase"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2 group-hover:animate-bounce" />
          Inject Real Footage
        </Button>
      </div>

      {/* Payment simulation */}
      <div className="glass rounded-xl p-4 border-white/5">
        <PaymentConsole onSimulatePayment={onSimulatePayment} isProcessing={isProcessing} />
      </div>

      {/* Control Module */}
      <div className="glass rounded-xl p-4 border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpRight className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">Zone Architect</h3>
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
            {isEditingZones ? 'Save Geometry' : 'Tune Zones'}
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2 border-white/10">
            <Save className="w-3.5 h-3.5 text-emerald-500" />
            Store Layout
          </Button>
        </div>
      </div>
    </div>
  );
};
