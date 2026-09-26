import type { ObjectDetection } from "@tensorflow-models/coco-ssd";
import { logger } from "@/lib/logger";

let model: ObjectDetection | null = null;
let loadPromise: Promise<ObjectDetection | null> | null = null;

export async function getCocoSsdModel(): Promise<ObjectDetection | null> {
  if (model) return model;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      await import("@tensorflow/tfjs");
      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      model = await cocoSsd.load();
      return model;
    } catch (error) {
      logger.error("COCO-SSD model failed to load", {
        error: error instanceof Error ? error.message : "unknown error",
      });
      return null;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}
