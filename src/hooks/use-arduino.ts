"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type SerialWriter = WritableStreamDefaultWriter<Uint8Array<ArrayBufferLike>>;

export function useArduino() {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [writer, setWriter] = useState<SerialWriter | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isBlockedByPolicy, setIsBlockedByPolicy] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if running on localhost or similar local dev environment
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (typeof navigator !== "undefined" && "serial" in navigator) {
      setIsSupported(true);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      if (!isSupported) {
        toast({
          variant: "destructive",
          title: "Feature Not Supported",
          description: "Web Serial API is not supported in this browser.",
        });
        return;
      }

      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });

      if (!selectedPort.writable) {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "Serial port opened, but writable stream is unavailable.",
        });
        await selectedPort.close();
        return;
      }

      const streamWriter = selectedPort.writable.getWriter();

      setPort(selectedPort);
      setWriter(streamWriter);
      setIsBlockedByPolicy(false);

      toast({
        title: "Arduino Connected",
        description: "Successfully established serial link with the board.",
      });
    } catch (err: any) {
      console.error("Serial connect error:", err);
      
      // Handle permission policy blocks (common in sandbox/iframes)
      if (err.name === 'SecurityError') {
        setIsBlockedByPolicy(true);
        toast({
          variant: "destructive",
          title: "Permission Blocked",
          description: "Hardware serial access is blocked inside preview mode. Run locally for full Arduino integration.",
        });
      } else if (err.name === 'NotFoundError') {
        // User cancelled the selection
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: err.message || "Could not connect to the serial port.",
        });
      }
    }
  }, [isSupported, toast]);

  const sendAlert = useCallback(async () => {
    if (!writer) return;

    try {
      await writer.write(new TextEncoder().encode("ALERT\n"));
    } catch (err) {
      console.error("Serial write error:", err);
      toast({
        variant: "destructive",
        title: "Alert Failed",
        description: "Could not send alert signal to the board.",
      });
    }
  }, [writer, toast]);

  const disconnect = useCallback(async () => {
    try {
      if (writer) {
        writer.releaseLock();
        setWriter(null);
      }

      if (port) {
        await port.close();
        setPort(null);
      }

      toast({
        title: "Arduino Disconnected",
        description: "Serial connection closed.",
      });
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  }, [port, writer, toast]);

  return {
    port,
    connect,
    disconnect,
    sendAlert,
    isConnected: !!port,
    isSupported,
    isBlockedByPolicy
  };
}
