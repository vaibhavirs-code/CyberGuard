import { INITIAL_ZONES } from "@/features/dashboard/dashboard-config";
import type { CameraFeedState, CameraStatus, ZoneDefinition } from "@/lib/types";

export const DEFAULT_CAMERA_ID = "CAM-1";

export function cloneCameraZones(zones: ZoneDefinition[] = INITIAL_ZONES): ZoneDefinition[] {
  return zones.map((zone) => ({ ...zone }));
}

export function createCameraFeedState(index: number, label = `Camera ${index}`): CameraFeedState {
  const id = `CAM-${index}`;

  return {
    id,
    label,
    status: "OFFLINE",
    sourceKind: "empty",
    customers: [],
    items: [],
    rawDetections: [],
    zones: cloneCameraZones(),
    logs: [],
    fps: 0,
    currentTime: 0,
    videoUrl: null,
    liveStream: null,
    streamUrl: "",
    isProcessingPayment: false,
    isTestingBuzzer: false,
    buzzerTestStatus: "idle",
    buzzerTestMessage: null,
  };
}

export function resolveCameraStatus(camera: CameraFeedState, isModelLoading: boolean): CameraStatus {
  if (camera.customers.some((customer) => customer.alerted || customer.riskState === "high_risk_suspicious_activity")) {
    return "ALERT";
  }

  if (isModelLoading && (camera.videoUrl || camera.liveStream || camera.streamUrl)) {
    return "LOADING";
  }

  if (camera.videoUrl || camera.liveStream || camera.streamUrl) {
    return camera.status === "PAUSED" ? "PAUSED" : "LIVE";
  }

  return "OFFLINE";
}

export function cameraStatusClass(status: CameraStatus): string {
  switch (status) {
    case "ALERT":
      return "border-red-400/60 bg-red-500/15 text-red-200";
    case "LIVE":
      return "border-emerald-400/60 bg-emerald-500/15 text-emerald-200";
    case "LOADING":
      return "border-cyan-400/60 bg-cyan-500/15 text-cyan-100";
    case "PAUSED":
      return "border-amber-400/60 bg-amber-500/15 text-amber-100";
    case "OFFLINE":
    default:
      return "border-slate-500/60 bg-slate-700/30 text-slate-300";
  }
}
