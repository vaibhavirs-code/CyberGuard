"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { usePersonDetection } from "@/ai/use-person-detection";
import { useArduino } from "@/hooks/use-arduino";
import { createId } from "@/lib/id";
import { logger } from "@/lib/logger";
import type {
  BuzzerTestStatus,
  CameraFeedState,
  EvidenceSnapshot,
  OperatorSession,
  PaymentMethod,
  RawPersonDetection,
  SiteOverview,
  SystemLog,
  TrackedCustomer,
  TrackedItem,
  TrackerEvent,
  ZoneDefinition,
} from "@/lib/types";
import { automatedPaymentMatcherFlow } from "@/services/payment-matcher";
import { downloadEvidenceSnapshot, clearEvidenceSnapshots, loadEvidenceSnapshots, saveEvidenceSnapshot } from "@/services/evidence-storage";
import { getOperatorAccessToken } from "@/services/auth-service";

import {
  createDpiEvents,
  type DpiEvent,
} from "@/services/dpi-event-service";
import { ObjectTracker } from "@/tracking/object-tracker";
import {
  DEFAULT_CAMERA_ID,
  cloneCameraZones,
  createCameraFeedState,
  resolveCameraStatus,
} from "./camera-registry";
import { MAX_LOG_ENTRIES } from "./dashboard-config";

export interface DashboardController {
  dpiEvents: DpiEvent[];
  activeCamera: CameraFeedState;
  activeCameraId: string;
  addCamera: () => void;
  arduinoStatus: ReturnType<typeof useArduino>["status"];
  buzzerTestMessage: string | null;
  buzzerTestStatus: BuzzerTestStatus;
  cameras: CameraFeedState[];
  captureTheftEvidence: (cameraId: string, evidence: Omit<EvidenceSnapshot, "id" | "cameraId" | "cameraLabel">) => void;
  clearTheftEvidence: (cameraId: string) => Promise<void>;
  connectArduino: () => Promise<void>;
  connectError: string | null;
  currentTime: number;
  customers: TrackedCustomer[];
  fps: number;
  globalLogs: SystemLog[];
  isBlockedByPolicy: boolean;
  isLiveCaptureActive: boolean;
  isModelLoading: boolean;
  isProcessingPayment: boolean;
  isTestingBuzzer: boolean;
  isVideoLoaded: boolean;
  initializeCameraWall: (cameraCount: number) => void;
  items: TrackedItem[];
  logs: SystemLog[];
  modelError: string | null;
  rawDetections: RawPersonDetection[];
  removeCamera: (cameraId: string) => void;
  renameCamera: (cameraId: string, label: string) => void;
  sendTestAlert: () => Promise<void>;
  sendTestAlertForCamera: (cameraId: string) => Promise<void>;
  session: OperatorSession | null;
  setActiveCamera: (cameraId: string) => void;
  setCameraStreamUrl: (cameraId: string, streamUrl: string) => void;
  setSession: (session: OperatorSession | null) => void;
  setZones: (zones: ZoneDefinition[]) => void;
  setZonesForCamera: (cameraId: string, zones: ZoneDefinition[]) => void;
  simulatePayment: (method: PaymentMethod) => Promise<boolean>;
  simulatePaymentForCamera: (cameraId: string, method: PaymentMethod) => Promise<boolean>;
  siteOverview: SiteOverview;
  startLocalCameraForCamera: (cameraId: string) => Promise<void>;
  startScreenCapture: () => Promise<void>;
  startScreenCaptureForCamera: (cameraId: string) => Promise<void>;
  stopCameraSource: (cameraId: string) => void;
  stopScreenCapture: () => void;
  trackFrame: (video: HTMLVideoElement) => Promise<void>;
  trackFrameForCamera: (cameraId: string, video: HTMLVideoElement) => Promise<void>;
  uploadVideo: (event: ChangeEvent<HTMLInputElement>) => void;
  uploadVideoForCamera: (cameraId: string, event: ChangeEvent<HTMLInputElement>) => void;
  liveStream: MediaStream | null;
  videoUrl: string | null;
  zones: ZoneDefinition[];
}

const EVENT_SUPPRESSION_WINDOW_MS = 1800;
const RAW_DETECTION_HOLD_MS = 700;
const FRAME_THROTTLE_MS = 120;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected runtime error.";
}

function classifyEventCategory(event: TrackerEvent): SystemLog["category"] {
  switch (event.type) {
    case "item_touch":
    case "item_pickup":
    case "item_movement":
    case "item_return":
    case "item_near_exit":
    case "possible_checkout_interaction":
      return "ITEM";
    case "possible_transfer":
      return "TRANSFER";
    case "exit_crossing":
      return "EXIT";
    case "person_entered":
    case "zone_transition":
    case "person_interaction":
    case "lost_tracking":
      return "TRACK";
    default:
      return "SYSTEM";
  }
}

