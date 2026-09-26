import * as tf from "@tensorflow/tfjs";

import type { BoundingBox, CashDetectionLevel, TrackedCustomer, ZoneDefinition } from "@/lib/types";
import { clamp } from "@/tracking/tracker-utils";

export interface CashDetection {
  detected: boolean;
  confidence: number;
  bbox?: BoundingBox;
  level: "level1" | "level2";
  at: number;
  streak: number;
  reason: string;
}

interface Level1State {
  streak: number;
  lastPositiveAt?: number;
  lastEmissionAt?: number;
}

interface Level2ModelOutput {
  confidence: number;
  bbox: BoundingBox;
}

const LEVEL1_MIN_CONFIDENCE = 0.64;
const LEVEL1_CONFIRM_FRAMES = 3;
const LEVEL1_COOLDOWN_MS = 1600;
const LEVEL1_CANVAS_WIDTH = 320;
const LEVEL1_CANVAS_HEIGHT = 240;

const LEVEL2_MIN_CONFIDENCE = 0.58;
const LEVEL2_CONFIRM_FRAMES = 2;
const LEVEL2_COOLDOWN_MS = 1200;

function getCheckoutZone(zones: ZoneDefinition[]) {
  return zones.find((zone) => zone.type === "checkout");
}

function normalizedBox(box: BoundingBox, videoWidth: number, videoHeight: number): BoundingBox {
  return {
    x: clamp(box.x / videoWidth) * 100,
    y: clamp(box.y / videoHeight) * 100,
    width: clamp(box.width / videoWidth) * 100,
    height: clamp(box.height / videoHeight) * 100,
  };
}

function zoneToPixels(zone: ZoneDefinition, width: number, height: number) {
  return {
    x: Math.max(0, Math.floor((zone.x / 100) * width)),
    y: Math.max(0, Math.floor((zone.y / 100) * height)),
    width: Math.max(1, Math.floor((zone.width / 100) * width)),
    height: Math.max(1, Math.floor((zone.height / 100) * height)),
  };
}

function patchStats(
  data: Uint8ClampedArray,
  width: number,
  x0: number,
  y0: number,
  patchWidth: number,
  patchHeight: number,
) {
  let luminanceSum = 0;
  let luminanceSq = 0;
  let saturationSum = 0;
  let edges = 0;
  let samples = 0;

  const step = Math.max(2, Math.floor(Math.min(patchWidth, patchHeight) / 28));

  const luminanceAt = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    return 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2];
  };

  for (let y = y0; y < y0 + patchHeight; y += step) {
    for (let x = x0; x < x0 + patchWidth; x += step) {
      const index = (y * width + x) * 4;
      const r = data[index] / 255;
      const g = data[index + 1] / 255;
      const b = data[index + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const luminance = luminanceAt(x, y);

      luminanceSum += luminance;
      luminanceSq += luminance * luminance;
      saturationSum += saturation;
      samples += 1;

      if (x + step < x0 + patchWidth && y + step < y0 + patchHeight) {
        const gx = Math.abs(luminance - luminanceAt(x + step, y));
        const gy = Math.abs(luminance - luminanceAt(x, y + step));
        if (gx + gy > 42) edges += 1;
      }
    }
  }

  if (!samples) return null;

  const mean = luminanceSum / samples;
  const variance = Math.max(0, luminanceSq / samples - mean * mean);
  const edgeDensity = edges / samples;
  const meanSaturation = saturationSum / samples;

  return {
    brightness: mean / 255,
    brightnessVariance: Math.sqrt(variance) / 255,
    edgeDensity,
    saturation: meanSaturation,
  };
}

