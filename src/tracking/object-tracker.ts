import type {
  DetectionInput,
  Direction,
  PaymentMethod,
  PersonState,
  TrackedCustomer,
  TrackedItem,
  TrackerEvent,
  TrackerSnapshot,
  ZoneDefinition,
  ZoneType,
} from "@/lib/types";
import { createId } from "@/lib/id";
import { assessStoreRisk, stabilizeZone } from "./store-risk-core";
import { clamp, centroid, distance, identifyZone, inferDirection, iou, smoothBox, toConfidenceBand } from "./tracker-utils";

interface TrackRecord extends TrackedCustomer {
  missedFrames: number;
  activeItemId?: string;
  shouldTriggerBuzzer: boolean;
  shelfInteractionFrames: number;
  carryingFrames: number;
  lastInteractionWithPersonId?: string;
  personInteractionFrames: number;
  transferCandidateId?: string;
  transferCandidateFrames: number;
}

interface ItemRecord extends TrackedItem {
  missedFrames: number;
}

const MAX_MISSED_FRAMES = 18;
const MAX_ITEM_MISSED_FRAMES = 12;
const SMOOTHING_ALPHA = 0.62;
const IOU_THRESHOLD = 0.18;
const MAX_ASSOCIATION_DISTANCE = 20;
const INTERACTION_DISTANCE = 12;
const SHELF_TOUCH_FRAMES = 8;
const CARRY_FRAMES = 14;
const TRANSFER_CONFIRM_FRAMES = 6;

function nowIsoMs(at: number) {
  return at;
}

function createEvent(
  type: TrackerEvent["type"],
  confidence: number,
  message: string,
  reasoning: string,
  options: Omit<Partial<TrackerEvent>, "id" | "type" | "confidence" | "message" | "reasoning" | "severity" | "at"> & {
    at?: number;
    severity?: TrackerEvent["severity"];
  } = {},
): TrackerEvent {
  return {
    id: createId("EVT"),
    at: options.at ?? Date.now(),
    type,
    confidence: clamp(confidence),
    message,
    reasoning,
    severity: options.severity ?? (confidence >= 0.8 ? "alert" : confidence >= 0.45 ? "warning" : "info"),
    itemId: options.itemId,
    personId: options.personId,
    relatedPersonId: options.relatedPersonId,
    zone: options.zone,
  };
}

function zonePriority(zone: ZoneType) {
  switch (zone) {
    case "shelf":
      return 0.2;
    case "checkout":
      return 0.16;
    case "exit":
    case "outside":
      return 0.22;
    default:
      return 0;
  }
}

function createTrack(id: string, detection: DetectionInput, zones: ZoneDefinition[], now: number): TrackRecord {
  const center = centroid(detection.bbox);
  const zone = identifyZone(center, zones);

  return {
    id,
    label: detection.label,
    confidence: detection.confidence,
    trackingConfidence: toConfidenceBand(detection.confidence),
    bbox: detection.bbox,
    centroid: center,
    zone,
    direction: "unknown",
    state: zone === "entrance" ? "entering" : zone === "checkout" ? "near_checkout" : "browsing",
    uncertaintyScore: clamp(1 - detection.confidence),
    interactionScore: 0,
    associatedItemIds: [],
    nearbyPersonIds: [],
    firstSeenAt: now,
    lastSeen: now,
    framesSeen: 1,
    zoneEnteredAt: now,
    zoneDwellMs: 0,
    totalDwellMs: 0,
    zoneTransitions: 0,
    seenCheckout: zone === "checkout",
    checkoutVisits: zone === "checkout" ? 1 : 0,
    lastCheckoutAt: zone === "checkout" ? now : undefined,
    paid: false,
    paymentState: "unpaid",
    enteredStore: zone === "entrance",
    insideStore: zone !== "outside",
    riskState: "benign",
    riskScore: 0,
    riskReasons: [],
    alerted: false,
    history: [{ ...center, zone, at: nowIsoMs(now) }],
    velocity: { x: 0, y: 0 },
    missedFrames: 0,
    shouldTriggerBuzzer: false,
    shelfInteractionFrames: 0,
    carryingFrames: 0,
    personInteractionFrames: 0,
    transferCandidateFrames: 0,
  };
}

