import type {
  ProductDetectionInput,
  ProductState,
  TrackedCustomer,
  TrackedProduct,
  ZoneDefinition,
} from "@/lib/types";
import { createId } from "@/lib/id";
import { clamp, centroid, distance, identifyZone, iou, smoothBox } from "./tracker-utils";
import { getProductCatalogEntry } from "@/services/product-catalog";

interface ProductTrackRecord extends TrackedProduct {
  missedFrames: number;
  associationFrames: number;
}

const MAX_MISSED_FRAMES = 14;
const IOU_THRESHOLD = 0.12;
const MAX_ASSOCIATION_DISTANCE = 18;
const PRODUCT_ASSOCIATION_DISTANCE = 16;
const TRACK_SMOOTHING_ALPHA = 0.68;
const MIN_ASSOCIATION_FRAMES = 3;

function stateForProduct(
  product: ProductTrackRecord,
  associatedCustomer?: TrackedCustomer,
): ProductState {
  if (product.missedFrames > 0) return "lost_tracking";
  if (product.currentZone === "outside" || product.currentZone === "exit") return "near_exit";
  if (product.currentZone === "checkout") {
    return associatedCustomer ? "at_checkout" : "near_checkout";
  }
  if (associatedCustomer && product.associationFrames >= MIN_ASSOCIATION_FRAMES) {
    return "carried";
  }
  if (product.currentZone === "shelf") return "on_shelf";
  return "moving";
}

function findAssociatedCustomer(
  product: ProductTrackRecord,
  customers: TrackedCustomer[],
): TrackedCustomer | undefined {
  const productCenter = centroid(product.bbox);

  return customers
    .map((customer) => ({
      customer,
      distance: distance(productCenter, customer.centroid),
    }))
    .filter(({ distance: candidateDistance }) => candidateDistance <= PRODUCT_ASSOCIATION_DISTANCE)
    .sort((a, b) => a.distance - b.distance)[0]?.customer;
}

function createProductTrack(
  detection: ProductDetectionInput,
  zones: ZoneDefinition[],
  now: number,
): ProductTrackRecord {
  const center = centroid(detection.bbox);
  const currentZone = identifyZone(center, zones);
  const catalog = getProductCatalogEntry(detection.label);

  return {
    id: createId("PROD"),
    objectClass: detection.label,
    name: catalog?.name ?? detection.label,
    unitPrice: catalog?.unitPrice ?? 0,
    bbox: detection.bbox,
    centroid: center,
    confidence: clamp(detection.confidence),
    state: currentZone === "shelf" ? "on_shelf" : "moving",
    currentZone,
    associatedPersonId: undefined,
    firstSeenAt: now,
    lastSeenAt: now,
    framesSeen: 1,
    pickedUpAt: undefined,
    checkoutAt: undefined,
    nearExitAt: undefined,
    missedFrames: 0,
    associationFrames: 0,
  };
}

export class ProductTracker {
  private tracks = new Map<string, ProductTrackRecord>();

  reset() {
    this.tracks.clear();
  }

  update(
    detections: ProductDetectionInput[],
    zones: ZoneDefinition[],
    customers: TrackedCustomer[] = [],
  ): TrackedProduct[] {
    const now = Date.now();
    const availableTrackIds = new Set(this.tracks.keys());

    for (const product of this.tracks.values()) {
      product.missedFrames += 1;
      product.confidence = clamp(product.confidence - 0.01);
    }

    for (const detection of [...detections].sort((a, b) => b.confidence - a.confidence)) {
      const detectionCenter = centroid(detection.bbox);
      let bestId: string | undefined;
      let bestScore = -1;

      for (const id of availableTrackIds) {
        const product = this.tracks.get(id);
        if (!product || product.objectClass !== detection.label) continue;

        const overlap = iou(product.bbox, detection.bbox);
        const centerDistance = distance(product.centroid, detectionCenter);
        if (overlap < IOU_THRESHOLD && centerDistance > MAX_ASSOCIATION_DISTANCE) continue;

        const score =
          overlap * 0.62 +
          clamp(1 - centerDistance / MAX_ASSOCIATION_DISTANCE) * 0.38;

        if (score > bestScore) {
          bestScore = score;
          bestId = id;
        }
      }

      if (!bestId) {
        const product = createProductTrack(detection, zones, now);
        this.tracks.set(product.id, product);
        continue;
      }

      availableTrackIds.delete(bestId);
      const product = this.tracks.get(bestId);
      if (!product) continue;

      const previousZone = product.currentZone;
      product.bbox = smoothBox(product.bbox, detection.bbox, TRACK_SMOOTHING_ALPHA);
      product.centroid = centroid(product.bbox);
      product.confidence = clamp(detection.confidence * 0.7 + product.confidence * 0.3);
      product.lastSeenAt = now;
      product.framesSeen += 1;
      product.missedFrames = 0;
      product.currentZone = identifyZone(product.centroid, zones);

      const customer = findAssociatedCustomer(product, customers);
      if (customer) {
        if (product.associatedPersonId === customer.id) {
          product.associationFrames += 1;
        } else {
          product.associatedPersonId = customer.id;
          product.associationFrames = 1;
        }

        if (
          product.associationFrames >= MIN_ASSOCIATION_FRAMES &&
          !product.pickedUpAt &&
          previousZone === "shelf"
        ) {
          product.pickedUpAt = now;
        }
      } else {
        product.associationFrames = Math.max(0, product.associationFrames - 1);
      }

      if (product.currentZone === "checkout" && !product.checkoutAt) {
        product.checkoutAt = now;
      }
      if (
        (product.currentZone === "exit" || product.currentZone === "outside") &&
        !product.nearExitAt
      ) {
        product.nearExitAt = now;
      }

      product.state = stateForProduct(product, customer);
    }

    for (const id of availableTrackIds) {
      const product = this.tracks.get(id);
      if (!product) continue;

      product.lastSeenAt = now;
      product.state = "lost_tracking";
      if (product.missedFrames > MAX_MISSED_FRAMES) {
        this.tracks.delete(id);
      }
    }

    for (const product of this.tracks.values()) {
      if (product.missedFrames > 0) continue;
      const customer = findAssociatedCustomer(product, customers);
      product.associatedPersonId = customer?.id ?? product.associatedPersonId;
      product.state = stateForProduct(product, customer);
    }

    return [...this.tracks.values()]
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
      .map(({ missedFrames: _missedFrames, associationFrames: _associationFrames, ...product }) => product);
  }
}
