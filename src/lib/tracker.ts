
import {
  BoundingBox,
  DetectionInput,
  Direction,
  TrackedCustomer,
  ZoneDefinition,
  ZoneType,
  OwnershipState,
  ExitState,
} from "./types";

function centroid(box: BoundingBox) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function area(box: BoundingBox) {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

function iou(a: BoundingBox, b: BoundingBox) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  const interArea = w * h;
  const union = area(a) + area(b) - interArea;
  return union <= 0 ? 0 : interArea / union;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function identifyZone(point: { x: number; y: number }, zones: ZoneDefinition[]): ZoneType {
  const zone = zones.find(z => 
    point.x >= z.x && point.x <= z.x + z.width && 
    point.y >= z.y && point.y <= z.y + z.height
  );
  return zone?.type || "floor";
}

export class ObjectTracker {
  private tracks = new Map<string, TrackedCustomer & { missedFrames: number }>();
  private nextId = 1;
  private readonly maxMissedFrames = 45; 
  private readonly iouThreshold = 0.2;
  private readonly associationDistance = 150;

  reset() {
    this.tracks.clear();
    this.nextId = 1;
  }

  update(detections: DetectionInput[], zones: ZoneDefinition[]): TrackedCustomer[] {
    const now = Date.now();
    
    for (const track of this.tracks.values()) {
      track.missedFrames++;
    }

    for (const det of detections) {
      const detCentroid = centroid(det.bbox);
      let bestId: string | null = null;
      let bestScore = 0;

      for (const [id, track] of this.tracks.entries()) {
        const overlap = iou(track.bbox, det.bbox);
        const dist = distance(track.centroid, detCentroid);
        const score = overlap * 2.5 + Math.max(0, 1 - dist / 200);

        if ((overlap > this.iouThreshold || dist < this.associationDistance) && score > bestScore) {
          bestScore = score;
          bestId = id;
        }
      }

      if (bestId) {
        const track = this.tracks.get(bestId)!;
        const prevC = track.centroid;
        track.velocity = { x: detCentroid.x - prevC.x, y: detCentroid.y - prevC.y };
        track.bbox = det.bbox;
        track.centroid = detCentroid;
        track.confidence = det.confidence;
        track.zone = identifyZone(detCentroid, zones);
        track.direction = track.velocity.x > 1.2 ? "out" : (track.velocity.x < -1.2 ? "in" : track.direction);
        track.lastSeen = now;
        track.missedFrames = 0;
        
        // Semantic location flags
        if (track.zone === "entry") track.enteredStore = true;
        if (track.zone === "floor" || track.zone === "billing") track.insideStore = true;

        track.history.push({ ...detCentroid, zone: track.zone, at: now });
        if (track.history.length > 60) track.history.shift();

        this.processIntelligentOwnership(track, now);
      } else {
        const id = `T${this.nextId++}`;
        const zone = identifyZone(detCentroid, zones);
        this.tracks.set(id, {
          id,
          label: det.label,
          confidence: det.confidence,
          bbox: det.bbox,
          centroid: detCentroid,
          zone,
          direction: "unknown",
          ownershipState: "NO_ITEM",
          ownershipConfidence: 0,
          exitState: "WATCHING",
          exitConfidence: 0,
          hasItem: false,
          transferConfidence: 0,
          firstSeenAt: now,
          lastSeen: now,
          seenBilling: zone === "billing",
          paid: false,
          enteredStore: zone === "entry",
          insideStore: zone === "floor" || zone === "billing",
          alerted: false,
          history: [{ ...detCentroid, zone, at: now }],
          velocity: { x: 0, y: 0 },
          missedFrames: 0
        });
      }
    }

    this.processGroupContext(now);

    for (const [id, track] of this.tracks.entries()) {
      if (track.missedFrames > this.maxMissedFrames) {
        this.tracks.delete(id);
      }
    }

    return Array.from(this.tracks.values());
  }

  private processIntelligentOwnership(track: TrackedCustomer, now: number) {
    if (track.paid || track.ownershipState === "TRANSFERRED_ITEM") return;

    const dwellInFloor = now - track.firstSeenAt;
    
    if (track.zone === "floor" && dwellInFloor > 5000 && track.ownershipState === "NO_ITEM") {
      track.ownershipState = "POSSIBLE_ITEM";
      track.ownershipConfidence = 0.4;
    }

    if (track.ownershipState === "POSSIBLE_ITEM" && dwellInFloor > 12000) {
      track.ownershipState = "OBSERVED_ITEM";
      track.ownershipConfidence = 0.7;
      track.hasItem = true;
    }

    if (track.ownershipState === "OBSERVED_ITEM" && dwellInFloor > 20000) {
      track.ownershipState = "CONFIRMED_ITEM";
      track.ownershipConfidence = 0.95;
    }
  }

  private processGroupContext(now: number) {
    const all = Array.from(this.tracks.values());
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        const dist = distance(a.centroid, b.centroid);

        if (dist < 45) {
          if (a.hasItem && !b.hasItem && !a.transferredToId) {
            a.transferConfidence = Math.min(1, a.transferConfidence + 0.05);
            if (a.transferConfidence > 0.8) {
              this.executeTransfer(a, b, now);
            }
          } else if (b.hasItem && !a.hasItem && !b.transferredToId) {
            b.transferConfidence = Math.min(1, b.transferConfidence + 0.05);
            if (b.transferConfidence > 0.8) {
              this.executeTransfer(b, a, now);
            }
          }
        } else {
          a.transferConfidence = Math.max(0, a.transferConfidence - 0.02);
          b.transferConfidence = Math.max(0, b.transferConfidence - 0.02);
        }
      }
    }
  }

  private executeTransfer(from: TrackedCustomer, to: TrackedCustomer, now: number) {
    from.hasItem = false;
    from.ownershipState = "TRANSFERRED_ITEM";
    from.transferredToId = to.id;
    to.hasItem = true;
    to.ownershipState = "CONFIRMED_ITEM";
    to.ownershipConfidence = 0.9;
  }

  markPaid(id: string, method: any) {
    const track = this.tracks.get(id);
    if (track) {
      track.paid = true;
      track.ownershipState = "PAID_ITEM";
      track.paymentMethod = method;
      track.paymentAt = Date.now();
      track.alerted = false;
    }
  }

  markAlerted(id: string) {
    const track = this.tracks.get(id);
    if (track) track.alerted = true;
  }

  getSnapshot() {
    return Array.from(this.tracks.values());
  }
}
