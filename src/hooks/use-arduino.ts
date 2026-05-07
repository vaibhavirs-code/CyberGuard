"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

type SerialWriter = WritableStreamDefaultWriter<Uint8Array<ArrayBufferLike>>;

export function useArduino() {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [writer, setWriter] = useState<SerialWriter | null>(null);
  const { toast } = useToast();

  const connect = useCallback(async () => {
    try {
      if (!("serial" in navigator)) {
        toast({
          variant: "destructive",
          title: "Not Supported",
          description: "Web Serial API not supported in this browser.",
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

      toast({
        title: "Arduino Connected",
        description: "Successfully established serial link with the board.",
      });
    } catch (err) {
      console.error("Serial connect error:", err);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Could not connect to the serial port.",
      });
    }
  }, [toast]);

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
  };
}