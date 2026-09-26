"use client"

import React, { useEffect, useMemo, useRef } from 'react';
import type { CameraStatus, RawPersonDetection, TrackedCustomer, TrackedProduct, ZoneDefinition as Zone } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INITIAL_ZONES } from '@/features/dashboard/dashboard-config';

interface VideoFeedProps {
  cameraId?: string;
  cameraLabel?: string;
  cameraStatus?: CameraStatus;
  customers: TrackedCustomer[];
  detectedProducts: TrackedProduct[];
  isActiveCamera?: boolean;
  rawDetections: RawPersonDetection[];
  zones: Zone[];
  videoUrl: string | null;
  liveStream: MediaStream | null;
  onFrame: (video: HTMLVideoElement) => Promise<void>;
  onTheftEvidence?: (evidence: { customerId: string; timestamp: string; riskScore: number; reasons: string[]; dataUrl: string }) => void;
  isModelLoading: boolean;
}

interface ZoneShape {
  points: string;
  label: { x: number; y: number };
  fillOpacity?: number;
}

const TRACK_STABLE_FRAMES = 5;
const RECOMMENDED_ZONE_LOOKUP = new Map(INITIAL_ZONES.map((zone) => [zone.id, zone]));

const ZONE_RENDER_PRIORITY: Record<string, number> = {
  shelf: 0,
  aisle: 1,
  checkout: 2,
  entrance: 3,
  exit: 4,
  outside: 5,
};

const ZONE_SHAPES: Record<string, ZoneShape> = {
  entrance: {
    points: "0,14 4,12 4,88 0,86",
    label: { x: 0.8, y: 16.8 },
    fillOpacity: 0.08,
  },
  checkout: {
    points: "1.5,12 21,12 22.5,26 22.5,78 18,88 3.5,88 1.5,70",
    label: { x: 4.4, y: 17.8 },
    fillOpacity: 0.13,
  },
  shelf: {
    points: "16,4 82,4 86,16 86,88 78,96 18,96 14,76 14,14",
    label: { x: 19.2, y: 8.6 },
    fillOpacity: 0.14,
  },
  aisle: {
    points: "33,9 61,9 68,22 68,84 46,90 28,76 28,18",
    label: { x: 34.8, y: 12.8 },
    fillOpacity: 0.07,
  },
  exit: {
    points: "82,14 90,15 90,84 82,86 79,64 79,22",
    label: { x: 82.8, y: 18.8 },
    fillOpacity: 0.12,
  },
  outside: {
    points: "90,12 100,12 100,88 90,88",
    label: { x: 90.8, y: 17.2 },
    fillOpacity: 0.16,
  },
};

function isRecommendedZoneGeometry(zone: Zone) {
  const recommendedZone = RECOMMENDED_ZONE_LOOKUP.get(zone.id);
  return (
    recommendedZone !== undefined &&
    recommendedZone.x === zone.x &&
    recommendedZone.y === zone.y &&
    recommendedZone.width === zone.width &&
    recommendedZone.height === zone.height
  );
}

function calcIou(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
) {
  const x1 = Math.max(left.x, right.x);
  const y1 = Math.max(left.y, right.y);
  const x2 = Math.min(left.x + left.width, right.x + right.width);
  const y2 = Math.min(left.y + left.height, right.y + right.height);
  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  const intersection = w * h;
  const leftArea = left.width * left.height;
  const rightArea = right.width * right.height;
  const union = leftArea + rightArea - intersection;
  return union <= 0 ? 0 : intersection / union;
}

function isStableTrack(customer: TrackedCustomer) {
  return customer.framesSeen >= TRACK_STABLE_FRAMES && customer.trackingConfidence !== "low";
}

function findClosestTrack(detection: RawPersonDetection, customers: TrackedCustomer[]) {
  let best: TrackedCustomer | undefined;
  let bestIou = 0;

  for (const customer of customers) {
    const score = calcIou(detection.bbox, customer.bbox);
    if (score > bestIou) {
      bestIou = score;
      best = customer;
    }
  }

  if (!best || bestIou < 0.12) {
    return undefined;
  }

  return best;
}