function classifyEventType(event: TrackerEvent): SystemLog["type"] {
  if (event.type === "possible_transfer") {
    return "transfer";
  }

  if (event.severity === "alert") {
    return "alert";
  }

  if (event.severity === "warning") {
    return "warning";
  }

  return "info";
}

function toEventSignature(event: TrackerEvent) {
  return `${event.type}|${event.personId ?? ""}|${event.relatedPersonId ?? ""}|${event.itemId ?? ""}|${event.zone ?? ""}`;
}

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function nextFrameFps(previousAt: number | undefined, now: number) {
  if (!previousAt) {
    return 0;
  }

  return Math.round(1000 / Math.max(1, now - previousAt));
}

function playLocalAlarm() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.09;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();

    const firstStop = audio.currentTime + 0.18;
    oscillator.stop(firstStop);
    oscillator.addEventListener("ended", () => {
      const second = audio.createOscillator();
      const secondGain = audio.createGain();
      second.type = "sine";
      second.frequency.value = 660;
      secondGain.gain.value = 0.08;
      second.connect(secondGain);
      secondGain.connect(audio.destination);
      second.start();
      second.stop(audio.currentTime + 0.18);
      second.addEventListener("ended", () => void audio.close());
    });
  } catch {
    // Browser autoplay policies may block sound; Arduino hardware alert remains available.
  }
}

