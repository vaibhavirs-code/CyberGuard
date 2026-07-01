"use client"

import React, { useEffect, useRef, useState } from "react";
import type {
  ArduinoStatus,
  BuzzerTestStatus,
  CameraFeedState,
  PaymentMethod,
  TrackedCustomer,
  TrackedItem,
} from "@/lib/types";
import { PaymentConsole } from "./payment-console";
import { Bell, Camera, Cpu, MonitorUp, Plus, Radio, Target, Trash2, Upload, Video, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { cameraStatusClass } from "@/features/dashboard/camera-registry";

interface SidebarPanelsProps {
  activeCamera: CameraFeedState;
  activeCameraId: string;
  cameras: CameraFeedState[];
  customers: TrackedCustomer[];
  items: TrackedItem[];
  isLiveCaptureActive: boolean;
  onAddCamera: () => void;
  onLocalCameraStart: () => Promise<void>;
  onRemoveCamera: (cameraId: string) => void;
  onRenameCamera: (cameraId: string, label: string) => void;
  onSelectCamera: (cameraId: string) => void;
  onSetStreamUrl: (cameraId: string, streamUrl: string) => void;
  onSimulatePayment: (method: PaymentMethod) => Promise<boolean>;
  onStartScreenCapture: () => Promise<void>;
  onStopCameraSource: (cameraId: string) => void;
  onStopScreenCapture: () => void;
  isProcessing: boolean;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTestAlert: () => Promise<void>;
  arduinoStatus: ArduinoStatus;
  onConnectArduino: () => void;
  isBlockedByPolicy: boolean;
  isVideoLoaded: boolean;
  isTestingBuzzer: boolean;
  buzzerTestStatus: BuzzerTestStatus;
  buzzerTestMessage: string | null;
}

function getStatusColor(status: ArduinoStatus) {
  switch (status) {
    case "CONNECTED":
      return "text-emerald-400 border-emerald-500/50 bg-emerald-500/10";
    case "CONNECTING":
      return "text-accent border-accent/50 bg-accent/10 animate-pulse";
    case "ERROR":
      return "text-red-400 border-red-500/50 bg-red-500/10";
    default:
      return "text-muted-foreground border-white/10 bg-white/5";
  }
}

function getBuzzerStatusColor(status: BuzzerTestStatus) {
  switch (status) {
    case "success":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
    case "failure":
      return "border-red-500/40 bg-red-500/10 text-red-400";
    case "sending":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    default:
      return "border-white/10 bg-white/5 text-muted-foreground";
  }
}

export const SidebarPanels: React.FC<SidebarPanelsProps> = ({
  activeCamera,
  activeCameraId,
  cameras,
  customers,
  items,
  isLiveCaptureActive,
  onAddCamera,
  onLocalCameraStart,
  onRemoveCamera,
  onRenameCamera,
  onSelectCamera,
  onSetStreamUrl,
  onSimulatePayment,
  onStartScreenCapture,
  onStopCameraSource,
  onStopScreenCapture,
  isProcessing,
  onVideoUpload,
  onTestAlert,
  arduinoStatus,
  onConnectArduino,
  isBlockedByPolicy,
  isVideoLoaded,
  isTestingBuzzer,
  buzzerTestStatus,
  buzzerTestMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [renameValue, setRenameValue] = useState(activeCamera.label);
  const [streamUrl, setStreamUrl] = useState(activeCamera.streamUrl);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setRenameValue(activeCamera.label);
    setStreamUrl(activeCamera.streamUrl);
  }, [activeCamera.id, activeCamera.label, activeCamera.streamUrl]);

  const isLocal = isMounted && typeof window !== "undefined" && window.location.hostname === "localhost";

  return (
    <div className="space-y-8 pb-12">
      <div className="glass rounded-[2rem] border-white/10 bg-black/40 p-8 aura-border">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-accent/20 p-3">
              <Camera className="h-6 w-6 text-accent" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.3em]">Camera Registry</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Independent security feeds</span>
            </div>
          </div>
          <Badge variant="outline" className="border-accent/40 bg-accent/10 text-[8px] uppercase tracking-widest text-accent">
            {cameras.length} feeds
          </Badge>
        </div>

        <div className="space-y-3">
          {cameras.map((camera) => (
            <button
              key={camera.id}
              type="button"
              onClick={() => onSelectCamera(camera.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                camera.id === activeCameraId
                  ? "border-accent/50 bg-accent/10"
                  : "border-white/10 bg-white/5 hover:border-accent/30 hover:bg-accent/5",
              )}
            >
              <div>
                <p className="font-code text-[11px] font-bold uppercase tracking-[0.24em] text-white">{camera.label}</p>
                <p className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">
                  {camera.id} / {camera.customers.length} tracks
                </p>
              </div>
              <span className={cn("rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-widest", cameraStatusClass(camera.status))}>
                {camera.status}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
          <input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 font-code text-[11px] text-white outline-none transition focus:border-accent/60"
            placeholder="Camera label"
          />
          <Button
            onClick={() => onRenameCamera(activeCamera.id, renameValue)}
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-accent/15"
          >
            Rename
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            onClick={onAddCamera}
            className="h-12 rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200 hover:bg-emerald-500/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Feed
          </Button>
          <Button
            onClick={() => onRemoveCamera(activeCamera.id)}
            disabled={cameras.length <= 1}
            className="h-12 rounded-xl border border-red-400/30 bg-red-500/10 text-[10px] font-bold uppercase tracking-[0.2em] text-red-200 hover:bg-red-500/20 disabled:opacity-40"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      </div>

      <div className="glass rounded-[2rem] border-white/10 bg-black/40 p-8 aura-border">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-primary/20 p-3">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.3em]">Vision Source</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{activeCamera.label}</span>
            </div>
          </div>
          {isVideoLoaded && (
            <Badge variant="outline" className="animate-pulse border-accent/50 bg-accent/10 text-[8px] uppercase tracking-widest text-accent">
              Live Feed
            </Badge>
          )}
        </div>

        <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={onVideoUpload} />

        <Button
          onClick={() => fileInputRef.current?.click()}
          className="h-14 w-full gap-4 rounded-2xl border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-[0.3em] transition-all shimmer group hover:bg-primary/15"
        >
          <Upload className="h-4 w-4 transition-transform group-hover:scale-110" />
          {isVideoLoaded ? "Replace Video Source" : "Upload Video Source"}
        </Button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button
            onClick={() => {
              if (isLiveCaptureActive) {
                onStopScreenCapture();
                return;
              }

              void onStartScreenCapture();
            }}
            className="h-12 rounded-2xl border border-sky-400/35 bg-sky-500/10 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200 transition-all hover:bg-sky-500/20"
          >
            <MonitorUp className="mr-2 h-4 w-4" />
            {isLiveCaptureActive ? "Stop Capture" : "Screen Capture"}
          </Button>
          <Button
            onClick={() => void onLocalCameraStart()}
            className="h-12 rounded-2xl border border-cyan-400/35 bg-cyan-500/10 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100 transition-all hover:bg-cyan-500/20"
          >
            <Camera className="mr-2 h-4 w-4" />
            Local Camera
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Radio className="h-4 w-4 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Stream URL</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <input
              value={streamUrl}
              onChange={(event) => setStreamUrl(event.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-black/30 px-4 font-code text-[10px] text-white outline-none transition focus:border-accent/60"
              placeholder="https://... / future RTSP bridge"
            />
            <Button
              onClick={() => onSetStreamUrl(activeCamera.id, streamUrl)}
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-accent/15"
            >
              Set
            </Button>
          </div>
          <p className="mt-2 text-[9px] text-muted-foreground">
            Browser playback depends on stream format. RTSP usually needs an HLS/WebRTC bridge.
          </p>
        </div>

        <Button
          onClick={() => onStopCameraSource(activeCamera.id)}
          className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:bg-white/10"
        >
          Stop Active Source
        </Button>
      </div>

      <div className="glass rounded-[2rem] border-white/10 p-8 aura-border">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-accent/20 p-3">
              <Cpu className="h-6 w-6 text-accent" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.3em]">Hardware Link</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Nano Serial V3</span>
            </div>
          </div>
          <Badge variant="outline" className={cn("h-5 px-3 text-[9px] uppercase", getStatusColor(arduinoStatus))}>
            {!isMounted ? "Checking..." : isLocal ? "Local Mode" : "Preview Mode"}
          </Badge>
        </div>

        {isBlockedByPolicy && !isLocal && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-[9px] font-medium italic text-amber-200/70">
              Hardware serial access blocked in preview. Run on localhost for full link.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Button
            disabled={arduinoStatus === "CONNECTED" || isBlockedByPolicy}
            onClick={onConnectArduino}
            className="h-14 w-full gap-4 rounded-2xl border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-[0.3em] transition-all hover:bg-accent/15"
          >
            {arduinoStatus === "CONNECTED" ? "Linked" : "Initialize Port"}
          </Button>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Test Buzzer</h4>
                <p className="text-[10px] text-muted-foreground">Manual hardware test / {activeCamera.label}</p>
              </div>
              <Badge variant="outline" className={cn("text-[8px] uppercase tracking-widest", getBuzzerStatusColor(buzzerTestStatus))}>
                {buzzerTestStatus}
              </Badge>
            </div>

            <Button
              onClick={() => void onTestAlert()}
              disabled={arduinoStatus !== "CONNECTED" || isTestingBuzzer}
              className="h-12 w-full rounded-xl border border-white/10 bg-red-500/10 text-[11px] font-bold uppercase tracking-[0.25em] text-red-400 transition-all hover:bg-red-500/20"
              title="Manual hardware test"
            >
              <Bell className="mr-2 h-4 w-4" />
              {isTestingBuzzer ? "Sending Test" : "Test Buzzer"}
            </Button>

            <p className="min-h-4 text-[10px] text-muted-foreground">
              {buzzerTestMessage ?? "Uses the same serial alert path as automated high-risk alerts."}
            </p>
          </div>
        </div>
      </div>

      <div className="glass rounded-[2rem] border-white/10 p-8 aura-border">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-yellow-500/20 p-3">
            <Zap className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.3em]">Payment Matching</h3>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{activeCamera.label} confirmation</span>
          </div>
        </div>
        <PaymentConsole onSimulatePayment={onSimulatePayment} isProcessing={isProcessing} />
      </div>

      <div className="glass rounded-[2rem] border-white/10 p-8 aura-border">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-2xl bg-primary/20 p-3">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.3em]">Tracking State</h3>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {customers.length} people / {items.length} inferred items
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {customers.length > 0 ? (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-accent">{customer.id}</span>
                  <Badge variant="outline" className="text-[8px] uppercase">
                    {customer.riskState.replaceAll("_", " ")}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] uppercase tracking-wide text-muted-foreground">
                  <span>State: {customer.state.replaceAll("_", " ")}</span>
                  <span>Track: {customer.trackingConfidence}</span>
                  <span>Zone: {customer.zone}</span>
                  <span>Items: {customer.associatedItemIds.length}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-accent transition-all duration-500" style={{ width: `${customer.riskScore * 100}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-[10px] font-bold uppercase tracking-widest opacity-20">
              No Targets Detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
