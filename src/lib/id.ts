export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}
