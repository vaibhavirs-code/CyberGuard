
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

        // Clear any existing heartbeat
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);

        // Simple Heartbeat to ensure link remains active
        heartbeatRef.current = setInterval(() => {
          streamWriter.write(new TextEncoder().encode("PING\n")).catch((err) => {
            console.error("[HARDWARE] Heartbeat failed:", err);
            setStatus("OFFLINE");
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
          });
        }, 5000);

        toast({ 
          title: "Hardware Linked", 
          description: "Arduino Nano serial tunnel established successfully." 
        });
      }
    } catch (err: any) {
      console.error("[HARDWARE] Connection error:", err);
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
    if (!writer || status !== "CONNECTED") {
      console.warn("[HARDWARE] Cannot send alert: Not connected or writer unavailable", { status, hasWriter: !!writer });
      return;
    }
    
    try {
      console.log("[HARDWARE] Dispatching ALERT command...");
      await writer.write(new TextEncoder().encode("ALERT\n"));
      console.log("[HARDWARE] ALERT command written to stream");
    } catch (e) {
      console.error("[HARDWARE] Failed to write ALERT command:", e);
      setStatus("OFFLINE");
    }
  }, [writer, status]);

  return { status, connect, sendAlert, isBlockedByPolicy };
}