function level1FrameDetector(video: HTMLVideoElement, checkoutZone: ZoneDefinition): CashDetection | null {
  if (!video.videoWidth || !video.videoHeight) return null;

  const canvas = document.createElement("canvas");
  canvas.width = LEVEL1_CANVAS_WIDTH;
  canvas.height = LEVEL1_CANVAS_HEIGHT;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);

  const roi = zoneToPixels(checkoutZone, canvas.width, canvas.height);
  const candidates = [
    [0.28, 0.16], [0.38, 0.2], [0.48, 0.24], [0.58, 0.28],
    [0.34, 0.32], [0.46, 0.36], [0.56, 0.42],
  ];

  let best:
    | { score: number; x: number; y: number; width: number; height: number }
    | undefined;

  for (const [widthRatio, heightRatio] of candidates) {
    const patchWidth = Math.floor(roi.width * widthRatio);
    const patchHeight = Math.floor(patchWidth / 1.72);
    const finalHeight = Math.min(Math.max(patchHeight, Math.floor(roi.height * heightRatio * 0.45)), Math.floor(roi.height * 0.65));

    if (patchWidth < 18 || finalHeight < 12 || patchWidth > roi.width || finalHeight > roi.height) continue;

    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const x = roi.x + Math.floor(((roi.width - patchWidth) * col) / 3);
        const y = roi.y + Math.floor(((roi.height - finalHeight) * row) / 3);
        const stats = patchStats(image.data, canvas.width, x, y, patchWidth, finalHeight);
        if (!stats) continue;

        const aspect = patchWidth / Math.max(1, finalHeight);
        const aspectScore = Math.exp(-Math.abs(Math.log(Math.max(0.35, aspect) / 1.72)) * 1.9);
        const textureScore = clamp((stats.edgeDensity - 0.055) / 0.22);
        const varianceScore = clamp((stats.brightnessVariance - 0.045) / 0.18);
        const paperBrightness = 1 - clamp(Math.abs(stats.brightness - 0.56) / 0.52);
        const colorScore = 1 - clamp(Math.abs(stats.saturation - 0.38) / 0.55);

        const score =
          aspectScore * 0.28 +
          textureScore * 0.24 +
          varianceScore * 0.18 +
          paperBrightness * 0.16 +
          colorScore * 0.14;

        if (!best || score > best.score) {
          best = { score, x, y, width: patchWidth, height: finalHeight };
        }
      }
    }
  }

  if (!best || best.score < LEVEL1_MIN_CONFIDENCE) return null;

  return {
    detected: true,
    confidence: clamp(best.score),
    bbox: normalizedBox(best, canvas.width, canvas.height),
    level: "level1",
    at: Date.now(),
    streak: 1,
    reason: "A cash-like rectangular, textured object was detected inside the checkout zone.",
  };
}

function parseLevel2Output(output: tf.Tensor | tf.Tensor[]): Level2ModelOutput | null {
  const tensor = Array.isArray(output) ? output[0] : output;
  const values = Array.from(tensor.dataSync());

  // Contract for the project model:
  // [presenceConfidence, centerX, centerY, width, height]
  // Coordinates are normalized to 0..1.
  if (values.length < 5) return null;

  const confidence = values[0];
  if (!Number.isFinite(confidence) || confidence < LEVEL2_MIN_CONFIDENCE) return null;

  return {
    confidence: clamp(confidence),
    bbox: {
      x: clamp(values[1] - values[3] / 2) * 100,
      y: clamp(values[2] - values[4] / 2) * 100,
      width: clamp(values[3]) * 100,
      height: clamp(values[4]) * 100,
    },
  };
}

export class CashDetectionEngine {
  private level1State: Level1State = { streak: 0 };
  private level2Model: tf.LayersModel | null = null;
  private level2LoadPromise: Promise<tf.LayersModel | null> | null = null;
  private level2LoadAttempted = false;
  private level2Streak = 0;
  private lastLevel2EmissionAt = 0;

  reset() {
    this.level1State = { streak: 0 };
    this.level2Streak = 0;
    this.lastLevel2EmissionAt = 0;
  }

  async loadLevel2Model(modelUrl = "/models/cash/model.json") {
    if (this.level2Model) return this.level2Model;
    if (this.level2LoadPromise) return this.level2LoadPromise;
    if (this.level2LoadAttempted) return null;

    this.level2LoadAttempted = true;
    this.level2LoadPromise = tf
      .loadLayersModel(modelUrl)
      .then((model) => {
        this.level2Model = model;
        return model;
      })
      .catch(() => null);

    const model = await this.level2LoadPromise;
    this.level2LoadPromise = null;
    return model;
  }