function getRiskColorClass(customer: TrackedCustomer) {
  switch (customer.riskState) {
    case "high_risk_suspicious_activity":
      return "border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.7)]";
    case "suspicious_activity":
    case "possible_removal":
      return "border-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.65)]";
    case "possible_transfer":
      return "border-violet-400 shadow-[0_0_25px_rgba(167,139,250,0.55)]";
    case "uncertain":
      return "border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)]";
    default:
      return customer.paid
        ? "border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]"
        : "border-accent shadow-[0_0_25px_rgba(25,136,245,0.5)]";
  }
}

function getHeaderBgClass(customer: TrackedCustomer) {
  switch (customer.riskState) {
    case "high_risk_suspicious_activity":
      return "bg-red-500/85";
    case "suspicious_activity":
    case "possible_removal":
      return "bg-orange-500/85";
    case "possible_transfer":
      return "bg-violet-500/85";
    case "uncertain":
      return "bg-yellow-500/85";
    default:
      return customer.paid ? "bg-emerald-500/80" : "bg-primary/80";
  }
}

function getTopLabelClass(box: { x: number; y: number; width: number }) {
  const isNearRightEdge = box.x + box.width > 82;
  const isNearTopEdge = box.y < 14;

  return cn(
    "absolute rounded-md border bg-black/70 px-2 py-1 text-[8px] uppercase tracking-widest",
    isNearRightEdge ? "right-0" : "left-0",
    isNearTopEdge ? "top-[calc(100%+0.25rem)]" : "-top-8",
  );
}

function getStatusCardClass(box: { x: number; y: number; width: number }) {
  const isNearRightEdge = box.x + box.width > 78;
  const isNearTopEdge = box.y < 18;

  return cn(
    "absolute px-3 py-1.5 min-w-[160px] backdrop-blur-xl border border-white/20 shadow-2xl rounded-t-xl",
    isNearRightEdge ? "right-0" : "left-0",
    isNearTopEdge ? "top-[calc(100%+0.25rem)] rounded-b-xl rounded-t-none" : "-top-14",
  );
}

