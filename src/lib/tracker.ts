
import { TrackedCustomer, Zone, ZoneType } from './types';

/**
 * A simple Centroid/IoU Tracker for the browser.
 * Maintains stable IDs for detected bounding boxes.
 */
export class ObjectTracker {
  private nextId = 1;
  private trackers: TrackedCustomer[] = [];
  private maxDisappeared = 15; // Number of frames a tracker can be missing before deletion

  public update(detections: { bbox: number[], score: number }[], zones: Zone[]): TrackedCustomer[] {
    const timestamp = new Date().toISOString();
    const currentFrameTrackers: TrackedCustomer[] = [];

    // Simple IoU-based matching
    detections.forEach((det) => {
      const [x, y, w, h] = det.bbox;
      const detBbox = { x, y, w, h };
      
      let bestMatch: TrackedCustomer | null = null;
      let maxIoU = 0.3; // Threshold for matching

      this.trackers.forEach((t) => {
        const iou = this.calculateIoU(detBbox, t.bbox);
        if (iou > maxIoU) {
          maxIoU = iou;
          bestMatch = t;
        }
      });

      if (bestMatch) {
        // Update existing tracker
        const updatedTracker: TrackedCustomer = {
          ...bestMatch,
          bbox: detBbox,
          confidence: det.score,
          isReal: true,
        };
        
        // Zone logic
        const newZone = this.getZoneForBbox(detBbox, zones);
        if (newZone !== updatedTracker.currentZone) {
          updatedTracker.history = [...updatedTracker.history, { zone: newZone, timestamp }].slice(-10);
          if (newZone === 'billing') {
            updatedTracker.lastBillingZoneEntryTimestamp = timestamp;
          }
          updatedTracker.currentZone = newZone;
        }
        
        currentFrameTrackers.push(updatedTracker);
        // Remove from list so it's not matched again
        this.trackers = this.trackers.filter(t => t.trackerId !== bestMatch!.trackerId);
      } else {
        // Create new tracker
        const id = `T${this.nextId++}`;
        const newZone = this.getZoneForBbox(detBbox, zones);
        currentFrameTrackers.push({
          trackerId: id,
          token: `TK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          bbox: detBbox,
          status: 'unpaid',
          currentZone: newZone,
          lastBillingZoneEntryTimestamp: newZone === 'billing' ? timestamp : null,
          history: [{ zone: newZone, timestamp }],
          confidence: det.score,
          isReal: true,
        });
      }
    });

    // Handle disappeared trackers (simple version: just keep current frame)
    this.trackers = currentFrameTrackers;
    return this.trackers;
  }

  private calculateIoU(box1: any, box2: any) {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.w, box2.x + box2.w);
    const y2 = Math.min(box1.y + box1.h, box2.y + box2.h);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const union = (box1.w * box1.h) + (box2.w * box2.h) - intersection;
    return intersection / union;
  }

  private getZoneForBbox(bbox: { x: number, y: number, w: number, h: number }, zones: Zone[]): ZoneType | 'none' {
    const cx = bbox.x + bbox.w / 2;
    const cy = bbox.y + bbox.h / 2;
    
    for (const zone of zones) {
      if (cx >= zone.x && cx <= zone.x + zone.width && cy >= zone.y && cy <= zone.y + zone.height) {
        return zone.type;
      }
    }
    return 'none';
  }
}