function createItemHypothesis(person: TrackRecord, now: number): ItemRecord {
  return {
    id: createId("ITEM"),
    source: "inferred_from_behavior",
    state: "touched",
    confidence: clamp(person.interactionScore * 0.65 + person.confidence * 0.35, 0.25, 0.85),
    uncertaintyScore: clamp(0.55 - person.interactionScore * 0.2, 0.2, 0.75),
    associatedPersonId: person.id,
    lastAssociatedPersonId: person.id,
    originZone: "shelf",
    currentZone: person.zone,
    createdAt: now,
    updatedAt: now,
    touchAt: now,
    position: { ...person.centroid },
    evidence: ["prolonged shelf-zone interaction"],
    missedFrames: 0,
  };
}

function derivePersonState(track: TrackRecord, items: ItemRecord[]): PersonState {
  if (track.missedFrames > 0) {
    return "lost_tracking";
  }

  if (track.zone === "entrance") {
    return "entering";
  }

  if (track.zone === "outside") {
    return "leaving";
  }

  if (track.zone === "exit") {
    return "near_exit";
  }

  if (track.zone === "checkout") {
    return "near_checkout";
  }

  if (track.personInteractionFrames >= 3) {
    return "interacting_with_person";
  }

  if (items.some((item) => item.state === "associated_with_person" || item.state === "moving")) {
    return "carrying_item";
  }

  if (track.shelfInteractionFrames >= SHELF_TOUCH_FRAMES) {
    return "interacting_with_item";
  }

  if (track.zone === "shelf") {
    return "near_shelf";
  }

  return "browsing";
}

export class ObjectTracker {
  private tracks = new Map<string, TrackRecord>();
  private items = new Map<string, ItemRecord>();
  private nextTrackId = 1;

  reset() {
    this.tracks.clear();
    this.items.clear();
    this.nextTrackId = 1;
  }