function getBottomBadgeClass(box: { x: number; width: number }) {
  const isNearRightEdge = box.x + box.width > 78;
  return cn(
    "absolute bottom-2 rounded-md bg-black/60 px-2 py-1 text-[8px] uppercase tracking-wide text-white/80",
    isNearRightEdge ? "right-2" : "left-2",
  );
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  customers,
  detectedProducts,
  rawDetections,
  zones,
  videoUrl,
  liveStream,
  onFrame,
  onTheftEvidence,
  isModelLoading,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const capturedEvidenceRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (liveStream) {
      video.srcObject = liveStream;
      void video.play().catch(() => undefined);
      return;
    }

    if (video.srcObject) {
      video.srcObject = null;
    }
  }, [liveStream, videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onTheftEvidence) return;

    for (const customer of customers) {
      if (!customer.alerted || !customer.alertAt) continue;
      const evidenceKey = `${customer.id}:${customer.alertAt}`;
      if (capturedEvidenceRef.current.has(evidenceKey)) continue;

      try {
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0 || video.videoHeight === 0) continue;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        if (!context) continue;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Privacy protection: blur every tracked person before evidence is stored.
        // This keeps the incident context while masking identities of everyone the tracker sees.
        for (const person of customers) {
          const box = person.bbox;
          const sx = Math.max(0, Math.round((box.x / 100) * canvas.width));
          const sy = Math.max(0, Math.round((box.y / 100) * canvas.height));
          const sw = Math.min(canvas.width - sx, Math.max(1, Math.round((box.width / 100) * canvas.width)));
          const sh = Math.min(canvas.height - sy, Math.max(1, Math.round((box.height / 100) * canvas.height)));
          if (sw <= 0 || sh <= 0) continue;
          context.save();
          context.filter = "blur(18px)";
          context.drawImage(video, sx, sy, sw, sh, sx, sy, sw, sh);
          context.restore();
        }

        const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
        capturedEvidenceRef.current.add(evidenceKey);
        onTheftEvidence({
          customerId: customer.id,
          timestamp: new Date().toISOString(),
          riskScore: Number(customer.riskScore.toFixed(2)),
          reasons: customer.riskReasons,
          dataUrl,
        });
      } catch {
        // Cross-origin camera streams may block canvas extraction; detection continues normally.
      }
    }
  }, [customers, onTheftEvidence]);

  useEffect(() => {
    let frameId = 0;

    const tick = () => {
      const video = videoRef.current;
      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
        void onFrame(video);
      }

      frameId = requestAnimationFrame(tick);
    };

    const handlePlayable = () => {
      const video = videoRef.current;
      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        void onFrame(video);
      }
    };

    frameId = requestAnimationFrame(tick);
    const video = videoRef.current;
    video?.addEventListener("loadeddata", handlePlayable);
    video?.addEventListener("play", handlePlayable);
    video?.addEventListener("seeked", handlePlayable);

    return () => {
      cancelAnimationFrame(frameId);
      video?.removeEventListener("loadeddata", handlePlayable);
      video?.removeEventListener("play", handlePlayable);
      video?.removeEventListener("seeked", handlePlayable);
    };
  }, [onFrame, videoUrl, liveStream]);

  const hasSource = videoUrl !== null || liveStream !== null;

  const zoneVisuals = useMemo(() => {
    return zones
      .map((zone) => {
        const shape = isRecommendedZoneGeometry(zone) ? ZONE_SHAPES[zone.id] : undefined;
        const labelX = shape?.label.x ?? zone.x + 0.8;
        const labelY = shape?.label.y ?? zone.y + 3.2;
        const labelWidth = Math.max(12, zone.label.length * 0.9);

        return {
          zone,
          shape,
          labelX,
          labelY,
          labelWidth,
        };
      })
      .sort(
        (left, right) =>
          (ZONE_RENDER_PRIORITY[left.zone.id] ?? Number.MAX_SAFE_INTEGER) -
          (ZONE_RENDER_PRIORITY[right.zone.id] ?? Number.MAX_SAFE_INTEGER),
      );
  }, [zones]);

  return (
    <div className="group relative h-full w-full overflow-hidden rounded-[2.5rem] border border-white/5 bg-black shadow-2xl aura-border">
      {hasSource ? (
        <video
          ref={videoRef}
          src={liveStream ? undefined : (videoUrl ?? undefined)}
          autoPlay
          loop={liveStream === null}
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(15,252,235,0.08),transparent_65%)] px-8 text-center">
          <div className="mb-4 h-24 w-24 rounded-[2rem] border border-accent/20 bg-accent/10" />
          <h3 className="font-headline text-xl font-bold uppercase tracking-[0.3em] text-foreground">
            No Video Source
          </h3>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Upload a local video file or start live screen capture to begin detection.
          </p>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(rgba(15,252,235,0.1)_2px,transparent_2px),linear-gradient(90deg,rgba(15,252,235,0.1)_2px,transparent_2px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 overflow-hidden opacity-40">
          <div className="w-full h-1 bg-accent/50 absolute top-0 left-0 animate-scanline shadow-[0_0_20px_hsl(var(--accent))]" />
        </div>
      </div>

      {isModelLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/98 backdrop-blur-3xl">
          <Loader2 className="w-24 h-24 text-accent animate-spin mb-10" />
          <p className="text-accent font-code text-[14px] tracking-[1.4em] uppercase animate-pulse">Loading Detection Model</p>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {zoneVisuals.map(({ zone, shape, labelX, labelY, labelWidth }) => (
            <g key={zone.id}>
              {shape ? (
                <polygon
                  points={shape.points}
                  fill={zone.color}
                  fillOpacity={shape.fillOpacity ?? 0.08}
                  stroke={zone.color}
                  strokeWidth="0.8"
                />
              ) : (
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  fill={zone.color}
                  fillOpacity="0.08"
                  stroke={zone.color}
                  strokeWidth="0.8"
                />
              )}
              <rect
                x={Math.max(0, labelX - 0.5)}
                y={Math.max(0, labelY - 2.1)}
                width={labelWidth}
                height={2.6}
                rx={0.5}
                fill="rgba(0, 0, 0, 0.55)"
                stroke={zone.color}
                strokeOpacity="0.3"
                strokeWidth="0.25"
              />
              <text
                x={labelX}
                y={labelY}
                fill={zone.color}
                style={{ fontSize: "1.7px", fontWeight: "bold" }}
                className="uppercase tracking-[0.2em] font-headline"
              >
                {zone.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="absolute inset-0 pointer-events-none z-20">
        {rawDetections.map((detection) => {
          const matchedTrack = findClosestTrack(detection, customers);
          const stable = matchedTrack ? isStableTrack(matchedTrack) : false;
          const label = matchedTrack
            ? stable
              ? `${matchedTrack.id}`
              : `new track ${matchedTrack.id}`
            : "detecting...";

          return (
            <div
              key={detection.id}
              className={cn(
                "absolute border-2 border-cyan-300/90 border-dashed transition-all duration-100",
                stable ? "opacity-30" : "opacity-80",
              )}
              style={{ left: `${detection.bbox.x}%`, top: `${detection.bbox.y}%`, width: `${detection.bbox.width}%`, height: `${detection.bbox.height}%` }}
            >
              <div className={cn(getTopLabelClass(detection.bbox), "border-cyan-200/60 bg-black/65 text-cyan-100")}>
                {label} {Math.round(detection.confidence * 100)}%
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 pointer-events-none z-[25]">
        {detectedProducts.filter((product) => product.confidence >= 0.45).map((product) => (
          <div
            key={product.id}
            className="absolute rounded-md border-2 border-amber-300/90 bg-amber-300/5 shadow-[0_0_18px_rgba(251,191,36,0.35)] transition-all duration-150"
            style={{ left: `${product.bbox.x}%`, top: `${product.bbox.y}%`, width: `${product.bbox.width}%`, height: `${product.bbox.height}%` }}
          >
            <div className={cn(getTopLabelClass(product.bbox), "border-amber-200/70 bg-black/75 text-amber-100")}>
              {product.id} · {product.name} · {Math.round(product.confidence * 100)}%
            </div>
            <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-amber-100">
              {product.state.replaceAll("_", " ")} · {product.currentZone}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none z-30">
        {customers.map((customer) => {
          const stable = isStableTrack(customer);
          if (!stable) {
            return (
              <div
                key={customer.id}
                className="absolute border-2 border-blue-300/80 shadow-[0_0_18px_rgba(125,211,252,0.35)]"
                style={{ left: `${customer.bbox.x}%`, top: `${customer.bbox.y}%`, width: `${customer.bbox.width}%`, height: `${customer.bbox.height}%` }}
              >
                <div className={cn(getTopLabelClass(customer.bbox), "border-blue-200/70 text-blue-100")}>
                  new track {customer.id}
                </div>
              </div>
            );
          }

          return (
            <div
              key={customer.id}
              className={cn(
                "absolute border-2 transition-all duration-150 ease-linear",
                getRiskColorClass(customer),
              )}
              style={{ left: `${customer.bbox.x}%`, top: `${customer.bbox.y}%`, width: `${customer.bbox.width}%`, height: `${customer.bbox.height}%` }}
            >
              <div className="absolute inset-0 rounded-[inherit] bg-black/10 backdrop-blur-[10px]" aria-hidden="true" />
              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
                ID only · face masked
              </div>
              <div className={cn(getStatusCardClass(customer.bbox), getHeaderBgClass(customer))}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      {customer.id}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/10 pt-1">
                    <span className="text-[8px] font-bold uppercase opacity-90 text-white/90">{customer.riskState.replaceAll("_", " ")}</span>
                    <span className="text-[8px] font-code text-white/90">{Math.round(customer.riskScore * 100)}%</span>
                    <span className="text-[8px] uppercase text-white/80">{customer.state.replaceAll("_", " ")}</span>
                    <span className="text-[8px] uppercase text-white/80">{customer.trackingConfidence} track</span>
                  </div>
                  <p className="mt-1 border-t border-white/10 pt-1 text-[7px] leading-3 text-white/75">
                    Why: {customer.riskReasons[0] ?? "No elevated risk signal detected"} · AI signal, not proof
                  </p>
                </div>
              </div>

              <div className={getBottomBadgeClass(customer.bbox)}>
                {customer.zone} / {customer.associatedItemIds.length} item
              </div>

              <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-white/60" />
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-white/60" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
