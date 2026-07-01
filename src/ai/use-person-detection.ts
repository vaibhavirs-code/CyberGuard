"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ObjectDetection, DetectedObject } from "@tensorflow-models/coco-ssd";
import type { DetectionInput } from "@/lib/types";
import { logger } from "@/lib/logger";

interface UsePersonDetectionOptions {
  minIntervalMs?: number;
}

const MODEL_LOAD_ATTEMPTS = 3;
const MODEL_LOAD_RETRY_DELAY_MS = 1200;

function toDetections(predictions: DetectedObject[], video: HTMLVideoElement): DetectionInput[] {
  const width = video.videoWidth || 1;
  const height = video.videoHeight || 1;

  return predictions
    .filter((prediction) => prediction.class === "person")
    .map((prediction) => ({
      label: prediction.class,
      confidence: prediction.score ?? 0,
      bbox: {
        x: (prediction.bbox[0] / width) * 100,
        y: (prediction.bbox[1] / height) * 100,
        width: (prediction.bbox[2] / width) * 100,
        height: (prediction.bbox[3] / height) * 100,
      },
    }));
}

export function usePersonDetection(options: UsePersonDetectionOptions = {}) {
  const { minIntervalMs = 120 } = options;
  const modelRef = useRef<ObjectDetection | null>(null);
  const lastStartedAtRef = useRef(0);
  const isDetectingRef = useRef(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function delay(ms: number) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });
    }

    async function loadModel() {
      setIsModelLoading(true);
      setError(null);

      for (let attempt = 1; attempt <= MODEL_LOAD_ATTEMPTS; attempt += 1) {
        try {
          await import("@tensorflow/tfjs");
          const cocoSsd = await import("@tensorflow-models/coco-ssd");
          const model = await cocoSsd.load();

          if (!cancelled) {
            modelRef.current = model;
            setIsModelLoading(false);
          }

          return;
        } catch (loadError) {
          logger.error("Object detection model failed to load", {
            attempt,
            error: loadError instanceof Error ? loadError.message : "unknown error",
          });

          if (attempt < MODEL_LOAD_ATTEMPTS) {
            await delay(MODEL_LOAD_RETRY_DELAY_MS * attempt);
            continue;
          }

          if (!cancelled) {
            setError("Object detection model failed to load after multiple attempts.");
            setIsModelLoading(false);
          }
        }
      }
    }

    void loadModel();

    return () => {
      cancelled = true;
    };
  }, []);

  const processFrame = useCallback(async (video: HTMLVideoElement) => {
    if (!modelRef.current || isModelLoading || isDetectingRef.current) {
      return null;
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    const now = performance.now();
    if (now - lastStartedAtRef.current < minIntervalMs) {
      return null;
    }

    lastStartedAtRef.current = now;
    isDetectingRef.current = true;

    try {
      const startedAt = performance.now();
      const predictions = await modelRef.current.detect(video);
      const durationMs = performance.now() - startedAt;
      setFps(Math.round(1000 / Math.max(durationMs, 1)));
      return toDetections(predictions, video);
    } finally {
      isDetectingRef.current = false;
    }
  }, [isModelLoading, minIntervalMs]);

  return {
    error,
    fps,
    isModelLoading,
    processFrame,
  };
}