  update(detections: DetectionInput[], zones: ZoneDefinition[]): TrackerSnapshot {
    const now = Date.now();
    const events: TrackerEvent[] = [];

    for (const track of this.tracks.values()) {
      track.missedFrames += 1;
      track.totalDwellMs = now - track.firstSeenAt;
      track.zoneDwellMs = now - track.zoneEnteredAt;
      track.interactionScore = Math.max(0, track.interactionScore - 0.02);
      track.personInteractionFrames = Math.max(0, track.personInteractionFrames - 1);
      track.transferCandidateFrames = Math.max(0, track.transferCandidateFrames - 1);
      track.nearbyPersonIds = [];
    }

    for (const item of this.items.values()) {
      item.missedFrames += 1;
      item.updatedAt = now;
      item.uncertaintyScore = clamp(item.uncertaintyScore + 0.03);
      item.confidence = clamp(item.confidence - 0.015);
    }

    const availableTrackIds = new Set(this.tracks.keys());
    const rankedDetections = [...detections].sort((a, b) => b.confidence - a.confidence);

    for (const detection of rankedDetections) {
      const detectionCentroid = centroid(detection.bbox);
      const detectionZone = identifyZone(detectionCentroid, zones);
      let bestTrackId: string | null = null;
      let bestScore = -1;

      for (const trackId of availableTrackIds) {
        const track = this.tracks.get(trackId);
        if (!track) {
          continue;
        }

        const overlap = iou(track.bbox, detection.bbox);
        const centroidDistance = distance(track.centroid, detectionCentroid);
        if (overlap < IOU_THRESHOLD && centroidDistance > MAX_ASSOCIATION_DISTANCE) {
          continue;
        }

        const associationScore =
          overlap * 0.55 +
          clamp(1 - centroidDistance / MAX_ASSOCIATION_DISTANCE) * 0.25 +
          (track.zone === detectionZone ? 0.12 : 0) +
          zonePriority(detectionZone) * 0.08;

        if (associationScore > bestScore) {
          bestScore = associationScore;
          bestTrackId = trackId;
        }
      }

      if (!bestTrackId) {
        const newTrack = createTrack(`P${this.nextTrackId++}`, detection, zones, now);
        const risk = assessStoreRisk(newTrack, [], now);
        newTrack.riskScore = risk.score;
        newTrack.riskState = risk.state;
        newTrack.riskReasons = risk.reasons;
        newTrack.shouldTriggerBuzzer = risk.shouldTriggerBuzzer;
        this.tracks.set(newTrack.id, newTrack);
        events.push(
          createEvent(
            "person_entered",
            detection.confidence,
            `${newTrack.id} entered monitored space`,
            "A new tracked person was initialized from a stable detection.",
            { personId: newTrack.id, zone: newTrack.zone },
          ),
        );
        continue;
      }

      availableTrackIds.delete(bestTrackId);
      const track = this.tracks.get(bestTrackId);
      if (!track) {
        continue;
      }

      const previousZone = track.zone;
      const previousCentroid = track.centroid;
      const smoothedBox = smoothBox(track.bbox, detection.bbox, SMOOTHING_ALPHA);
      const nextCentroid = centroid(smoothedBox);
      const candidateZone = identifyZone(nextCentroid, zones);
      const nextZone = stabilizeZone(track.zone, candidateZone, track.lastTransitionAt ?? track.firstSeenAt, now);
      const zoneChanged = previousZone !== nextZone;

      track.velocity = {
        x: nextCentroid.x - track.centroid.x,
        y: nextCentroid.y - track.centroid.y,
      };
      track.direction = inferDirection(track.centroid, nextCentroid) as Direction;
      track.bbox = smoothedBox;
      track.centroid = nextCentroid;
      track.confidence = detection.confidence;
      track.trackingConfidence = toConfidenceBand(clamp(detection.confidence * 0.65 + (1 - track.missedFrames / MAX_MISSED_FRAMES) * 0.35));
      track.uncertaintyScore = clamp((1 - detection.confidence) * 0.55 + track.missedFrames * 0.04);
      track.lastSeen = now;
      track.framesSeen += 1;
      track.missedFrames = 0;
      track.totalDwellMs = now - track.firstSeenAt;
      track.zone = nextZone;

      if (zoneChanged) {
        track.zoneTransitions += 1;
        track.lastTransitionAt = now;
        track.zoneEnteredAt = now;
        track.zoneDwellMs = 0;
        events.push(
          createEvent(
            "zone_transition",
            clamp(detection.confidence * 0.85),
            `${track.id} moved from ${previousZone} to ${nextZone}`,
            "Zone transitions are used to stabilize interpretation and reduce single-frame alerts.",
            { personId: track.id, zone: nextZone },
          ),
        );
      } else {
        track.zoneDwellMs = now - track.zoneEnteredAt;
      }

      if (nextZone === "entrance") {
        track.enteredStore = true;
      }

      track.insideStore = nextZone !== "outside";

      if (nextZone === "checkout") {
        track.seenCheckout = true;
        track.lastCheckoutAt = now;
        if (zoneChanged || track.checkoutVisits === 0) {
          track.checkoutVisits += 1;
        }
      }

      if (nextZone === "shelf") {
        track.shelfInteractionFrames += 1;
        track.interactionScore = clamp(track.interactionScore + 0.06);
      } else {
        track.shelfInteractionFrames = Math.max(0, track.shelfInteractionFrames - 1);
      }

      if (track.activeItemId && nextZone !== "shelf") {
        track.carryingFrames += 1;
      } else {
        track.carryingFrames = Math.max(0, track.carryingFrames - 1);
      }

      track.history.push({ ...nextCentroid, zone: nextZone, at: nowIsoMs(now) });
      if (track.history.length > 100) {
        track.history.shift();
      }

      if (track.shelfInteractionFrames === SHELF_TOUCH_FRAMES) {
        events.push(
          createEvent(
            "item_touch",
            clamp(track.interactionScore * 0.8 + detection.confidence * 0.2),
            `${track.id} started a shelf interaction`,
            "Sustained shelf-zone dwell suggests possible item contact, not confirmed removal.",
            { personId: track.id, zone: nextZone },
          ),
        );
      }

      if (!track.activeItemId && track.shelfInteractionFrames >= SHELF_TOUCH_FRAMES) {
        const newItem = createItemHypothesis(track, now);
        this.items.set(newItem.id, newItem);
        track.activeItemId = newItem.id;
        track.associatedItemIds = [newItem.id];
        events.push(
          createEvent(
            "item_touch",
            newItem.confidence,
            `${newItem.id} opened as an inferred item hypothesis`,
            "The system only has person detections, so this item record is behavior-inferred rather than directly detected.",
            { personId: track.id, itemId: newItem.id, zone: nextZone },
          ),
        );
      }

      if (track.activeItemId) {
        const item = this.items.get(track.activeItemId);
        if (item) {
          item.missedFrames = 0;
          item.updatedAt = now;
          item.position = { ...track.centroid };
          item.currentZone = track.zone;
          item.associatedPersonId = track.id;
          item.confidence = clamp(item.confidence * 0.6 + track.confidence * 0.4);
          item.uncertaintyScore = clamp(track.uncertaintyScore * 0.75 + item.uncertaintyScore * 0.25);

          if (!item.touchAt) {
            item.touchAt = now;
          }

          if (
            (track.carryingFrames >= CARRY_FRAMES || (track.zone !== "shelf" && track.shelfInteractionFrames >= 4)) &&
            item.state !== "picked_up" &&
            item.state !== "associated_with_person" &&
            item.state !== "moving"
          ) {
            item.state = "picked_up";
            item.pickedUpAt = now;
            item.evidence = ["left shelf zone after sustained interaction"];
            events.push(
              createEvent(
                "item_pickup",
                clamp(item.confidence * 0.85),
                `${track.id} likely picked up ${item.id}`,
                "The item hypothesis moved away from the shelf with the same track over a sustained time window.",
                { personId: track.id, itemId: item.id, zone: track.zone },
              ),
            );
          } else if (item.state === "picked_up" || item.state === "moving") {
            item.state = "associated_with_person";
          }

          if (item.state === "associated_with_person" || item.state === "picked_up") {
            item.state = "moving";
          }

          if (track.zone === "checkout") {
            item.state = "near_checkout";
            item.checkoutAt = now;
            events.push(
              createEvent(
                "possible_checkout_interaction",
                clamp(item.confidence * 0.7),
                `${item.id} moved into checkout context`,
                "Checkout proximity lowers removal confidence and increases payment plausibility.",
                { personId: track.id, itemId: item.id, zone: track.zone },
              ),
            );
          }

          if (track.zone === "exit") {
            item.state = "near_exit";
            item.nearExitAt = item.nearExitAt ?? now;
            events.push(
              createEvent(
                "item_near_exit",
                clamp(item.confidence * 0.8),
                `${item.id} approached the exit`,
                "An item near the exit is a stronger signal, but still not a confirmed removal event on its own.",
                { personId: track.id, itemId: item.id, zone: track.zone },
              ),
            );
          }

          if (track.zone === "outside") {
            item.state = "exited_boundary";
            item.exitedAt = now;
            events.push(
              createEvent(
                "exit_crossing",
                clamp(item.confidence * 0.9),
                `${item.id} crossed the store boundary with ${track.id}`,
                "Boundary exit increases risk only when a persistent, unpaid item hypothesis remains attached to the same person.",
                { personId: track.id, itemId: item.id, zone: track.zone, severity: "alert" },
              ),
            );
          }

          if (track.zone === "shelf" && track.carryingFrames <= 2 && item.state !== "touched") {
            item.state = "returned_to_shelf";
            item.returnedAt = now;
            item.associatedPersonId = undefined;
            track.activeItemId = undefined;
            track.associatedItemIds = [];
            events.push(
              createEvent(
                "item_return",
                clamp(item.confidence * 0.78),
                `${item.id} was likely returned to shelf context`,
                "The inferred item returned to the shelf zone instead of progressing toward exit or checkout.",
                { personId: track.id, itemId: item.id, zone: track.zone },
              ),
            );
          }
        }
      }

      if (distance(previousCentroid, track.centroid) >= 5 && track.activeItemId) {
        const movedItem = this.items.get(track.activeItemId);
        if (movedItem && movedItem.state !== "near_checkout" && movedItem.state !== "near_exit" && movedItem.state !== "exited_boundary") {
          movedItem.state = "moving";
          events.push(
            createEvent(
              "item_movement",
              clamp(movedItem.confidence * 0.75),
              `${movedItem.id} moved with ${track.id}`,
              "Movement after a possible pickup is tracked over time and does not immediately imply suspicious behavior.",
              { personId: track.id, itemId: movedItem.id, zone: track.zone },
            ),
          );
        }
      }
    }

    const trackList = Array.from(this.tracks.values());

    for (let index = 0; index < trackList.length; index += 1) {
      const left = trackList[index];
      left.nearbyPersonIds = [];

      for (let innerIndex = index + 1; innerIndex < trackList.length; innerIndex += 1) {
        const right = trackList[innerIndex];
        const proximity = distance(left.centroid, right.centroid);
        if (proximity > INTERACTION_DISTANCE) {
          continue;
        }

        left.nearbyPersonIds.push(right.id);
        right.nearbyPersonIds.push(left.id);
        left.personInteractionFrames += 1;
        right.personInteractionFrames += 1;
        left.lastInteractionWithPersonId = right.id;
        right.lastInteractionWithPersonId = left.id;

        events.push(
          createEvent(
            "person_interaction",
            clamp(1 - proximity / INTERACTION_DISTANCE),
            `${left.id} and ${right.id} entered a close interaction window`,
            "Close two-person proximity increases ambiguity and can indicate a handoff instead of removal.",
            { personId: left.id, relatedPersonId: right.id, zone: left.zone },
          ),
        );

        const leftItem = left.activeItemId ? this.items.get(left.activeItemId) : undefined;
        const rightItem = right.activeItemId ? this.items.get(right.activeItemId) : undefined;

        if (leftItem && !rightItem) {
          left.transferCandidateId = right.id;
          left.transferCandidateFrames += 1;
        }

        if (rightItem && !leftItem) {
          right.transferCandidateId = left.id;
          right.transferCandidateFrames += 1;
        }
      }
    }

    for (const track of this.tracks.values()) {
      if (!track.activeItemId || !track.transferCandidateId || track.transferCandidateFrames < TRANSFER_CONFIRM_FRAMES) {
        continue;
      }

      const item = this.items.get(track.activeItemId);
      const target = this.tracks.get(track.transferCandidateId);
      if (!item || !target) {
        continue;
      }

      item.lastAssociatedPersonId = item.associatedPersonId;
      item.associatedPersonId = target.id;
      item.transferAt = now;
      item.state = "transferred_between_people";
      item.position = { ...target.centroid };
      item.evidence = ["item association changed during close two-person interaction"];

      track.activeItemId = undefined;
      track.associatedItemIds = [];
      track.transferCandidateFrames = 0;
      target.activeItemId = item.id;
      target.associatedItemIds = [item.id];

      events.push(
        createEvent(
          "possible_transfer",
          clamp(item.confidence * 0.82),
          `${item.id} moved from ${track.id} to ${target.id}`,
          "The ownership link changed during sustained close interaction, so the system marks a possible transfer instead of removal.",
          { personId: track.id, relatedPersonId: target.id, itemId: item.id, zone: target.zone, severity: "warning" },
        ),
      );
    }

    const allItems = Array.from(this.items.values());

    for (const track of this.tracks.values()) {
      const linkedItems = allItems.filter((item) => item.associatedPersonId === track.id);
      track.associatedItemIds = linkedItems.map((item) => item.id);
      track.state = derivePersonState(track, linkedItems);

      if (track.state === "interacting_with_person") {
        track.uncertaintyScore = clamp(track.uncertaintyScore + 0.18);
      }

      const risk = assessStoreRisk(track, allItems, now);

      track.riskScore = risk.score;
      track.riskState = risk.state;
      track.riskReasons = risk.reasons;
      track.shouldTriggerBuzzer = risk.shouldTriggerBuzzer;
    }

    for (const [trackId, track] of this.tracks.entries()) {
      if (track.missedFrames > MAX_MISSED_FRAMES) {
        events.push(
          createEvent(
            "lost_tracking",
            clamp(1 - track.uncertaintyScore),
            `${track.id} lost tracking`,
            "The person track aged out after repeated missed frames, so any unresolved item evidence remains uncertain.",
            { personId: track.id, zone: track.zone, severity: "warning" },
          ),
        );

        if (track.activeItemId) {
          const item = this.items.get(track.activeItemId);
          if (item) {
            item.state = "lost_tracking";
            item.associatedPersonId = undefined;
            item.updatedAt = now;
            item.uncertaintyScore = clamp(item.uncertaintyScore + 0.28);
            events.push(
              createEvent(
                "lost_tracking",
                clamp(1 - item.uncertaintyScore),
                `${item.id} became uncertain after person tracking was lost`,
                "The system no longer has a stable person association for this inferred item.",
                { itemId: item.id, severity: "warning" },
              ),
            );
          }
        }

        this.tracks.delete(trackId);
      }
    }

    for (const [itemId, item] of this.items.entries()) {
      if (item.missedFrames > MAX_ITEM_MISSED_FRAMES) {
        if (!item.returnedAt && !item.checkoutAt && !item.exitedAt) {
          events.push(
            createEvent(
              "lost_tracking",
              clamp(1 - item.uncertaintyScore),
              `${item.id} lost item continuity`,
              "Inferred item evidence aged out without a clear return, checkout, or exit resolution.",
              { itemId, severity: "warning" },
            ),
          );
        }

        this.items.delete(itemId);
      }
    }

    for (const track of this.tracks.values()) {
      if (!track.alerted && track.shouldTriggerBuzzer) {
        track.alerted = true;
        track.alertAt = now;
      }
    }

    return this.getState(events);
  }

