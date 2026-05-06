"use client"

import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Smartphone, Wifi, Terminal, CheckCircle2, Loader2, Zap } from 'lucide-react';
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
        'Syncing Neural Link...',
        'Handshaking Terminal...',
        'Authorizing Transaction...',
        'Associating Tracker ID...',
        'Finalizing Buffer...'
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
          if (next % 20 === 0 && stepIdx < steps.length - 1) {
            stepIdx++;
            setStatusText(steps[stepIdx]);
          }
          return next;
        });
      }, 120);
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
    }, 2800);
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardContent className="p-0 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-foreground neon-text">Neural Payment Interface</h3>
        </div>

        {activeSimulation ? (
          <div className="p-5 glass rounded-2xl border-accent/40 bg-accent/5 space-y-5 animate-in zoom-in-95 duration-500 aura-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                <span className="text-[10px] font-bold uppercase text-accent tracking-[0.2em]">{activeSimulation} INJECTION: ACTIVE</span>
              </div>
              <span className="text-[11px] font-code text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-white/5" />
            <p className="text-[10px] font-code text-accent/80 animate-pulse tracking-widest">// {statusText}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleSimulate('QR')}
              className="h-auto py-6 flex flex-col items-center gap-3 border-white/10 bg-white/5 hover:bg-accent/10 hover:border-accent group transition-all duration-500 rounded-2xl aura-border"
            >
              <QrCode className="w-7 h-7 text-accent group-hover:scale-125 group-hover:neon-text transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">QR Scan</span>
            </Button>

            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleSimulate('POS')}
              className="h-auto py-6 flex flex-col items-center gap-3 border-white/10 bg-white/5 hover:bg-primary/10 hover:border-primary group transition-all duration-500 rounded-2xl aura-border"
            >
              <Smartphone className="w-7 h-7 text-primary group-hover:scale-125 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">POS Inject</span>
            </Button>

            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleSimulate('Card')}
              className="h-auto py-6 flex flex-col items-center gap-3 border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500 group transition-all duration-500 rounded-2xl aura-border"
            >
              <CreditCard className="w-7 h-7 text-emerald-500 group-hover:scale-125 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Card EMV</span>
            </Button>

            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleSimulate('UPI')}
              className="h-auto py-6 flex flex-col items-center gap-3 border-white/10 bg-white/5 hover:bg-purple-500/10 hover:border-purple-500 group transition-all duration-500 rounded-2xl aura-border"
            >
              <Wifi className="w-7 h-7 text-purple-500 group-hover:scale-125 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">UPI Link</span>
            </Button>
          </div>
        )}

        {recentTransactions.length > 0 && (
          <div className="space-y-3 animate-in fade-in duration-700">
            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.3em] opacity-60">Verification Stream</h4>
            {recentTransactions.map(tx => (
              <div key={tx.id} className="p-3 glass rounded-xl border-white/10 flex items-center justify-between text-[11px] hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="font-bold text-foreground">{tx.method} AUTH</span>
                </div>
                <span className="font-code text-muted-foreground opacity-50">{tx.id}</span>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 glass rounded-2xl border-white/10 text-[10px] font-code space-y-3 aura-border">
          <div className="flex items-center justify-between">
            <span className="text-accent/80 font-bold tracking-tighter uppercase font-headline">Processor Status</span>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse delay-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-2 opacity-80">
            <div className="flex items-center gap-3 group">
              <Zap className="w-3 h-3 text-emerald-500 group-hover:scale-125 transition-transform" />
              <span>Stripe: OK</span>
            </div>
            <div className="flex items-center gap-3 group">
              <Zap className="w-3 h-3 text-emerald-500 group-hover:scale-125 transition-transform" />
              <span>Hooks: OK</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};