import {
  BoundingBox,
  DetectionInput,
  Direction,
  TrackedCustomer,
  ZoneDefinition,
  ZoneType,
} from "./types";

type InternalTrack = TrackedCustomer & {
  missedFrames: number;
  lastBox: BoundingBox;
};

function centroid(box: BoundingBox) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

function area(box: BoundingBox) {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

function intersection(a: BoundingBox, b: BoundingBox) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  return { width: w, height: h };
}

function iou(a: BoundingBox, b: BoundingBox) {
  const inter = intersection(a, b);
  const interArea = inter.width * inter.height;
  const union = area(a) + area(b) - interArea;
  if (union <= 0) return 0;
  return interArea / union;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointInZone(point: { x: number; y: number }, zone: ZoneDefinition) {
  return (
    point.x >= zone.x &&
    point.x <= zone.x + zone.width &&
    point.y >= zone.y &&
    point.y <= zone.y + zone.height
  );
}

function identifyZone(
  box: BoundingBox,
  zones: ZoneDefinition[]
): ZoneType {
  const c = centroid(box);

  const billing = zones.find((z) => z.type === "billing" && pointInZone(c, z));
  if (billing) return "billing";

  const entry = zones.find((z) => z.type === "entry" && pointInZone(c, z));
  if (entry) return "entry";

  const exit = zones.find((z) => z.type === "exit" && pointInZone(c, z));
  if (exit) return "exit";

  return "floor";
}

function deriveDirection(prevX: number, currentX: number): Direction {
  const delta = currentX - prevX;
  if (Math.abs(delta) < 8) return "unknown";
  return delta > 0 ? "out" : "in";
}

export class ObjectTracker {
  private tracks = new Map<string, InternalTrack>();
  private nextId = 1;
  private readonly maxMissedFrames = 12;
  private readonly associationDistance = 85;
  private readonly iouThreshold = 0.12;

  reset() {
    this.tracks.clear();
    this.nextId = 1;
  }

  private generateId() {
    const id = `T${this.nextId}`;
    this.nextId += 1;
    return id;
  }

  private createTrack(detection: DetectionInput, zones: ZoneDefinition[]): InternalTrack {
    const c = centroid(detection.bbox);
    const zone = identifyZone(detection.bbox, zones);

    return {
      id: this.generateId(),
      label: detection.label,
      confidence: detection.confidence,
      bbox: detection.bbox,
      centroid: c,
      zone,
      direction: "unknown",
      enteredStore: zone === "entry",
      seenBilling: zone === "billing",
      paid: false,
      alerted: false,
      lastSeen: Date.now(),
      history: [{ x: c.x, y: c.y, zone, at: Date.now() }],
      missedFrames: 0,
      lastBox: detection.bbox,
    };
  }

  update(detections: DetectionInput[], zones: ZoneDefinition[]): TrackedCustomer[] {
    const now = Date.now();

    // Mark all existing tracks as missed initially.
    for (const track of this.tracks.values()) {
      track.missedFrames += 1;
    }

    for (const detection of detections) {
      const detCentroid = centroid(detection.bbox);

      let bestId: string | null = null;
      let bestScore = 0;

      for (const [id, track] of this.tracks.entries()) {
        const cDist = distance(track.centroid, detCentroid);
        const overlap = iou(track.bbox, detection.bbox);

        const score =
          overlap * 1.4 +
          Math.max(0, 1 - cDist / 200) * 0.8;

        if (
          overlap >= this.iouThreshold ||
          cDist <= this.associationDistance
        ) {
          if (score > bestScore) {
            bestScore = score;
            bestId = id;
          }
        }
      }

      if (!bestId) {
        const newTrack = this.createTrack(detection, zones);
        this.tracks.set(newTrack.id, newTrack);
        continue;
      }

      const track = this.tracks.get(bestId);
      if (!track) continue;

      const previousX = track.centroid.x;
      const previousZone = track.zone;

      const currentZone = identifyZone(detection.bbox, zones);
      const currentCentroid = detCentroid;
      const direction = deriveDirection(previousX, currentCentroid.x);

      track.bbox = detection.bbox;
      track.lastBox = detection.bbox;
      track.centroid = currentCentroid;
      track.confidence = detection.confidence;
      track.zone = currentZone;
      track.direction = direction;
      track.lastSeen = now;
      track.missedFrames = 0;

      if (currentZone === "entry") {
        if (direction === "in") {
          track.enteredStore = true;
        }
        if (direction === "out") {
          track.enteredStore = true;
        }
      }

      if (currentZone === "billing") {
        track.seenBilling = true;
      }

      track.history.push({
        x: currentCentroid.x,
        y: currentCentroid.y,
        zone: currentZone,
        at: now,
      });

      // keep history small
      if (track.history.length > 25) {
        track.history.splice(0, track.history.length - 25);
      }

      // if still in same previous zone, keep state
      if (previousZone === "billing" && currentZone !== "billing") {
        track.seenBilling = track.seenBilling || true;
      }
    }

    // Remove stale tracks.
    for (const [id, track] of this.tracks.entries()) {
      if (track.missedFrames > this.maxMissedFrames) {
        this.tracks.delete(id);
      }
    }

    return Array.from(this.tracks.values()).map(({ missedFrames, lastBox, ...rest }) => rest);
  }

  markPaid(trackId: string, method: "qr" | "pos" | "card" | "upi" | "cash") {
    const track = this.tracks.get(trackId);
    if (!track) return null;

    track.paid = true;
    track.paymentMethod = method;
    track.paymentAt = Date.now();
    track.alerted = false;
    return track;
  }

  markAlerted(trackId: string) {
    const track = this.tracks.get(trackId);
    if (!track) return null;

    track.alerted = true;
    track.alertAt = Date.now();
    return track;
  }

  getSnapshot() {
    return Array.from(this.tracks.values()).map(({ missedFrames, lastBox, ...rest }) => rest);
  }
}