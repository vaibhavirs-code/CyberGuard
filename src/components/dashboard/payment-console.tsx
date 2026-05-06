"use client"

import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Smartphone, Wifi, Terminal, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface PaymentConsoleProps {
  onSimulatePayment: (method: 'QR' | 'POS' | 'Card' | 'UPI') => Promise<void>;
  isProcessing: boolean;
}

export const PaymentConsole: React.FC<PaymentConsoleProps> = ({ onSimulatePayment, isProcessing }) => {
  const [activeSimulation, setActiveSimulation] = useState<'QR' | 'POS' | 'Card' | 'UPI' | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [recentTransactions, setRecentTransactions] = useState<{id: string, method: string, status: string}[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSimulation) {
      setProgress(0);
      const steps = [
        'Initializing Request...',
        'Handshaking Terminal...',
        'Authorizing via AI Matcher...',
        'Webhook Callback Received',
        'Transaction Finalized'
      ];
      let stepIdx = 0;
      setStatusText(steps[0]);

      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          const next = prev + 5;
          if (next % 25 === 0 && stepIdx < steps.length - 1) {
            stepIdx++;
            setStatusText(steps[stepIdx]);
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [activeSimulation]);

  const handleSimulate = async (method: 'QR' | 'POS' | 'Card' | 'UPI') => {
    setActiveSimulation(method);
    await onSimulatePayment(method);
    
    setTimeout(() => {
      const newTx = {
        id: `TX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        method,
        status: 'SUCCESS'
      };
      setRecentTransactions(prev => [newTx, ...prev].slice(0, 3));
      setActiveSimulation(null);
      setProgress(0);
      setStatusText('');
    }, 2500);
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white neon-text">Neural Payment Engine</h3>
        </div>

        {activeSimulation ? (
          <div className="p-4 glass rounded-lg border-accent/30 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                <span className="text-xs font-bold uppercase text-accent tracking-widest">{activeSimulation} INJECTION IN PROGRESS</span>
              </div>
              <span className="text-[10px] font-code text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1 bg-white/5" />
            <p className="text-[10px] font-code text-accent/80 animate-pulse">{statusText}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleSimulate('QR')}
              className="h-auto py-5 flex flex-col items-center gap-2 border-white/5 bg-white/5 hover:bg-accent/10 hover:border-accent group transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <QrCode className="w-6 h-6 text-accent group-hover:scale-110 group-hover:neon-text transition-transform" />
              <span className="text-[9px] font-bold uppercase tracking-widest">QR Scanner</span>
            </Button>

            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleSimulate('POS')}
              className="h-auto py-5 flex flex-col items-center gap-2 border-white/5 bg-white/5 hover:bg-primary/10 hover:border-primary group transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Smartphone className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold uppercase tracking-widest">POS Inject</span>
            </Button>

            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleSimulate('Card')}
              className="h-auto py-5 flex flex-col items-center gap-2 border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500 group transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CreditCard className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold uppercase tracking-widest">EMV Emulate</span>
            </Button>

            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleSimulate('UPI')}
              className="h-auto py-5 flex flex-col items-center gap-2 border-white/5 bg-white/5 hover:bg-purple-500/10 hover:border-purple-500 group transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Wifi className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold uppercase tracking-widest">UPI Webhook</span>
            </Button>
          </div>
        )}

        {recentTransactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Live Buffer</h4>
            {recentTransactions.map(tx => (
              <div key={tx.id} className="p-2 glass rounded border-white/5 flex items-center justify-between text-[10px] animate-in slide-in-from-right-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="font-bold text-white">{tx.method}</span>
                </div>
                <span className="font-code text-muted-foreground">{tx.id}</span>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 glass rounded-lg border-white/5 text-[10px] font-code space-y-2">
          <div className="flex items-center justify-between opacity-70">
            <span className="text-accent/70 font-bold tracking-tighter">// INTEGRATION STREAM</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-accent animate-pulse delay-100" />
              <div className="w-1 h-1 rounded-full bg-accent animate-pulse delay-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Stripe: CONNECTED</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Webhook: ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>POS-API: STREAMING</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Razopay: SYNCED</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};