export function useDashboardController(): DashboardController {
  const initialCamera = useMemo(() => createCameraFeedState(1), []);
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [cameras, setCameras] = useState<CameraFeedState[]>([initialCamera]);
  const [activeCameraId, setActiveCameraId] = useState(DEFAULT_CAMERA_ID);
  const [globalLogs, setGlobalLogs] = useState<SystemLog[]>([]);
  const [connectError, setConnectError] = useState<string | null>(null);
  const cameraSequenceRef = useRef(2);
  const camerasRef = useRef<CameraFeedState[]>([initialCamera]);
  const trackerRefs = useRef<Map<string, ObjectTracker>>(new Map([[DEFAULT_CAMERA_ID, new ObjectTracker()]]));
  const videoObjectUrlRefs = useRef<Map<string, string>>(new Map());
  const liveStreamRefs = useRef<Map<string, MediaStream>>(new Map());
  const eventCacheRefs = useRef<Map<string, Map<string, number>>>(new Map());
  const autoAlertedRef = useRef<Set<string>>(new Set());
  const processedPaymentIdsRef = useRef<Set<string>>(new Set());
  const processingCameraIdsRef = useRef<Set<string>>(new Set());
  const lastFrameAtRefs = useRef<Map<string, number>>(new Map());
  const { connect, sendAlert, status: arduinoStatus, isBlockedByPolicy } = useArduino();
  const { error: modelError, isModelLoading, processFrame } = usePersonDetection();

  useEffect(() => {
    camerasRef.current = cameras;
  }, [cameras]);

  const getCamera = useCallback((cameraId: string) => {
    return camerasRef.current.find((camera) => camera.id === cameraId);
  }, []);

  const ensureTracker = useCallback((cameraId: string) => {
    let tracker = trackerRefs.current.get(cameraId);
    if (!tracker) {
      tracker = new ObjectTracker();
      trackerRefs.current.set(cameraId, tracker);
    }

    return tracker;
  }, []);

  const updateCamera = useCallback((cameraId: string, updater: (camera: CameraFeedState) => CameraFeedState) => {
    setCameras((previousCameras) =>
      previousCameras.map((camera) => (camera.id === cameraId ? updater(camera) : camera)),
    );
  }, []);

  const addLog = useCallback(
    (
      cameraId: string,
      message: string,
      type: SystemLog["type"] = "info",
      category: SystemLog["category"] = "SYSTEM",
      reasoning?: string,
      confidence?: number,
      trackerId?: string,
      relatedTrackerId?: string,
      itemId?: string,
    ) => {
      const camera = getCamera(cameraId);
      const log: SystemLog = {
        id: createId("LOG"),
        timestamp: new Date().toISOString(),
        type,
        category,
        message,
        reasoning,
        confidence,
        trackerId,
        relatedTrackerId,
        itemId,
        cameraId,
        cameraLabel: camera?.label ?? cameraId,
      };

      updateCamera(cameraId, (currentCamera) => ({
        ...currentCamera,
        logs: [log, ...currentCamera.logs].slice(0, MAX_LOG_ENTRIES),
      }));
      setGlobalLogs((previousLogs) => [log, ...previousLogs].slice(0, MAX_LOG_ENTRIES));
    },
    [getCamera, updateCamera],
  );

  const captureTheftEvidence = useCallback(
    (cameraId: string, evidence: Omit<EvidenceSnapshot, "id" | "cameraId" | "cameraLabel">) => {
      const camera = getCamera(cameraId);
      if (!camera) return;
      const snapshot: EvidenceSnapshot = {
        ...evidence,
        id: createId("EVIDENCE"),
        cameraId,
        cameraLabel: camera.label,
      };
      updateCamera(cameraId, (currentCamera) => ({
        ...currentCamera,
        evidenceSnapshots: [snapshot, ...currentCamera.evidenceSnapshots].slice(0, 5),
      }));
      void saveEvidenceSnapshot(snapshot).catch(() => undefined);
      // Browser downloads are placed in the user's configured Downloads folder.
      // IndexedDB remains the local in-app copy used by the dashboard.
      downloadEvidenceSnapshot(snapshot);
      addLog(cameraId, `Evidence snapshot captured for ${evidence.customerId}`, "alert", "EXIT", evidence.reasons.join(", "), evidence.riskScore, evidence.customerId);
    },
    [addLog, getCamera, updateCamera],
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      cameras.map(async (camera) => {
        const snapshots = await loadEvidenceSnapshots(camera.id).catch(() => []);
        if (cancelled || snapshots.length === 0) return;
        updateCamera(camera.id, (currentCamera) => ({
          ...currentCamera,
          evidenceSnapshots: currentCamera.evidenceSnapshots.length > 0
            ? currentCamera.evidenceSnapshots
            : snapshots,
        }));
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [cameras.length, updateCamera]);

  const clearTheftEvidence = useCallback(async (cameraId: string) => {
    await clearEvidenceSnapshots(cameraId).catch(() => undefined);
    updateCamera(cameraId, (currentCamera) => ({
      ...currentCamera,
      evidenceSnapshots: [],
    }));
  }, [updateCamera]);

  useEffect(() => {
    if (modelError) {
      addLog(DEFAULT_CAMERA_ID, "Person detector failed to load", "error", "SYSTEM", modelError);
      return;
    }

    if (!isModelLoading) {
      addLog(DEFAULT_CAMERA_ID, "Person detector online", "success", "SYSTEM");
    }
  }, [addLog, isModelLoading, modelError]);

  useEffect(() => {
    const videoObjectUrls = videoObjectUrlRefs.current;
    const liveStreams = liveStreamRefs.current;

    return () => {
      for (const objectUrl of videoObjectUrls.values()) {
        URL.revokeObjectURL(objectUrl);
      }

      for (const stream of liveStreams.values()) {
        stopMediaStream(stream);
      }
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setCameras((previousCameras) =>
        previousCameras.map((camera) => ({
          ...camera,
          rawDetections: camera.rawDetections.filter((detection) => now - detection.seenAt < RAW_DETECTION_HOLD_MS),
        })),
      );
    }, 120);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    for (const camera of cameras) {
      for (const customer of camera.customers) {
        const alertKey = `${camera.id}:${customer.id}`;
        if (
          customer.alerted &&
          !autoAlertedRef.current.has(alertKey) &&
          customer.riskState === "high_risk_suspicious_activity"
        ) {
          autoAlertedRef.current.add(alertKey);
          playLocalAlarm();

          addLog(
            camera.id,
            `High-risk event persisted on ${camera.label} for ${customer.id}`,
            "alert",
            "EXIT",
            customer.riskReasons.join(", "),
            customer.riskScore,
            customer.id,
          );

          if (arduinoStatus === "CONNECTED") {
            void sendAlert().then((sent) => {
              addLog(
                camera.id,
                sent ? "Hardware alert signal dispatched" : "Hardware alert signal failed",
                sent ? "success" : "error",
                "HARDWARE",
                sent
                  ? "Serial alert path completed successfully for this camera event."
                  : "Serial write failed or device went offline.",
                undefined,
                customer.id,
              );
            });
          } else {
            addLog(
              camera.id,
              "Hardware alert suppressed because the serial link is offline",
              "warning",
              "HARDWARE",
              undefined,
              undefined,
              customer.id,
            );
          }
        }
      }
    }
  }, [addLog, arduinoStatus, cameras, sendAlert]);



  const appendTrackerEvents = useCallback(
    (cameraId: string, events: TrackerEvent[]) => {
      const now = Date.now();
      let eventCache = eventCacheRefs.current.get(cameraId);
      if (!eventCache) {
        eventCache = new Map();
        eventCacheRefs.current.set(cameraId, eventCache);
      }

      for (const event of events) {
        const signature = toEventSignature(event);
        const previousAt = eventCache.get(signature);
        if (previousAt && now - previousAt < EVENT_SUPPRESSION_WINDOW_MS) {
          continue;
        }

        eventCache.set(signature, now);
        addLog(
          cameraId,
          event.message,
          classifyEventType(event),
          classifyEventCategory(event),
          event.reasoning,
          event.confidence,
          event.personId,
          event.relatedPersonId,
          event.itemId,
        );
      }

      for (const [signature, timestamp] of eventCache.entries()) {
        if (now - timestamp > EVENT_SUPPRESSION_WINDOW_MS * 3) {
          eventCache.delete(signature);
        }
      }
    },
    [addLog],
  );

  const applyTrackerState = useCallback(
    (cameraId: string, snapshot: ReturnType<ObjectTracker["getState"]>) => {
      appendTrackerEvents(cameraId, snapshot.events);
      startTransition(() => {
        updateCamera(cameraId, (camera) => ({
          ...camera,
          customers: snapshot.customers,
          items: snapshot.items,
          status: resolveCameraStatus({ ...camera, customers: snapshot.customers }, isModelLoading),
        }));
      });
    },
    [appendTrackerEvents, isModelLoading, updateCamera],
  );

  // Automatic payment bridge: authenticated operators can receive captured Razorpay
  // events from the server webhook and match them to the active person track.
  useEffect(() => {
    if (!session || session.mode !== "ACTIVE") return;

    let cancelled = false;
    let since = Date.now() - 15000;

    const poll = async () => {
      const token = getOperatorAccessToken();
      if (!token || cancelled) return;

      try {
        const response = await fetch(`/api/payments/webhook?since=${since}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!response.ok) return;

        const body = (await response.json()) as {
          events?: Array<{
            id: string;
            external_payment_id?: string;
            method?: string;
            confirmed?: boolean;
            timestamp?: number;
            reference_id?: string;
          }>;
        };

        for (const event of body.events ?? []) {
          since = Math.max(since, event.timestamp ?? Date.now());
          const paymentId = event.external_payment_id ?? event.id;
          if (processedPaymentIdsRef.current.has(paymentId)) continue;
          processedPaymentIdsRef.current.add(paymentId);

          if (event.confirmed !== true) continue;

          const method = event.method === "card" || event.method === "pos" || event.method === "qr" || event.method === "cash" || event.method === "upi"
            ? event.method
            : "upi";

          for (const camera of camerasRef.current) {
            const result = await automatedPaymentMatcherFlow({
              customers: camera.customers,
              paymentEvent: {
                method,
                referenceId: event.reference_id ?? paymentId,
                confirmed: true,
                timestamp: event.timestamp ?? Date.now(),
              },
              zones: camera.zones,
            });

            if (!result.matchedCustomerId) continue;

            ensureTracker(camera.id).markPaid(result.matchedCustomerId, method);
            applyTrackerState(camera.id, ensureTracker(camera.id).getState());
            addLog(
              camera.id,
              `Automatic payment confirmed for ${result.matchedCustomerId}`,
              "success",
              "PAYMENT",
              result.message,
              1,
              result.matchedCustomerId,
            );
            break;
          }
        }
      } catch {
        // Payment bridge is optional; camera monitoring continues if the gateway is unavailable.
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 1500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [applyTrackerState, addLog, ensureTracker, session]);

  const resetCameraRuntime = useCallback(
    (cameraId: string) => {
      ensureTracker(cameraId).reset();
      eventCacheRefs.current.get(cameraId)?.clear();
      for (const key of Array.from(autoAlertedRef.current)) {
        if (key.startsWith(`${cameraId}:`)) {
          autoAlertedRef.current.delete(key);
        }
      }
      processingCameraIdsRef.current.delete(cameraId);
      lastFrameAtRefs.current.delete(cameraId);

      updateCamera(cameraId, (camera) => ({
        ...camera,
        customers: [],
        items: [],
        rawDetections: [],
        fps: 0,
        currentTime: 0,
        buzzerTestStatus: "idle",
        buzzerTestMessage: null,
        evidenceSnapshots: [],
      }));
    },
    [ensureTracker, updateCamera],
  );

  const stopCameraSource = useCallback(
    (cameraId: string) => {
      const objectUrl = videoObjectUrlRefs.current.get(cameraId);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        videoObjectUrlRefs.current.delete(cameraId);
      }

      const stream = liveStreamRefs.current.get(cameraId);
      if (stream) {
        stopMediaStream(stream);
        liveStreamRefs.current.delete(cameraId);
      }

      updateCamera(cameraId, (camera) => ({
        ...camera,
        status: "OFFLINE",
        sourceKind: "empty",
        videoUrl: null,
        liveStream: null,
        streamUrl: "",
      }));
      addLog(cameraId, "Camera source stopped", "info", "SYSTEM");
    },
    [addLog, updateCamera],
  );

  const trackFrameForCamera = useCallback(
    async (cameraId: string, video: HTMLVideoElement) => {
      const camera = getCamera(cameraId);
      if (!camera || processingCameraIdsRef.current.has(cameraId)) {
        return;
      }

      const now = Date.now();
      const previousFrameAt = lastFrameAtRefs.current.get(cameraId);
      if (previousFrameAt && now - previousFrameAt < FRAME_THROTTLE_MS) {
        return;
      }

      processingCameraIdsRef.current.add(cameraId);
      lastFrameAtRefs.current.set(cameraId, now);

      try {
        const detections = await processFrame(video);
        if (!detections) {
          return;
        }

        const seenAt = Date.now();
        const rawFromFrame: RawPersonDetection[] = detections.map((detection, index) => ({
          ...detection,
          id: detection.id ?? `${cameraId}-D-${seenAt}-${index}`,
          seenAt,
        }));

        updateCamera(cameraId, (currentCamera) => ({
          ...currentCamera,
          rawDetections:
            rawFromFrame.length > 0
              ? rawFromFrame
              : currentCamera.rawDetections.filter((detection) => seenAt - detection.seenAt < RAW_DETECTION_HOLD_MS),
          currentTime: video.currentTime,
          fps: nextFrameFps(previousFrameAt, seenAt),
          status: resolveCameraStatus(currentCamera, isModelLoading),
        }));

        applyTrackerState(cameraId, ensureTracker(cameraId).update(detections, camera.zones));
      } catch (error) {
        logger.error("Frame processing failed", {
          cameraId,
          error: getErrorMessage(error),
        });
        addLog(cameraId, "Frame processing failed", "error", "SYSTEM", getErrorMessage(error));
      } finally {
        processingCameraIdsRef.current.delete(cameraId);
      }
    },
    [addLog, applyTrackerState, ensureTracker, getCamera, isModelLoading, processFrame, updateCamera],
  );

  const simulatePaymentForCamera = useCallback(
    async (cameraId: string, method: PaymentMethod) => {
      const camera = getCamera(cameraId);
      if (!camera) {
        return false;
      }

      updateCamera(cameraId, (currentCamera) => ({ ...currentCamera, isProcessingPayment: true }));
      const paymentReference = createId("PAY");

      try {
        const result = await automatedPaymentMatcherFlow({
          customers: camera.customers,
          paymentEvent: {
            method,
            referenceId: paymentReference,
            confirmed: true,
            timestamp: Date.now(),
          },
          zones: camera.zones,
        });

        if (!result.matchedCustomerId) {
          addLog(cameraId, "Payment received but customer attribution stayed ambiguous", "warning", "PAYMENT", result.message);
          return false;
        }

        ensureTracker(cameraId).markPaid(result.matchedCustomerId, method);
        applyTrackerState(cameraId, ensureTracker(cameraId).getState());

        addLog(
          cameraId,
          `Payment confirmed for ${result.matchedCustomerId}`,
          "success",
          "PAYMENT",
          result.message,
          1,
          result.matchedCustomerId,
        );
        return true;
      } catch (error) {
        logger.error("Payment matching failed", {
          cameraId,
          error: getErrorMessage(error),
        });
        addLog(cameraId, "Payment matching failed", "error", "PAYMENT", getErrorMessage(error));
        return false;
      } finally {
        updateCamera(cameraId, (currentCamera) => ({ ...currentCamera, isProcessingPayment: false }));
      }
    },
    [addLog, applyTrackerState, ensureTracker, getCamera, updateCamera],
  );

  const uploadVideoForCamera = useCallback(
    (cameraId: string, event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      stopCameraSource(cameraId);
      const objectUrl = URL.createObjectURL(file);
      videoObjectUrlRefs.current.set(cameraId, objectUrl);
      resetCameraRuntime(cameraId);
      updateCamera(cameraId, (camera) => ({
        ...camera,
        status: "LIVE",
        sourceKind: "upload",
        videoUrl: objectUrl,
        liveStream: null,
        streamUrl: "",
      }));
      addLog(cameraId, `Loaded local video ${file.name}`, "info", "SYSTEM");
      event.target.value = "";
    },
    [addLog, resetCameraRuntime, stopCameraSource, updateCamera],
  );

  const startScreenCaptureForCamera = useCallback(
    async (cameraId: string) => {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        addLog(cameraId, "Live screen capture is not supported in this browser.", "error", "SYSTEM");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const [videoTrack] = stream.getVideoTracks();
        if (videoTrack) {
          videoTrack.onended = () => {
            liveStreamRefs.current.delete(cameraId);
            updateCamera(cameraId, (camera) => ({
              ...camera,
              status: "OFFLINE",
              liveStream: null,
              sourceKind: camera.videoUrl ? "upload" : "empty",
            }));
            addLog(cameraId, "Live screen capture ended", "info", "SYSTEM");
          };
        }

        stopCameraSource(cameraId);
        resetCameraRuntime(cameraId);
        liveStreamRefs.current.set(cameraId, stream);
        updateCamera(cameraId, (camera) => ({
          ...camera,
          status: "LIVE",
          sourceKind: "screen",
          videoUrl: null,
          liveStream: stream,
          streamUrl: "",
        }));
        addLog(cameraId, "Started live screen capture source", "success", "SYSTEM");
      } catch (error) {
        addLog(cameraId, "Live screen capture failed to start", "error", "SYSTEM", getErrorMessage(error));
      }
    },
    [addLog, resetCameraRuntime, stopCameraSource, updateCamera],
  );

  const startLocalCameraForCamera = useCallback(
    async (cameraId: string) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        addLog(cameraId, "Local camera input is not supported in this browser.", "error", "SYSTEM");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        const [videoTrack] = stream.getVideoTracks();
        if (videoTrack) {
          videoTrack.onended = () => {
            liveStreamRefs.current.delete(cameraId);
            updateCamera(cameraId, (camera) => ({
              ...camera,
              status: "OFFLINE",
              liveStream: null,
              sourceKind: "empty",
            }));
            addLog(cameraId, "Local camera source ended", "info", "SYSTEM");
          };
        }

        stopCameraSource(cameraId);
        resetCameraRuntime(cameraId);
        liveStreamRefs.current.set(cameraId, stream);
        updateCamera(cameraId, (camera) => ({
          ...camera,
          status: "LIVE",
          sourceKind: "local",
          videoUrl: null,
          liveStream: stream,
          streamUrl: "",
        }));
        addLog(cameraId, "Started local camera source", "success", "SYSTEM");
      } catch (error) {
        addLog(cameraId, "Local camera failed to start", "error", "SYSTEM", getErrorMessage(error));
      }
    },
    [addLog, resetCameraRuntime, stopCameraSource, updateCamera],
  );

  const setCameraStreamUrl = useCallback(
    (cameraId: string, streamUrl: string) => {
      const trimmedUrl = streamUrl.trim();
      if (!trimmedUrl) {
        updateCamera(cameraId, (camera) => ({ ...camera, streamUrl: "" }));
        return;
      }

      stopCameraSource(cameraId);
      resetCameraRuntime(cameraId);
      updateCamera(cameraId, (camera) => ({
        ...camera,
        status: "LIVE",
        sourceKind: "stream",
        videoUrl: trimmedUrl,
        liveStream: null,
        streamUrl: trimmedUrl,
      }));
      addLog(cameraId, "Registered stream URL source", "info", "SYSTEM", "Browser playback depends on the stream format.");
    },
    [addLog, resetCameraRuntime, stopCameraSource, updateCamera],
  );

  const connectArduino = useCallback(async () => {
    setConnectError(null);

    try {
      await connect();
      addLog(activeCameraId, "Serial link connected", "success", "HARDWARE");
    } catch (error) {
      const message = getErrorMessage(error);
      setConnectError(message);
      addLog(activeCameraId, "Serial link connection failed", "error", "HARDWARE", message);
    }
  }, [activeCameraId, addLog, connect]);

  const sendTestAlertForCamera = useCallback(
    async (cameraId: string) => {
      updateCamera(cameraId, (camera) => ({
        ...camera,
        isTestingBuzzer: true,
        buzzerTestStatus: "sending",
        buzzerTestMessage: "Manual hardware test is sending.",
      }));

      try {
        const sent = await sendAlert();
        updateCamera(cameraId, (camera) => ({
          ...camera,
          buzzerTestStatus: sent ? "success" : "failure",
          buzzerTestMessage: sent ? "Manual hardware test completed." : "Manual hardware test failed.",
        }));
        addLog(
          cameraId,
          sent ? "Manual hardware test completed" : "Manual hardware test failed",
          sent ? "success" : "error",
          "HARDWARE",
          sent
            ? "The same serial alert path used by automated alerts completed successfully."
            : "Serial write failed or device is not connected.",
        );
      } catch (error) {
        updateCamera(cameraId, (camera) => ({
          ...camera,
          buzzerTestStatus: "failure",
          buzzerTestMessage: "Manual hardware test failed.",
        }));
        addLog(cameraId, "Manual hardware test failed", "error", "HARDWARE", getErrorMessage(error));
      } finally {
        updateCamera(cameraId, (camera) => ({ ...camera, isTestingBuzzer: false }));
      }
    },
    [addLog, sendAlert, updateCamera],
  );

  const setZonesForCamera = useCallback(
    (cameraId: string, zones: ZoneDefinition[]) => {
      updateCamera(cameraId, (camera) => ({ ...camera, zones: cloneCameraZones(zones) }));
      addLog(cameraId, "Camera zone layout updated", "info", "SYSTEM");
    },
    [addLog, updateCamera],
  );

  const addCamera = useCallback(() => {
    const nextIndex = cameraSequenceRef.current;
    cameraSequenceRef.current += 1;
    const camera = createCameraFeedState(nextIndex);

    trackerRefs.current.set(camera.id, new ObjectTracker());
    setCameras((previousCameras) => [...previousCameras, camera]);
    setActiveCameraId(camera.id);

    const log: SystemLog = {
      id: createId("LOG"),
      timestamp: new Date().toISOString(),
      type: "success",
      category: "SYSTEM",
      message: `${camera.label} added to the security wall`,
      cameraId: camera.id,
      cameraLabel: camera.label,
    };
    setGlobalLogs((previousLogs) => [log, ...previousLogs].slice(0, MAX_LOG_ENTRIES));
  }, []);

  const initializeCameraWall = useCallback(
    (cameraCount: number) => {
      const normalizedCount = Math.max(1, Math.floor(cameraCount));

      for (const objectUrl of videoObjectUrlRefs.current.values()) {
        URL.revokeObjectURL(objectUrl);
      }

      for (const stream of liveStreamRefs.current.values()) {
        stopMediaStream(stream);
      }

      const nextCameras = Array.from({ length: normalizedCount }, (_, index) => createCameraFeedState(index + 1));
      const nextTrackers = new Map<string, ObjectTracker>();
      for (const camera of nextCameras) {
        nextTrackers.set(camera.id, new ObjectTracker());
      }

      videoObjectUrlRefs.current.clear();
      liveStreamRefs.current.clear();
      eventCacheRefs.current.clear();
      autoAlertedRef.current.clear();
      processingCameraIdsRef.current.clear();
      lastFrameAtRefs.current.clear();
      trackerRefs.current = nextTrackers;
      camerasRef.current = nextCameras;
      cameraSequenceRef.current = normalizedCount + 1;

      setCameras(nextCameras);
      setActiveCameraId(nextCameras[0]?.id ?? DEFAULT_CAMERA_ID);
      setGlobalLogs([
        {
          id: createId("LOG"),
          timestamp: new Date().toISOString(),
          type: "success",
          category: "SYSTEM",
          message: `Deployment initialized with ${normalizedCount} independent camera ${normalizedCount === 1 ? "feed" : "feeds"}`,
          cameraId: nextCameras[0]?.id,
          cameraLabel: nextCameras[0]?.label,
        },
      ]);
    },
    [],
  );

  const removeCamera = useCallback(
    (cameraId: string) => {
      if (camerasRef.current.length <= 1) {
        addLog(cameraId, "At least one camera must remain online in the dashboard.", "warning", "SYSTEM");
        return;
      }

      stopCameraSource(cameraId);
      trackerRefs.current.delete(cameraId);
      eventCacheRefs.current.delete(cameraId);
      processingCameraIdsRef.current.delete(cameraId);
      lastFrameAtRefs.current.delete(cameraId);
      for (const key of Array.from(autoAlertedRef.current)) {
        if (key.startsWith(`${cameraId}:`)) {
          autoAlertedRef.current.delete(key);
        }
      }

      const removedCamera = getCamera(cameraId);
      const nextActiveCamera = camerasRef.current.find((camera) => camera.id !== cameraId);
      setCameras((previousCameras) => previousCameras.filter((camera) => camera.id !== cameraId));
      if (activeCameraId === cameraId && nextActiveCamera) {
        setActiveCameraId(nextActiveCamera.id);
      }

      const log: SystemLog = {
        id: createId("LOG"),
        timestamp: new Date().toISOString(),
        type: "warning",
        category: "SYSTEM",
        message: `${removedCamera?.label ?? cameraId} removed from the security wall`,
        cameraId,
        cameraLabel: removedCamera?.label ?? cameraId,
      };
      setGlobalLogs((previousLogs) => [log, ...previousLogs].slice(0, MAX_LOG_ENTRIES));
    },
    [activeCameraId, addLog, getCamera, stopCameraSource],
  );

  const renameCamera = useCallback(
    (cameraId: string, label: string) => {
      const nextLabel = label.trim();
      if (!nextLabel) {
        return;
      }

      updateCamera(cameraId, (camera) => ({ ...camera, label: nextLabel }));
      addLog(cameraId, `Camera renamed to ${nextLabel}`, "info", "SYSTEM");
    },
    [addLog, updateCamera],
  );

  const activeCamera = useMemo(() => {
    return cameras.find((camera) => camera.id === activeCameraId) ?? cameras[0] ?? initialCamera;
  }, [activeCameraId, cameras, initialCamera]);

  const siteOverview = useMemo<SiteOverview>(() => {
    return {
      activeCameraCount: cameras.filter((camera) => resolveCameraStatus(camera, isModelLoading) !== "OFFLINE").length,
      totalTrackedPeople: cameras.reduce((total, camera) => total + camera.customers.length, 0),
      totalAlerts: cameras.reduce(
        (total, camera) =>
          total + camera.customers.filter((customer) => customer.alerted || customer.riskState === "high_risk_suspicious_activity").length,
        0,
      ),
      activeCameraId: activeCamera.id,
      activeCameraLabel: activeCamera.label,
    };
  }, [activeCamera, cameras, isModelLoading]);

  const setZones = useCallback(
    (zones: ZoneDefinition[]) => setZonesForCamera(activeCameraId, zones),
    [activeCameraId, setZonesForCamera],
  );

  const trackFrame = useCallback(
    (video: HTMLVideoElement) => trackFrameForCamera(activeCameraId, video),
    [activeCameraId, trackFrameForCamera],
  );

  const uploadVideo = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => uploadVideoForCamera(activeCameraId, event),
    [activeCameraId, uploadVideoForCamera],
  );

  const startScreenCapture = useCallback(
    () => startScreenCaptureForCamera(activeCameraId),
    [activeCameraId, startScreenCaptureForCamera],
  );

  const stopScreenCapture = useCallback(() => {
    stopCameraSource(activeCameraId);
  }, [activeCameraId, stopCameraSource]);

  const simulatePayment = useCallback(
    (method: PaymentMethod) => simulatePaymentForCamera(activeCameraId, method),
    [activeCameraId, simulatePaymentForCamera],
  );

  const sendTestAlert = useCallback(
    () => sendTestAlertForCamera(activeCameraId),
    [activeCameraId, sendTestAlertForCamera],
  );

  const camerasWithResolvedStatus = useMemo(
    () =>
      cameras.map((camera) => ({
        ...camera,
        status: resolveCameraStatus(camera, isModelLoading),
      })),
    [cameras, isModelLoading],
  );

  const resolvedActiveCamera = useMemo(() => {
    return camerasWithResolvedStatus.find((camera) => camera.id === activeCameraId) ?? camerasWithResolvedStatus[0] ?? activeCamera;
  }, [activeCamera, activeCameraId, camerasWithResolvedStatus]);
  
    const dpiEvents = useMemo(
    () => createDpiEvents(resolvedActiveCamera.customers),
    [resolvedActiveCamera.customers],
    );

  return useMemo(
    () => ({
      activeCamera: resolvedActiveCamera,
      activeCameraId: resolvedActiveCamera.id,
      captureTheftEvidence,
      clearTheftEvidence,
      addCamera,
      dpiEvents,
      arduinoStatus,
      buzzerTestMessage: resolvedActiveCamera.buzzerTestMessage,
      buzzerTestStatus: resolvedActiveCamera.buzzerTestStatus,
      cameras: camerasWithResolvedStatus,
      connectArduino,
      connectError,
      currentTime: resolvedActiveCamera.currentTime,
      customers: resolvedActiveCamera.customers,
      fps: resolvedActiveCamera.fps,
      globalLogs,
      isBlockedByPolicy,
      isLiveCaptureActive: resolvedActiveCamera.liveStream !== null,
      isModelLoading,
      isProcessingPayment: resolvedActiveCamera.isProcessingPayment,
      isTestingBuzzer: resolvedActiveCamera.isTestingBuzzer,
      isVideoLoaded: resolvedActiveCamera.videoUrl !== null || resolvedActiveCamera.liveStream !== null,
      initializeCameraWall,
      items: resolvedActiveCamera.items,
      liveStream: resolvedActiveCamera.liveStream,
      logs: resolvedActiveCamera.logs,
      modelError,
      rawDetections: resolvedActiveCamera.rawDetections,
      removeCamera,
      renameCamera,
      sendTestAlert,
      sendTestAlertForCamera,
      session,
      setActiveCamera: setActiveCameraId,
      setCameraStreamUrl,
      setSession,
      setZones,
      setZonesForCamera,
      simulatePayment,
      simulatePaymentForCamera,
      siteOverview,
      startLocalCameraForCamera,
      startScreenCapture,
      startScreenCaptureForCamera,
      stopCameraSource,
      stopScreenCapture,
      trackFrame,
      trackFrameForCamera,
      uploadVideo,
      uploadVideoForCamera,
      videoUrl: resolvedActiveCamera.videoUrl,
      zones: resolvedActiveCamera.zones,
    }),
    [
      addCamera,
      captureTheftEvidence,
      clearTheftEvidence,
      arduinoStatus,
      camerasWithResolvedStatus,
      connectArduino,
      connectError,
      globalLogs,
      initializeCameraWall,
      isBlockedByPolicy,
      isModelLoading,
      modelError,
      removeCamera,
      renameCamera,
      resolvedActiveCamera,
      dpiEvents,
      sendTestAlert,
      sendTestAlertForCamera,
      session,
      setCameraStreamUrl,
      setZones,
      setZonesForCamera,
      simulatePayment,
      simulatePaymentForCamera,
      siteOverview,
      startLocalCameraForCamera,
      startScreenCapture,
      startScreenCaptureForCamera,
      stopCameraSource,
      stopScreenCapture,
      trackFrame,
      trackFrameForCamera,
      uploadVideo,
      uploadVideoForCamera,
    ],
  );
}
