import type { BoundingBox, ConfidenceBand, ZoneDefinition, ZoneType } from "@/lib/types";

export function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function centroid(box: BoundingBox) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

export function area(box: BoundingBox) {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

export function iou(a: BoundingBox, b: BoundingBox) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  const overlap = w * h;
  const union = area(a) + area(b) - overlap;

  return union <= 0 ? 0 : overlap / union;
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function smoothBox(previous: BoundingBox, next: BoundingBox, alpha: number) {
  return {
    x: previous.x * (1 - alpha) + next.x * alpha,
    y: previous.y * (1 - alpha) + next.y * alpha,
    width: previous.width * (1 - alpha) + next.width * alpha,
    height: previous.height * (1 - alpha) + next.height * alpha,
  };
}

export function identifyZone(point: { x: number; y: number }, zones: ZoneDefinition[]): ZoneType {
  const zone = zones.find(
    (candidate) =>
      point.x >= candidate.x &&
      point.x <= candidate.x + candidate.width &&
      point.y >= candidate.y &&
      point.y <= candidate.y + candidate.height,
  );

  return zone?.type ?? "aisle";
}

export function inferDirection(previous: { x: number; y: number }, next: { x: number; y: number }) {
  const deltaX = next.x - previous.x;
  if (Math.abs(deltaX) < 0.25) {
    return "unknown" as const;
  }

  return deltaX > 0 ? ("out" as const) : ("in" as const);
}

export function toConfidenceBand(value: number): ConfidenceBand {
  if (value >= 0.78) {
    return "high";
  }

  if (value >= 0.52) {
    return "medium";
  }

  return "low";
}