  private async detectLevel2(video: HTMLVideoElement, checkoutZone: ZoneDefinition): Promise<CashDetection | null> {
    const model = this.level2Model ?? (await this.loadLevel2Model());
    if (!model || !video.videoWidth || !video.videoHeight) return null;

    const roi = zoneToPixels(checkoutZone, video.videoWidth, video.videoHeight);
    const input = tf.tidy(() => {
      const pixels = tf.browser.fromPixels(video);
      const crop = pixels.slice([roi.y, roi.x, 0], [roi.height, roi.width, 3]);
      return tf.image
        .resizeBilinear(crop, [224, 224])
        .toFloat()
        .div(255)
        .expandDims(0);
    });

    try {
      const output = model.predict(input) as tf.Tensor | tf.Tensor[];
      const parsed = parseLevel2Output(output);
      tf.dispose(output);
      if (!parsed) {
        this.level2Streak = 0;
        return null;
      }

      this.level2Streak += 1;
      if (this.level2Streak < LEVEL2_CONFIRM_FRAMES) return null;

      const now = Date.now();
      if (now - this.lastLevel2EmissionAt < LEVEL2_COOLDOWN_MS) return null;

      this.lastLevel2EmissionAt = now;
      this.level2Streak = 0;

      return {
        detected: true,
        confidence: parsed.confidence,
        bbox: {
          x: checkoutZone.x + (parsed.bbox.x * checkoutZone.width) / 100,
          y: checkoutZone.y + (parsed.bbox.y * checkoutZone.height) / 100,
          width: (parsed.bbox.width * checkoutZone.width) / 100,
          height: (parsed.bbox.height * checkoutZone.height) / 100,
        },
        level: "level2",
        at: now,
        streak: LEVEL2_CONFIRM_FRAMES,
        reason: "The trained checkout cash detector confirmed a cash-note object across consecutive frames.",
      };
    } finally {
      input.dispose();
    }
  }

  async detect(
    video: HTMLVideoElement,
    zones: ZoneDefinition[],
    mode: CashDetectionLevel = "hybrid",
  ): Promise<CashDetection | null> {
    const checkoutZone = getCheckoutZone(zones);
    if (!checkoutZone) return null;

    if (mode === "level2" || mode === "hybrid") {
      const level2 = await this.detectLevel2(video, checkoutZone);
      if (level2) return level2;
      if (mode === "level2") return null;
    }

    const level1 = level1FrameDetector(video, checkoutZone);
    const now = Date.now();

    if (!level1) {
      this.level1State.streak = Math.max(0, this.level1State.streak - 1);
      return null;
    }

    this.level1State.streak += 1;
    this.level1State.lastPositiveAt = now;

    if (this.level1State.streak < LEVEL1_CONFIRM_FRAMES) return null;
    if (this.level1State.lastEmissionAt && now - this.level1State.lastEmissionAt < LEVEL1_COOLDOWN_MS) return null;

    this.level1State.lastEmissionAt = now;
    this.level1State.streak = 0;

    return { ...level1, streak: LEVEL1_CONFIRM_FRAMES };
  }

  static associateWithCustomer(
    detection: CashDetection,
    customers: TrackedCustomer[],
    zones: ZoneDefinition[],
  ): TrackedCustomer | undefined {
    if (!detection.detected || !detection.bbox) return undefined;

    const checkout = getCheckoutZone(zones);
    if (!checkout) return undefined;

    const center = {
      x: detection.bbox.x + detection.bbox.width / 2,
      y: detection.bbox.y + detection.bbox.height / 2,
    };

    return customers
      .filter((customer) => customer.zone === "checkout" && !customer.paid)
      .map((customer) => ({
        customer,
        distance: Math.hypot(customer.centroid.x - center.x, customer.centroid.y - center.y),
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.customer;
  }
}
