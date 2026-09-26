"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DetectedObject } from "@tensorflow-models/coco-ssd";
import type { ProductDetectionInput } from "@/lib/types";
import { getCocoSsdModel } from "./coco-ssd-runtime";

interface UseProductDetectionOptions {
  minIntervalMs?: number;
  minConfidence?: number;
}

const SUPPORTED_OBJECTS = new Set([
  "bottle",
  "cup",
  "bowl",
  "banana",
  "apple",
  "orange",
  "sandwich",
  "cake",
  "book",
]);

function toProductDetections(
  predictions: DetectedObject[],
  video: HTMLVideoElement,
  minConfidence: number,
): ProductDetectionInput[] {
  const width = video.videoWidth || 1;
  const height = video.videoHeight || 1;

  return predictions
    .filter(
      (prediction) =>
        SUPPORTED_OBJECTS.has(prediction.class) &&
        (prediction.score ?? 0) >= minConfidence,
    )
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

export function useProductDetection(options: UseProductDetectionOptions = {}) {
  const { minIntervalMs = 180, minConfidence = 0.45 } = options;
  const modelRef = useRef<Awaited<ReturnType<typeof getCocoSsdModel>>>(null);
  const lastStartedAtRef = useRef(0);
  const isDetectingRef = useRef(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getCocoSsdModel().then((loadedModel) => {
      if (cancelled) return;
      modelRef.current = loadedModel;
      setError(loadedModel ? null : "Product detector failed to load.");
      setIsModelLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const processFrame = useCallback(
    async (video: HTMLVideoElement) => {
      if (!modelRef.current || isModelLoading || isDetectingRef.current) return null;
      if (
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !video.videoWidth ||
        !video.videoHeight
      ) {
        return null;
      }

      const now = performance.now();
      if (now - lastStartedAtRef.current < minIntervalMs) return null;

      lastStartedAtRef.current = now;
      isDetectingRef.current = true;

      try {
        const predictions = await modelRef.current.detect(video);
        return toProductDetections(predictions, video, minConfidence);
      } finally {
        isDetectingRef.current = false;
      }
    },
    [isModelLoading, minConfidence, minIntervalMs],
  );

  return { error, isModelLoading, processFrame };
}
