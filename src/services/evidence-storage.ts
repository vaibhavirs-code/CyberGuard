import type { EvidenceSnapshot } from "@/lib/types";

const DB_NAME = "cyberguard-local-evidence";
const STORE_NAME = "snapshots";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("cameraId", "cameraId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEvidenceSnapshot(snapshot: EvidenceSnapshot): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(snapshot);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadEvidenceSnapshots(cameraId: string): Promise<EvidenceSnapshot[]> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return [];
  const db = await openDatabase();
  const rows = await new Promise<EvidenceSnapshot[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).index("cameraId").getAll(cameraId);
    request.onsuccess = () => resolve((request.result as EvidenceSnapshot[]).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5));
    request.onerror = () => reject(request.error);
  });
  db.close();
  return rows;
}

export async function clearEvidenceSnapshots(cameraId: string): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const index = tx.objectStore(STORE_NAME).index("cameraId");
    const request = index.openCursor(IDBKeyRange.only(cameraId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
