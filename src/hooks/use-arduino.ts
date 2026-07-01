
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArduinoStatus } from "@/lib/types";
import { logger } from "@/lib/logger";

type SerialWriter = WritableStreamDefaultWriter<Uint8Array>;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected serial communication error.";
}

export function useArduino() {
  const [status, setStatus] = useState<ArduinoStatus>("DISCONNECTED");
  const [isBlockedByPolicy, setIsBlockedByPolicy] = useState(false);
  const { toast } = useToast();
  const heartbeatRef = useRef<number | undefined>(undefined);
  const writerRef = useRef<SerialWriter | null>(null);
  const portRef = useRef<SerialPort | null>(null);

  useEffect(() => {
    return () => {
      if (heartbeatRef.current !== undefined) {
        window.clearInterval(heartbeatRef.current);
      }

      if (writerRef.current) {
        writerRef.current.releaseLock();
        writerRef.current = null;
      }

      if (portRef.current) {
        void portRef.current.close().catch(() => undefined);
        portRef.current = null;
      }
    };
  }, []);

  const clearConnection = useCallback(async () => {
    if (heartbeatRef.current !== undefined) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = undefined;
    }

    if (writerRef.current) {
      writerRef.current.releaseLock();
      writerRef.current = null;
    }

    if (portRef.current) {
      await portRef.current.close().catch(() => undefined);
      portRef.current = null;
    }

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
      await clearConnection();
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });

      if (selectedPort.writable) {
        const streamWriter = selectedPort.writable.getWriter();
        writerRef.current = streamWriter;
        portRef.current = selectedPort;
        setStatus("CONNECTED");
        setIsBlockedByPolicy(false);

        if (heartbeatRef.current !== undefined) {
          window.clearInterval(heartbeatRef.current);
        }

        heartbeatRef.current = window.setInterval(() => {
          streamWriter.write(new TextEncoder().encode("PING\n")).catch((err) => {
            logger.error("Arduino heartbeat failed", { error: getErrorMessage(err) });
            setStatus("OFFLINE");
            void clearConnection();
          });
        }, 5000);

        toast({ 
          title: "Hardware Linked", 
          description: "Arduino Nano serial tunnel established successfully." 
        });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error("Arduino connection failed", { error: message });

      if (error instanceof DOMException && error.name === "SecurityError") {
        setIsBlockedByPolicy(true);
        setStatus("ERROR");
      } else {
        setStatus("OFFLINE");
        toast({ 
          variant: "destructive", 
          title: "Link Failed", 
          description: message,
        });
      }

      throw error;
    }
  }, [clearConnection, toast]);

  const sendAlert = useCallback(async () => {
    if (!writerRef.current || status !== "CONNECTED") {
      logger.warn("Cannot send hardware alert", { status, hasWriter: !!writerRef.current });
      return false;
    }
    
    try {
      await writerRef.current.write(new TextEncoder().encode("ALERT\n"));
      return true;
    } catch (error) {
      logger.error("Failed to write ALERT command", { error: getErrorMessage(error) });
      setStatus("OFFLINE");
      await clearConnection();
      return false;
    }
  }, [clearConnection, status]);

  return { status, connect, sendAlert, isBlockedByPolicy };
}
