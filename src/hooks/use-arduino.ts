
"use client"

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useArduino() {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [writer, setWriter] = useState<WritableStreamDefaultWriter | null>(null);
  const { toast } = useToast();

  const connect = useCallback(async () => {
    try {
      if (!('serial' in navigator)) {
        toast({
          variant: 'destructive',
          title: 'Not Supported',
          description: 'Web Serial API not supported in this browser.',
        });
        return;
      }

      const p = await navigator.serial.requestPort();
      await p.open({ baudRate: 9600 });
      setPort(p);
      
      const encoder = new TextEncoder();
      const w = p.writable.getWriter();
      setWriter(w);

      toast({
        title: 'Arduino Connected',
        description: 'Successfully established serial link with Nano V3.',
      });
    } catch (err) {
      console.error('Serial connect error:', err);
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: 'Could not connect to the serial port.',
      });
    }
  }, [toast]);

  const sendAlert = useCallback(async () => {
    if (!writer) return;
    try {
      const encoder = new TextEncoder();
      await writer.write(encoder.encode('ALERT\n'));
    } catch (err) {
      console.error('Serial write error:', err);
    }
  }, [writer]);

  const disconnect = useCallback(async () => {
    if (writer) {
      writer.releaseLock();
      setWriter(null);
    }
    if (port) {
      await port.close();
      setPort(null);
    }
  }, [port, writer]);

  return { port, connect, disconnect, sendAlert, isConnected: !!port };
}
