
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArduinoStatus } from "@/lib/types";

type SerialWriter = WritableStreamDefaultWriter<Uint8Array>;

export function useArduino() {
  const [status, setStatus] = useState<ArduinoStatus>("DISCONNECTED");
  const [writer, setWriter] = useState<SerialWriter | null>(null);
  const [port, setPort] = useState<SerialPort | null>(null);
  const [isBlockedByPolicy, setIsBlockedByPolicy] = useState(false);
  const { toast } = useToast();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      if (!("serial" in navigator)) {
        toast({ 
          variant: "destructive", 
          title: "Unsupported", 
          description: "Web Serial not supported in this browser." 
        });
        return;
      }

      setStatus("CONNECTING");
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });

      if (selectedPort.writable) {
        const streamWriter = selectedPort.writable.getWriter();
        setWriter(streamWriter);
        setPort(selectedPort);
        setStatus("CONNECTED");
        setIsBlockedByPolicy(false);

        // Simple Heartbeat to ensure link remains active
        heartbeatRef.current = setInterval(() => {
          streamWriter.write(new TextEncoder().encode("PING\n")).catch(() => {
            setStatus("OFFLINE");
            clearInterval(heartbeatRef.current!);
          });
        }, 5000);

        toast({ 
          title: "Hardware Linked", 
          description: "Arduino Nano serial tunnel established successfully." 
        });
      }
    } catch (err: any) {
      // Handle permission/policy blocks (common in Studio preview iframe)
      if (err.name === 'SecurityError') {
        setIsBlockedByPolicy(true);
        setStatus("ERROR");
      } else {
        setStatus("OFFLINE");
        toast({ 
          variant: "destructive", 
          title: "Link Failed", 
          description: err.message 
        });
      }
    }
  }, [toast]);

  const sendAlert = useCallback(async () => {
    if (!writer || status !== "CONNECTED") return;
    try {
      await writer.write(new TextEncoder().encode("ALERT\n"));
    } catch (e) {
      setStatus("OFFLINE");
    }
  }, [writer, status]);

  return { status, connect, sendAlert, isBlockedByPolicy };
}
