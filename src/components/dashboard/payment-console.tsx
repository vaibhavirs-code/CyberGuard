"use client"

import React, { useState } from 'react';
import { CreditCard, QrCode, Smartphone, Wifi, Terminal, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PaymentConsoleProps {
  onSimulatePayment: (method: 'QR' | 'POS' | 'Card' | 'UPI') => void;
  isProcessing: boolean;
}

export const PaymentConsole: React.FC<PaymentConsoleProps> = ({ onSimulatePayment, isProcessing }) => {
  const [lastPayment, setLastPayment] = useState<{ id: string, method: string } | null>(null);

  const handleSimulate = (method: 'QR' | 'POS' | 'Card' | 'UPI') => {
    onSimulatePayment(method);
    setLastPayment({ id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, method });
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white">Payment Injection Module</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled={isProcessing}
            onClick={() => handleSimulate('QR')}
            className="h-auto py-4 flex flex-col items-center gap-2 border-white/5 bg-white/5 hover:bg-white/10 hover:border-accent group transition-all"
          >
            <QrCode className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Simulate QR</span>
          </Button>

          <Button
            variant="outline"
            disabled={isProcessing}
            onClick={() => handleSimulate('POS')}
            className="h-auto py-4 flex flex-col items-center gap-2 border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary group transition-all"
          >
            <Smartphone className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">POS Inject</span>
          </Button>

          <Button
            variant="outline"
            disabled={isProcessing}
            onClick={() => handleSimulate('Card')}
            className="h-auto py-4 flex flex-col items-center gap-2 border-white/5 bg-white/5 hover:bg-white/10 hover:border-emerald-500 group transition-all"
          >
            <CreditCard className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Card Emulation</span>
          </Button>

          <Button
            variant="outline"
            disabled={isProcessing}
            onClick={() => handleSimulate('UPI')}
            className="h-auto py-4 flex flex-col items-center gap-2 border-white/5 bg-white/5 hover:bg-white/10 hover:border-purple-500 group transition-all"
          >
            <Wifi className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">UPI Webhook</span>
          </Button>
        </div>

        {lastPayment && (
          <div className="p-3 glass rounded-lg border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Payment Broadcasted</span>
              </div>
              <span className="text-[9px] font-code text-muted-foreground">{lastPayment.id}</span>
            </div>
            <p className="text-[11px] text-white">
              Broadcasting {lastPayment.method} transaction to AI Matcher...
            </p>
          </div>
        )}

        <div className="p-3 glass rounded-lg border-white/5 text-[10px] font-code text-muted-foreground leading-relaxed">
          <p className="mb-1 text-accent/70">// INTEGRATION HOOKS</p>
          <div className="grid grid-cols-2 gap-x-4">
            <span>Stripe: READY</span>
            <span>Razorpay: READY</span>
            <span>POS-API: SIMULATED</span>
            <span>Webhook: LISTENING</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