  markPaid(id: string, method: PaymentMethod) {
    const track = this.tracks.get(id);
    if (!track) {
      return;
    }

    track.paid = true;
    track.paymentState = "paid";
    track.paymentMethod = method;
    track.paymentAt = Date.now();
    track.alerted = false;
    track.alertAt = undefined;
    track.riskState = "benign";
    track.riskScore = 0;
    track.riskReasons = ["payment confirmed"];
    track.shouldTriggerBuzzer = false;
    track.state = "near_checkout";
    track.seenCheckout = true;
    track.lastCheckoutAt = Date.now();

    for (const itemId of track.associatedItemIds) {
      const item = this.items.get(itemId);
      if (!item) {
        continue;
      }

      item.state = "near_checkout";
      item.checkoutAt = Date.now();
      item.confidence = clamp(item.confidence + 0.05);
      item.uncertaintyScore = clamp(item.uncertaintyScore - 0.2);
      item.evidence = ["payment confirmed for associated person"];
    }
  }

  markAlerted(id: string) {
    const track = this.tracks.get(id);
    if (!track) {
      return;
    }

    track.alerted = true;
    track.alertAt = Date.now();
  }

  getState(events: TrackerEvent[] = []): TrackerSnapshot {
    return {
      customers: Array.from(this.tracks.values()).sort((left, right) => left.id.localeCompare(right.id)),
      items: Array.from(this.items.values()).sort((left, right) => left.id.localeCompare(right.id)),
      events,
    };
  }
}
